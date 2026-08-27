/* ============================================
   Image Compressor - Memory-Optimized Engine
   Handles 2000+ images via File refs + batched ZIP
   ============================================ */

const MAX_IMAGES = 2000;
const BATCH_SIZE = 100;

let images = [];
let selectedQuality = 0.6;
let uploadedCount = 0;
let compressedCount = 0;
let totalUploaded = 0;
let isCompressing = false;

/* --- DOM References --- */
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
const stickyDownloadBtn = document.getElementById('stickyDownloadBtn');
const stats = document.getElementById('stats');
const modeBtns = document.querySelectorAll('.mode-btn');
const counterUploaded = document.getElementById('counterUploaded');
const counterCompressed = document.getElementById('counterCompressed');
const counterTotal = document.getElementById('counterTotal');
const counterProgressFill = document.getElementById('counterProgressFill');
const batchInfo = document.getElementById('batchInfo');

/* --- Scroll Reveal Observer --- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});

/* --- Lazy Thumbnail Observer --- */
const thumbObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const fileIndex = parseInt(card.dataset.index, 10);
        if (fileIndex >= 0 && fileIndex < images.length && !card.dataset.loaded) {
          card.dataset.loaded = '1';
          generateThumbnail(images[fileIndex].file, card.querySelector('.image-preview'));
        }
        thumbObserver.unobserve(card);
      }
    });
  },
  { threshold: 0, rootMargin: '200px' }
);

/* --- Event Listeners --- */
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

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (isCompressing) return;
    modeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedQuality = parseFloat(btn.dataset.quality);
  });
});

compressBtn.addEventListener('click', compressAll);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);
stickyDownloadBtn.addEventListener('click', downloadAll);

/* --- Counter Update --- */
function updateCounters() {
  counterUploaded.textContent = String(uploadedCount).padStart(4, '0');
  counterCompressed.textContent = String(compressedCount).padStart(4, '0');
  counterTotal.textContent = String(totalUploaded).padStart(4, '0');
}

/* --- File Handling --- */
function handleFiles(files) {
  if (isCompressing) return;

  const jpegFiles = Array.from(files).filter(
    (f) => f.type === 'image/jpeg' || f.name.toLowerCase().endsWith('.jpg')
  );

  if (jpegFiles.length === 0) {
    alert('Por favor, selecciona archivos JPEG (.jpg)');
    return;
  }

  if (jpegFiles.length > MAX_IMAGES) {
    alert(`Maximo ${MAX_IMAGES} imagenes por carga. Seleccionaste ${jpegFiles.length}.`);
    return;
  }

  clearAll();

  images = jpegFiles.map((file) => ({
    file: file,
    originalSize: file.size,
    compressedBlob: null,
    compressedSize: null,
  }));

  totalUploaded = images.length;
  uploadedCount = 0;
  compressedCount = 0;
  updateCounters();

  batchInfo.style.display = 'none';
  controls.style.display = 'block';
  revealObserver.observe(controls);

  images.forEach((img, i) => {
    addImageCard(img, i);
    uploadedCount++;
  });
  updateCounters();

  updateStats();
}

/* --- Thumbnail Generation (on-demand from File) --- */
function generateThumbnail(file, imgEl) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const MAX_WIDTH = 300;
    const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const thumbUrl = URL.createObjectURL(blob);
      imgEl.src = thumbUrl;
      imgEl.onload = () => URL.revokeObjectURL(thumbUrl);
    }, 'image/jpeg', 0.6);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

