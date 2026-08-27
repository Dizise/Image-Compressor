let images = [];
let selectedQuality = 0.8;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const controls = document.getElementById('controls');
const imagesGrid = document.getElementById('imagesGrid');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const compressBtn = document.getElementById('compressBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadActions = document.getElementById('downloadActions');
const stats = document.getElementById('stats');
const modeBtns = document.querySelectorAll('.mode-btn');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedQuality = parseFloat(btn.dataset.quality);
    });
});

compressBtn.addEventListener('click', compressAll);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);

function handleFiles(files) {
    const jpegFiles = Array.from(files).filter(f =>
        f.type === 'image/jpeg' || f.name.toLowerCase().endsWith('.jpg')
    );

    if (jpegFiles.length === 0) {
        alert('Por favor, selecciona archivos JPEG (.jpg)');
        return;
    }

    images = [];
    imagesGrid.innerHTML = '';
    downloadActions.style.display = 'none';

    jpegFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            images.push({
                file: file,
                originalData: e.target.result,
                originalSize: file.size,
                compressedData: null,
                compressedSize: null
            });
            addImageCard(images[images.length - 1], index);

            if (images.length === jpegFiles.length) {
                controls.style.display = 'block';
                updateStats();
            }
        };
        reader.readAsDataURL(file);
    });
}

function addImageCard(image, index) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.id = `card-${index}`;

    card.innerHTML = `
        <img src="${image.originalData}" class="image-preview" alt="${image.file.name}">
        <div class="image-info">
            <div class="image-name">${image.file.name}</div>
            <div class="image-sizes">
                <span class="original-size">Original: ${formatSize(image.originalSize)}</span>
                <span class="compressed-size" id="compressed-${index}">Pendiente</span>
            </div>
            <div class="reduction" id="reduction-${index}"></div>
        </div>
    `;

    imagesGrid.appendChild(card);
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateStats() {
    const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
    stats.textContent = `${images.length} imágenes seleccionadas | Tamaño total: ${formatSize(totalOriginal)}`;
}

async function compressAll() {
    compressBtn.disabled = true;
    compressBtn.textContent = '⏳ Comprimiendo...';
    progressContainer.style.display = 'block';
    downloadActions.style.display = 'none';

    let totalOriginal = 0;
    let totalCompressed = 0;

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await compressImage(img, i);

        totalOriginal += img.originalSize;
        totalCompressed += img.compressedSize;

        const progress = ((i + 1) / images.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${i + 1} / ${images.length} imágenes`;
    }

    const totalReduction = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
    stats.innerHTML = `
        Compresión completada<br>
        Original: ${formatSize(totalOriginal)} → Comprimido: ${formatSize(totalCompressed)}
        (<strong>${totalReduction}% de reducción</strong>)
    `;

    compressBtn.disabled = false;
    compressBtn.textContent = '⚙️ Comprimir Todo';
    downloadActions.style.display = 'block';
}

function compressImage(imageObj, index) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                imageObj.compressedData = URL.createObjectURL(blob);
                imageObj.compressedBlob = blob;
                imageObj.compressedSize = blob.size;

                const reduction = ((1 - blob.size / imageObj.originalSize) * 100).toFixed(1);

                document.getElementById(`compressed-${index}`).textContent = formatSize(blob.size);
                document.getElementById(`reduction-${index}`).textContent = `↓ ${reduction}% reducción`;

                resolve();
            }, 'image/jpeg', selectedQuality);
        };
        img.src = imageObj.originalData;
    });
}

function clearAll() {
    images = [];
    imagesGrid.innerHTML = '';
    controls.style.display = 'none';
    progressContainer.style.display = 'none';
    downloadActions.style.display = 'none';
    stats.textContent = '';
    fileInput.value = '';
}

async function downloadAll() {
    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = '⏳ Creando ZIP...';

    const zip = new JSZip();
    const folder = zip.folder('imagenes_comprimidas');

    images.forEach((img) => {
        const ext = img.file.name.split('.').pop();
        const newName = img.file.name.replace(`.${ext}`, `_compressed.jpg`);
        folder.file(newName, img.compressedBlob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'imagenes_comprimidas.zip');

    downloadAllBtn.disabled = false;
    downloadAllBtn.textContent = '📦 Descargar ZIP';
}
