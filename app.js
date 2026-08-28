/* ============================================
   Image Compressor - Memory-Optimized Engine
   Handles 2000+ images via File refs + batched ZIP
   ============================================ */

const MAX_IMAGES = 2000;
const BATCH_SIZE = 100;

const IMAGE_MIMES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4',
];
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'mp4'];

let images = [];
let selectedQuality = 0.6;
let uploadedCount = 0;
let compressedCount = 0;
let totalUploaded = 0;
let isCompressing = false;
let isRemovingBg = false;

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
const outputFormatSelect = document.getElementById('outputFormat');
const bgRemoveToggle = document.getElementById('bgRemoveToggle');
const bgConfig = document.getElementById('bgConfig');
const bgStatus = document.getElementById('bgStatus');
const removeBgBtn = document.getElementById('removeBgBtn');

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
removeBgBtn.addEventListener('click', removeBackgrounds);

bgRemoveToggle.addEventListener('change', () => {
  bgConfig.style.display = bgRemoveToggle.checked ? 'block' : 'none';
});

outputFormatSelect.addEventListener('change', () => {
  if (isCompressing || isRemovingBg) return;
  updateStats();
});

/* --- Counter Update --- */
function updateCounters() {
  counterUploaded.textContent = String(uploadedCount).padStart(4, '0');
  counterCompressed.textContent = String(compressedCount).padStart(4, '0');
  counterTotal.textContent = String(totalUploaded).padStart(4, '0');
}

/* --- File Handling --- */
function getExtension(name) {
  return name.split('.').pop().toLowerCase();
}

function isAllowed(file) {
  return (
    ALLOWED_TYPES.includes(file.type) ||
    ALLOWED_EXTS.includes(getExtension(file.name))
  );
}

function isVideoOf(file) {
  return file.type.startsWith('video/') || file.type === 'video/mp4' || getExtension(file.name) === 'mp4';
}

