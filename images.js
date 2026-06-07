const repoOwner = "0xnotkyo";
const repoName = "walls";
const branch = "main";
const folders = ["images/mocha", "images/blue", "images/colourize", "images/misc", "images/landscape"];
const imagesPerRow = 4;
const rowsPerPage = 6;
const imagesPerPage = imagesPerRow * rowsPerPage;

let cachedImages = null;
let activeFilter = "all";

async function fetchImages() {
    if (cachedImages) return cachedImages;

    try {
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}?recursive=1`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        cachedImages = data.tree
            .filter(file => file.type === "blob" && folders.some(f => file.path.startsWith(f)))
            .sort((a, b) => a.path.localeCompare(b.path))
            .map(file => ({
                url: `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${file.path}`,
                folder: file.path.split("/")[1]
            }));

        return cachedImages;
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

function getFilteredImages(images) {
    if (activeFilter === "all") return images;
    return images.filter(img => img.folder === activeFilter);
}

function createFilters(images) {
    const existing = document.querySelector('.filters');
    if (existing) existing.remove();

    const folderCounts = { all: images.length };
    images.forEach(img => {
        folderCounts[img.folder] = (folderCounts[img.folder] || 0) + 1;
    });

    const filters = document.createElement('div');
    filters.className = 'filters';

    const labels = { all: "All", mocha: "Mocha", blue: "Blue", colourize: "Colourize", misc: "Misc", landscape: "Landscape" };
    const options = ["all", ...folders.map(f => f.split("/")[1])];

    options.forEach(key => {
        if (!folderCounts[key]) return;
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (key === activeFilter ? ' active' : '');
        btn.textContent = `${labels[key] || key} (${folderCounts[key]})`;
        btn.onclick = () => {
            activeFilter = key;
            loadGalleryPage(1);
        };
        filters.appendChild(btn);
    });

    const gallery = document.querySelector('.gallery');
    gallery.parentNode.insertBefore(filters, gallery);
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
    const allImages = await fetchImages();

    if (allImages.length === 0) {
        gallery.innerHTML = "<p style='text-align:center;'>No se encontraron imágenes.</p>";
        return;
    }

    createFilters(allImages);

    const images = getFilteredImages(allImages);
    const startIndex = (page - 1) * imagesPerPage;
    const endIndex = Math.min(startIndex + imagesPerPage, images.length);
    const pageImages = images.slice(startIndex, endIndex);

    gallery.innerHTML = '';

    pageImages.forEach((image, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <a href="${image.url}" target="_blank">
                <img src="${image.url}" alt="Wallpaper ${startIndex + index + 1}" loading="lazy">
                <div class="gallery-item-info">
                    <span class="gallery-item-title">Wallpaper ${startIndex + index + 1}</span>
                    <i class="fas fa-download download-icon"></i>
                </div>
            </a>
        `;
        gallery.appendChild(div);
    });

    createPagination(images.length, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => loadGalleryPage(1));
