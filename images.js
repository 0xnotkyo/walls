const repoOwner = "0xnotkyo";
const repoName = "walls";
const branch = "main";
const folders = ["images/mocha", "images/blue", "images/colourize", "images/misc", "images/landscape"];
const imagesPerRow = 4;
const rowsPerPage = 6;
const imagesPerPage = imagesPerRow * rowsPerPage;

let cachedImages = null;

async function fetchImages() {
    if (cachedImages) return cachedImages;

    try {
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}?recursive=1`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        cachedImages = data.tree
            .filter(file => file.type === "blob" && folders.some(f => file.path.startsWith(f)))
            .sort((a, b) => a.path.localeCompare(b.path))
            .map(file => `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${file.path}`);

        return cachedImages;
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

function createPagination(totalImages, currentPage) {
    const totalPages = Math.ceil(totalImages / imagesPerPage);
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    if (currentPage > 1) {
        const prevButton = document.createElement('a');
        prevButton.href = '#';
        prevButton.textContent = 'Anterior';
        prevButton.onclick = (e) => { e.preventDefault(); loadGalleryPage(currentPage - 1); };
        pagination.appendChild(prevButton);
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            if (i === currentPage) pageLink.classList.add('active');
            pageLink.onclick = (e) => { e.preventDefault(); loadGalleryPage(i); };
            pagination.appendChild(pageLink);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('a');
        nextButton.href = '#';
        nextButton.textContent = 'Siguiente';
        nextButton.onclick = (e) => { e.preventDefault(); loadGalleryPage(currentPage + 1); };
        pagination.appendChild(nextButton);
    }
}

async function loadGalleryPage(page = 1) {
    const gallery = document.querySelector('.gallery');
    const images = await fetchImages();

    if (images.length === 0) {
        gallery.innerHTML = "<p style='text-align:center;'>No se encontraron imágenes.</p>";
        return;
    }

    const startIndex = (page - 1) * imagesPerPage;
    const endIndex = Math.min(startIndex + imagesPerPage, images.length);
    const pageImages = images.slice(startIndex, endIndex);

    gallery.innerHTML = '';

    pageImages.forEach((imageUrl, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <a href="${imageUrl}" target="_blank">
                <img src="${imageUrl}" alt="Wallpaper ${startIndex + index + 1}" loading="lazy">
                <div class="gallery-item-info">
                    <span class="gallery-item-title">Wallpaper ${startIndex + index + 1}</span>
                    <i class="fas fa-download download-icon"></i>
                </div>
            </a>
        `;
        gallery.appendChild(div);
    });

    createPagination(images.length, page);
}

document.addEventListener('DOMContentLoaded', () => loadGalleryPage(1));