function handleFiles(files) {
  if (isCompressing || isRemovingBg) return;

  const validFiles = Array.from(files).filter(isAllowed);

  if (validFiles.length === 0) {
    alert('Por favor, selecciona archivos con formato valido (JPG, PNG, WEBP, GIF, AVIF o MP4)');
    return;
  }

  if (validFiles.length > MAX_IMAGES) {
    alert(`Maximo ${MAX_IMAGES} archivos por carga. Seleccionaste ${validFiles.length}.`);
    return;
  }

  clearAll();

  images = validFiles.map((file) => ({
    file: file,
    originalSize: file.size,
    originalFormat: getExtension(file.name) === 'jpeg' ? 'jpg' : getExtension(file.name),
    compressedBlob: null,
    compressedSize: null,
    isVideo: isVideoOf(file),
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
  const isVideo = file.type.startsWith('video/') || getExtension(file.name) === 'mp4';

  const renderThumb = (source) => {
    const MAX_WIDTH = 300;
    const scale = source.width > MAX_WIDTH ? MAX_WIDTH / source.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = source.width * scale;
    canvas.height = source.height * scale;
    const ctx = canvas.getContext('2d');
    if (isVideo) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const thumbUrl = URL.createObjectURL(blob);
      imgEl.src = thumbUrl;
      imgEl.onload = () => URL.revokeObjectURL(thumbUrl);
    }, 'image/jpeg', 0.6);
  };

  if (isVideo) {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;
    video.onloadeddata = () => {
      video.currentTime = 0;
      renderThumb(video);
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration || 0);
    };
    return;
  }

  const img = new Image();
  img.onload = () => renderThumb(img);
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
  const videos = images.filter((img) => img.isVideo).length;
  let text = `${images.length} archivos seleccionados  /  Tamano total: ${formatSize(totalOriginal)}`;
  if (videos > 0) text += `  /  ${videos} video(s)`;
  const fmt = outputFormatSelect.value;
  if (fmt !== 'original') text += `  /  Salida: ${fmt.toUpperCase()}`;
  stats.textContent = text;
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
    batchInfo.textContent = `${batches} lotes de ${BATCH_SIZE} archivos`;
  } else {
    batchInfo.style.display = 'none';
  }

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (let i = 0; i < total; i++) {
    const img = images[i];

    try {
      if (img.isVideo) {
        await compressVideo(img, i);
      } else {
        await compressImage(img, i);
      }
      totalOriginal += img.originalSize;
      totalCompressed += img.compressedSize;
      compressedCount++;
    } catch (err) {
      console.warn(`Error comprimiendo archivo ${i}: ${err.message}`);
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
    progressText.textContent = `${i + 1} / ${total} archivos`;

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
function getOutputMime(originalMime, originalExt) {
  const fmt = outputFormatSelect.value;
  if (fmt === 'original') {
    return originalMime || IMAGE_MIMES[originalExt] || 'image/jpeg';
  }
  return IMAGE_MIMES[fmt] || 'image/webp';
}

function compressImage(imageObj, index) {
  return new Promise(async (resolve, reject) => {
    try {
      const bitmap = await createImageBitmap(imageObj.file);

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const outMime = getOutputMime(IMAGE_MIMES[imageObj.originalFormat], imageObj.originalFormat);
      let blob;

      if (outMime === 'image/gif') {
        blob = await canvasToGif(canvas);
      } else {
        const quality = outMime === 'image/png' ? 1 : selectedQuality;
        blob = await new Promise((res, rej) => {
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob returned null'))), outMime, quality);
        });
      }

      imageObj.compressedBlob = blob;
      imageObj.compressedSize = blob.size;
      imageObj.outputMime = blob.type || outMime;

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

/* --- Video compression via MediaRecorder --- */
function compressVideo(imageObj, index) {
  return new Promise(async (resolve, reject) => {
    let url = null;
    try {
      url = URL.createObjectURL(imageObj.file);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = url;

      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = () => rej(new Error('No se pudo leer el video'));
        setTimeout(() => rej(new Error('Timeout al leer el video')), 15000);
      });

      const duration = isFinite(video.duration) ? video.duration : 5;
      const bitsPerSecond = Math.max(
        250_000,
        Math.round((imageObj.originalSize * 8 * selectedQuality) / Math.max(duration, 1))
      );
      const capDuration = Math.min(duration, 60);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const stream = video.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitsPerSecond });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      const done = new Promise((res) => { recorder.onstop = res; });

      recorder.start(250);
      video.currentTime = 0;
      await video.play();

      const stopWhen = new Promise((res) => {
        video.addEventListener('ended', res, { once: true });
        setTimeout(res, capDuration * 1000 + 1500);
      });
      await stopWhen;

      await video.pause();
      stream.getTracks().forEach((t) => t.stop());
      recorder.stop();
      await done;

      URL.revokeObjectURL(url);
      url = null;

      const blob = new Blob(chunks, { type: mimeType });

      imageObj.compressedBlob = blob;
      imageObj.compressedSize = blob.size;
      imageObj.outputMime = mimeType;

      const reduction = imageObj.originalSize > 0
        ? ((1 - blob.size / imageObj.originalSize) * 100).toFixed(1)
        : 0;

      const sizeEl = document.getElementById(`compressed-${index}`);
      const redEl = document.getElementById(`reduction-${index}`);
      if (sizeEl) sizeEl.textContent = formatSize(blob.size);
      if (redEl) {
        redEl.textContent = `${reduction}% reduccion (WEBM)`;
        redEl.classList.add('visible');
      }

      resolve();
    } catch (err) {
      if (url) URL.revokeObjectURL(url);
      reject(err);
    }
  });
}

/* --- GIF encoding from canvas (simplified, 8-color palettized) --- */
function canvasToGif(canvas) {
  return new Promise((resolve, reject) => {
    try {
      const gif = new GIF({
        workers: 0,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
      });
      gif.addFrame(canvas, { copy: true, delay: 0 });
      gif.on('finished', (blob) => resolve(blob));
      gif.on('error', reject);
      gif.render();
    } catch (err) {
      reject(new Error('Generador GIF no disponible: ' + err.message));
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
  bgConfig.style.display = 'none';
  bgRemoveToggle.checked = false;
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
  const folder = zip.folder('archivos_procesados');

  for (let i = 0; i < readyImages.length; i++) {
    const img = readyImages[i];
    const baseName = img.file.name.replace(/\.[^.]+$/, '');
    const ext = extFromMime(img.outputMime || img.compressedBlob.type) || 'jpg';
    const newName = `${baseName}_compressed.${ext}`;
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

    saveAs(content, 'archivos_procesados.zip');
  } catch (err) {
    console.error('Error generando ZIP:', err);
    alert('Error al crear el ZIP. Intenta con menos archivos.');
  }

  downloadAllBtn.disabled = false;
  stickyDownloadBtn.disabled = false;
  downloadAllBtn.textContent = 'Descargar ZIP';
  stickyDownloadBtn.textContent = 'Descargar ZIP';
}

/* --- Mime to extension --- */
function extFromMime(mime) {
  if (!mime) return null;
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'video/webm') return 'webm';
  const m = mime.split('/')[1];
  return m || null;
}

/* --- Background Removal (AI local en navegador, IMG.LY ISNet/ONNX) --- */
async function getBgRemover() {
  if (typeof window.__loadRemoveBackground === 'function') {
    return await window.__loadRemoveBackground();
  }
  throw new Error('El modulo de eliminacion de fondo no cargo correctamente. Recarga la pagina.');
}

function setBgStatus(text) {
  if (!bgStatus) return;
  bgStatus.style.display = 'block';
  bgStatus.textContent = text;
}

async function removeBackgrounds() {
  if (isRemovingBg || isCompressing) return;

  const imageItems = images.filter((img) => !img.isVideo);
  if (imageItems.length === 0) {
    alert('No hay imagenes para procesar.');
    return;
  }

  isRemovingBg = true;
  removeBgBtn.disabled = true;
  removeBgBtn.textContent = 'Cargando modelo...';
  setBgStatus('Cargando el modelo de IA (solo la primera vez, ~80MB)...');
  progressContainer.style.display = 'block';
  revealObserver.observe(progressContainer);

  let remover;
  try {
    remover = await getBgRemover();
  } catch (err) {
    console.error('Error cargando el modelo:', err);
    alert('No se pudo cargar el modelo de IA. Verifica tu conexion y recarga la pagina.');
    removeBgBtn.disabled = false;
    removeBgBtn.textContent = 'Quitar Fondo (IA)';
    progressContainer.style.display = 'none';
    setBgStatus('Error al cargar el modelo.');
    isRemovingBg = false;
    return;
  }

  setBgStatus('Modelo listo. Procesando imagenes...');
  removeBgBtn.textContent = 'Quitando fondo...';

  let ok = 0;
  let fail = 0;
  const total = imageItems.length;
  let processed = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.isVideo) continue;
    processed++;

    try {
      const resultBlob = await remover(img.file, {
        model: 'isnet_fp16',
        output: { format: 'image/png', quality: 1 },
        device: 'cpu',
      });

      img.file = new File([resultBlob], 'removed.png', { type: 'image/png' });
      img.originalSize = resultBlob.size;
      img.originalFormat = 'png';
      img.compressedBlob = null;
      img.compressedSize = null;
      img.isVideo = false;
      img.outputMime = 'image/png';
      img.backgroundRemoved = true;

      ok++;

      const sizeEl = document.getElementById(`compressed-${i}`);
      const redEl = document.getElementById(`reduction-${i}`);
      if (sizeEl) {
        sizeEl.textContent = 'Fondo eliminado';
        sizeEl.style.color = '#22c55e';
      }
      if (redEl) {
        redEl.textContent = 'PNG con transparencia';
        redEl.classList.add('visible');
      }
    } catch (err) {
      console.warn(`Error quitando fondo ${i}: ${err.message}`);
      fail++;
      const el = document.getElementById(`reduction-${i}`);
      if (el) {
        el.textContent = 'Error fondo';
        el.style.background = 'rgba(239, 68, 68, 0.12)';
        el.style.color = '#ef4444';
        el.classList.add('visible');
      }
    }

    const progress = (processed / total) * 100;
    progressFill.style.width = `${progress}%`;
    counterProgressFill.style.width = `${progress}%`;
    progressText.textContent = `${processed} / ${total} fondos`;

    await new Promise((r) => setTimeout(r, 0));
  }

  progressFill.style.width = '100%';
  counterProgressFill.style.width = '100%';
  progressText.textContent = `${total} / ${total} fondos`;

  if (fail > 0) {
    alert(`${ok} procesadas, ${fail} con error.`);
  }

  removeBgBtn.disabled = false;
  removeBgBtn.textContent = 'Quitar Fondo (IA)';
  progressContainer.style.display = 'none';
  setBgStatus('');
  updateStats();
  isRemovingBg = false;
}

/* --- Preload helper (optional, warm up the model in the background) --- */
async function preloadBgModel() {
  try {
    if (typeof window.__loadRemoveBackground !== 'function') return;
    const remover = await window.__loadRemoveBackground();
    if (remover && remover.preload) {
      await remover.preload({ model: 'isnet_fp16', device: 'cpu' });
    }
  } catch (e) {
    console.warn('No se pudo pre-cargar el modelo:', e);
  }
}

if (bgRemoveToggle) {
  bgRemoveToggle.addEventListener('change', async () => {
    bgConfig.style.display = bgRemoveToggle.checked ? 'block' : 'none';
    if (bgRemoveToggle.checked) {
      setBgStatus('');
      preloadBgModel();
    }
  });
}