/* --- Image Card (lightweight placeholder) --- */
function addImageCard(image, index) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.id = `card-${index}`;
  card.dataset.index = index;
  card.style.animationDelay = `${(index % BATCH_SIZE) * 0.03}s`;

  card.innerHTML = `
    <img class="image-preview" alt="${image.file.name}">
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
  thumbObserver.observe(card);
}

/* --- Utilities --- */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateStats() {
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  stats.textContent = `${images.length} imagenes seleccionadas  /  Tamano total: ${formatSize(totalOriginal)}`;
}

/* --- Compression (batched, memory-safe) --- */
async function compressAll() {
  if (isCompressing || images.length === 0) return;
  isCompressing = true;

  compressBtn.disabled = true;
  compressBtn.textContent = 'Comprimiendo...';
  progressContainer.style.display = 'block';
  downloadActions.style.display = 'none';
  stickyDownloadBtn.classList.remove('visible');
  revealObserver.observe(progressContainer);

  compressedCount = 0;
  updateCounters();

  const total = images.length;
  const batches = Math.ceil(total / BATCH_SIZE);

  if (batches > 1) {
    batchInfo.style.display = 'block';
    batchInfo.textContent = `${batches} lotes de ${BATCH_SIZE} imagenes`;
  } else {
    batchInfo.style.display = 'none';
  }

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (let i = 0; i < total; i++) {
    const img = images[i];

    try {
      await compressImage(img, i);
      totalOriginal += img.originalSize;
      totalCompressed += img.compressedSize;
      compressedCount++;
    } catch (err) {
      console.warn(`Error comprimiendo imagen ${i}: ${err.message}`);
      const card = document.getElementById(`card-${i}`);
      if (card) {
        const el = document.getElementById(`reduction-${i}`);
        if (el) {
          el.textContent = 'Error';
          el.style.background = 'rgba(239, 68, 68, 0.12)';
          el.style.color = '#ef4444';
          el.classList.add('visible');
        }
      }
    }

    updateCounters();

    const progress = ((i + 1) / total) * 100;
    progressFill.style.width = `${progress}%`;
    counterProgressFill.style.width = `${progress}%`;
    progressText.textContent = `${i + 1} / ${total} imagenes`;

    if ((i + 1) % 5 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const totalReduction =
    totalOriginal > 0
      ? ((1 - totalCompressed / totalOriginal) * 100).toFixed(1)
      : 0;

  stats.innerHTML = `Compresion completada  /  Original: ${formatSize(totalOriginal)} &rarr; Comprimido: ${formatSize(totalCompressed)}  (<strong>${totalReduction}% reduccion</strong>)`;

  compressBtn.disabled = false;
  compressBtn.textContent = 'Comprimir Todo';
  downloadActions.style.display = 'block';
  stickyDownloadBtn.classList.add('visible');
  isCompressing = false;
}

/* --- Single Image Compression (createImageBitmap, no data URL) --- */
function compressImage(imageObj, index) {
  return new Promise(async (resolve, reject) => {
    try {
      const bitmap = await createImageBitmap(imageObj.file);

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const blob = await new Promise((res, rej) => {
        canvas.toBlob((b) => {
          if (b) res(b);
          else rej(new Error('toBlob returned null'));
        }, 'image/jpeg', selectedQuality);
      });

      imageObj.compressedBlob = blob;
      imageObj.compressedSize = blob.size;

      const reduction = imageObj.originalSize > 0
        ? ((1 - blob.size / imageObj.originalSize) * 100).toFixed(1)
        : 0;

      const sizeEl = document.getElementById(`compressed-${index}`);
      const redEl = document.getElementById(`reduction-${index}`);

      if (sizeEl) sizeEl.textContent = formatSize(blob.size);
      if (redEl) {
        redEl.textContent = `${reduction}% reduccion`;
        redEl.classList.add('visible');
      }

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/* --- Clear All --- */
function clearAll() {
  if (isCompressing) return;

  images = [];
  uploadedCount = 0;
  compressedCount = 0;
  totalUploaded = 0;
  updateCounters();

  imagesGrid.innerHTML = '';
  controls.style.display = 'none';
  progressContainer.style.display = 'none';
  downloadActions.style.display = 'none';
  batchInfo.style.display = 'none';
  stickyDownloadBtn.classList.remove('visible');
  progressFill.style.width = '0%';
  counterProgressFill.style.width = '0%';
  stats.textContent = '';
  fileInput.value = '';
}

/* --- Download (progressive ZIP) --- */
async function downloadAll() {
  const readyImages = images.filter((img) => img.compressedBlob);
  if (readyImages.length === 0) return;

  downloadAllBtn.disabled = true;
  stickyDownloadBtn.disabled = true;
  downloadAllBtn.textContent = 'Creando ZIP...';
  stickyDownloadBtn.textContent = 'Creando ZIP...';

  const zip = new JSZip();
  const folder = zip.folder('imagenes_comprimidas');

  for (let i = 0; i < readyImages.length; i++) {
    const img = readyImages[i];
    const ext = img.file.name.split('.').pop();
    const newName = img.file.name.replace(`.${ext}`, `_compressed.jpg`);
    folder.file(newName, img.compressedBlob);

    if ((i + 1) % 200 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  try {
    const content = await zip.generateAsync(
      { type: 'blob', streamFiles: true },
      (meta) => {
        if (meta.percent) {
          downloadAllBtn.textContent = `ZIP: ${Math.round(meta.percent)}%`;
          stickyDownloadBtn.textContent = `ZIP: ${Math.round(meta.percent)}%`;
        }
      }
    );

    saveAs(content, 'imagenes_comprimidas.zip');
  } catch (err) {
    console.error('Error generando ZIP:', err);
    alert('Error al crear el ZIP. Intenta con menos imagenes.');
  }

  downloadAllBtn.disabled = false;
  stickyDownloadBtn.disabled = false;
  downloadAllBtn.textContent = 'Descargar ZIP';
  stickyDownloadBtn.textContent = 'Descargar ZIP';
}
