/* ============================================
   File Compressor - Memory-Optimized Engine
   Configurable via window.TYPE_CONFIG
   Handles large batches via File refs + ZIP
   ============================================ */

const MAX_IMAGES = 2000;
const BATCH_SIZE = 100;

const CONFIG = Object.assign(
  {
    id: 'jpeg',
    kind: 'canvas',
    accept: 'image/jpeg,image/jpg',
    exts: [],
    outputMime: 'image/jpeg',
    outputExt: 'jpg',
    preview: true,
    noun: 'imagenes',
    selectedText: 'imagenes seleccionadas',
    modes: [
      { label: 'Baja', value: 0.8, display: '80%' },
      { label: 'Media', value: 0.6, display: '60%' },
      { label: 'Alta', value: 0.4, display: '40%' },
    ],
  },
  window.TYPE_CONFIG || {}
);

let images = [];
let selectedMode = null;
let uploadedCount = 0;
let compressedCount = 0;
let totalUploaded = 0;
let isCompressing = false;

/* --- Build UI Shell (same markup/design as original) --- */
function buildShell() {
  const app = document.getElementById('app');
  if (!app) return;

  const modeBtns = CONFIG.modes
    .map((m, i) => `
      <button class="mode-btn${i === 1 ? ' active' : ''}" data-index="${i}">
        <span class="mode-label">${m.label}</span>
        <span class="mode-value">${m.display}</span>
      </button>`)
    .join('');

  app.innerHTML = `
    <div class="status-bar reveal" id="statusBar">
      <div class="counter-group">
        <div class="counter">
          <span class="counter-value" id="counterUploaded">0000</span>
          <span class="counter-label">Subidas</span>
        </div>
        <div class="counter-divider"></div>
        <div class="counter">
          <span class="counter-value" id="counterCompressed">0000</span>
          <span class="counter-label">Comprimidas</span>
        </div>
        <div class="counter-divider"></div>
        <div class="counter">
          <span class="counter-value counter-total" id="counterTotal">0000</span>
          <span class="counter-label">Max</span>
        </div>
      </div>
      <div class="counter-progress">
        <div class="counter-progress-fill" id="counterProgressFill"></div>
      </div>
    </div>

    <section class="upload-zone reveal" id="dropZone" aria-label="Zona de carga de archivos">
      <div class="upload-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="12" width="36" height="28" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M6 20h36" stroke="currentColor" stroke-width="2"/>
          <path d="M24 6l-8 8h6v8h4v-8h6l-8-8z" fill="currentColor"/>
        </svg>
      </div>
      <p class="upload-text">Arrastra tus archivos aqui</p>
      <p class="upload-subtext">o haz clic para seleccionar / max. ${MAX_IMAGES} ${CONFIG.noun}</p>
      <input type="file" id="fileInput" multiple accept="${CONFIG.accept}" hidden>
    </section>

    <div class="controls reveal" id="controls" style="display: none;">
      <div class="compression-modes">${modeBtns}</div>
      <div class="stats" id="stats"></div>
      <p class="batch-info" id="batchInfo" style="display: none;"></p>
      <div class="actions">
        <button class="btn btn-primary" id="compressBtn">Comprimir Todo</button>
        <button class="btn btn-secondary" id="clearBtn">Limpiar</button>
      </div>
    </div>

    <div class="progress-container reveal" id="progressContainer" style="display: none;">
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <p class="progress-text" id="progressText">0 / 0 ${CONFIG.noun}</p>
    </div>

    <div class="images-grid" id="imagesGrid"></div>

    <div class="download-actions" id="downloadActions" style="display: none;">
      <button class="btn btn-success" id="downloadAllBtn">Descargar ZIP</button>
    </div>`;
}

buildShell();
selectedMode = CONFIG.modes[1] || CONFIG.modes[0] || { value: null, label: '', display: '' };

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
    selectedMode = CONFIG.modes[parseInt(btn.dataset.index, 10)] || selectedMode;
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
function isAccepted(file) {
  if (CONFIG.accept === '*' || CONFIG.accept === '*/*') return true;
  const name = file.name.toLowerCase();
  for (const ext of CONFIG.exts) {
    if (name.endsWith(ext.toLowerCase())) return true;
  }
  return CONFIG.accept
    .split(',')
    .map((s) => s.trim())
    .some((t) => t === file.type);
}

function handleFiles(files) {
  if (isCompressing) return;

  const accepted = Array.from(files).filter(isAccepted);

  if (accepted.length === 0) {
    alert(`Por favor, selecciona archivos ${CONFIG.id.toUpperCase()} validos`);
    return;
  }

  if (accepted.length > MAX_IMAGES) {
    alert(`Maximo ${MAX_IMAGES} archivos por carga. Seleccionaste ${accepted.length}.`);
    return;
  }

  clearAll();

  images = accepted.map((file) => ({
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

  const safeName = image.file.name.replace(/[<>&"']/g, '');
  const ext = image.file.name.split('.').pop() || CONFIG.id;

  const previewHTML = CONFIG.preview
    ? `<img class="image-preview" alt="${safeName}">`
    : `<div class="file-type-block">${ext.toUpperCase()}</div>`;

  card.innerHTML = `
    ${previewHTML}
    <div class="image-info">
      <div class="image-name">${safeName}</div>
      <div class="image-sizes">
        <span class="original-size">Original: ${formatSize(image.originalSize)}</span>
        <span class="compressed-size" id="compressed-${index}">Pendiente</span>
      </div>
      <div class="reduction" id="reduction-${index}"></div>
    </div>
  `;

  imagesGrid.appendChild(card);
  if (CONFIG.preview) thumbObserver.observe(card);
}

/* --- Utilities --- */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateStats() {
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  stats.textContent = `${images.length} ${CONFIG.selectedText} / Tamano total: ${formatSize(totalOriginal)}`;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('toBlob devolvio null'));
    }, mime, quality);
  });
}

function decodeImage(file) {
  return new Promise((resolve, reject) => {
    if (window.createImageBitmap) {
      createImageBitmap(file)
        .then((bmp) =>
          resolve({ source: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() })
        )
        .catch(() => loadImg(file).then(resolve).catch(reject));
    } else {
      loadImg(file).then(resolve).catch(reject);
    }
  });
}

function loadImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        source: img,
        w: img.naturalWidth,
        h: img.naturalHeight,
        close: () => {},
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar la imagen'));
    };
    img.src = url;
  });
}

function canvasFromSource(dec, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(dec.source, 0, 0, w, h);
  return canvas;
}

let _avifSupported;
function avifSupported() {
  if (_avifSupported === undefined) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    _avifSupported = c.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
  return _avifSupported;
}

/* --- Apply result to card --- */
function applyResult(imageObj, index, blob) {
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
}

/* --- Compression (batched, memory-safe) --- */
async function compressAll() {
  if (isCompressing || images.length === 0) return;

  if (CONFIG.kind === 'canvas' && CONFIG.outputMime === 'image/avif' && !avifSupported()) {
    alert('Tu navegador no soporta codificacion AVIF. Usa Chrome o Edge.');
    return;
  }

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
    batchInfo.textContent = `${batches} lotes de ${BATCH_SIZE} ${CONFIG.noun}`;
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
    progressText.textContent = `${i + 1} / ${total} ${CONFIG.noun}`;

    if ((i + 1) % 5 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const totalReduction =
    totalOriginal > 0
      ? ((1 - totalCompressed / totalOriginal) * 100).toFixed(1)
      : 0;

  stats.innerHTML = `Compresion completada / Original: ${formatSize(totalOriginal)} &rarr; Comprimido: ${formatSize(totalCompressed)} (<strong>${totalReduction}% reduccion</strong>)`;

  compressBtn.disabled = false;
  compressBtn.textContent = 'Comprimir Todo';
  downloadActions.style.display = 'block';
  stickyDownloadBtn.classList.add('visible');
  isCompressing = false;
}

/* --- Single File Compression --- */
async function compressImage(imageObj, index) {
  switch (CONFIG.kind) {
    case 'canvas':
      return compressCanvas(imageObj);
    case 'gif':
      return compressGif(imageObj);
    case 'svg':
      return compressSvg(imageObj);
    case 'heic':
      return compressHeic(imageObj);
    case 'mp3':
      return compressMp3(imageObj);
    case 'zip':
      return compressZipItem(imageObj);
    default:
      throw new Error('Tipo desconocido');
  }
}

/* --- canvas kinds: JPEG / PNG / WEBP / AVIF / BMP --- */
async function compressCanvas(imageObj) {
  const v = selectedMode.value;
  const quality = typeof v === 'number' ? v : null;
  const resize = v && typeof v === 'object' && v.resize ? v.resize : 1;
  const flatten = !!(v && typeof v === 'object' && v.flatten);

  const dec = await decodeImage(imageObj.file);
  const w = Math.max(1, Math.round(dec.w * resize));
  const h = Math.max(1, Math.round(dec.h * resize));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (flatten) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(dec.source, 0, 0, w, h);
  dec.close();

  const blob = await canvasToBlob(canvas, CONFIG.outputMime, quality);
  applyResult(imageObj, getResultIndex(imageObj), blob);
}

/* --- GIF re-encode (ImageDecoder + gif.js) --- */
let _gifWorkerUrl;
async function getGifWorker() {
  if (_gifWorkerUrl) return _gifWorkerUrl;
  const res = await fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js');
  if (!res.ok) throw new Error('No se pudo cargar el worker de GIF');
  const blob = await res.blob();
  _gifWorkerUrl = URL.createObjectURL(blob);
  return _gifWorkerUrl;
}

async function compressGif(imageObj) {
  const v = selectedMode.value || { quality: 10, skip: 0 };
  const quality = typeof v.quality === 'number' ? v.quality : 10;
  const skip = Math.max(0, Math.floor(v.skip || 0));
  const file = imageObj.file;
  const buffer = await file.arrayBuffer();

  let frames = [];
  let width = 0;
  let height = 0;

  if (window.ImageDecoder) {
    try {
      const decoder = new ImageDecoder({ data: buffer, type: file.type || 'image/gif' });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      const count = track.frameCount;
      if (count) {
        const step = skip + 1;
        for (let i = 0; i < count; i++) {
          const frame = await decoder.decode({ frameIndex: i });
          if (i % step === 0) {
            width = frame.image.displayWidth || frame.image.width;
            height = frame.image.displayHeight || frame.image.height;
            frames.push({
              source: frame.image,
              w: width,
              h: height,
              delay: Math.max(30, Math.round((frame.duration || 400) / 1000)),
            });
          } else {
            frame.image.close();
          }
        }
      }
      decoder.close();
    } catch (err) {
      console.warn('ImageDecoder fallo, usando primer frame:', err);
      frames = [];
    }
  }

  if (frames.length === 0) {
    const dec = await decodeImage(file);
    width = dec.w;
    height = dec.h;
    frames.push({ source: dec.source, w: dec.w, h: dec.h, delay: 100 });
  }

  const canvases = frames.map((f) => {
    const cv = canvasFromSource(f, f.w, f.h);
    if (f.source && typeof f.source.close === 'function') f.source.close();
    return { canvas: cv, delay: f.delay };
  });

  const workerUrl = await getGifWorker();
  const gif = new GIF({
    workers: 2,
    quality,
    width,
    height,
    workerScript: workerUrl,
  });

  const blob = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout generando GIF')), 90000);
    gif.on('finished', (b) => {
      clearTimeout(timeout);
      resolve(b);
    });
    gif.on('abort', () => {
      clearTimeout(timeout);
      reject(new Error('abort al generar GIF'));
    });
    canvases.forEach(({ canvas, delay }) => gif.addFrame(canvas, { delay }));
    gif.render();
  });

  applyResult(imageObj, getResultIndex(imageObj), blob);
}

/* --- SVG minifier --- */
function minifySVG(text, level) {
  let s = text;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\?xml[^>]*\?>/g, '');
  s = s.replace(/<!DOCTYPE[^>]*>/gi, '');
  if (level >= 1) {
    s = s.replace(/\s+/g, ' ');
    s = s.replace(/> </g, '><');
  }
  if (level >= 2) {
    s = s.replace(/>\s*<\/[^>]+>/g, '></');
  }
  return s.trim();
}

async function compressSvg(imageObj) {
  const text = await imageObj.file.text();
  const level = typeof selectedMode.value === 'number' ? selectedMode.value : 1;
  const out = minifySVG(text, level);
  const blob = new Blob([out], { type: 'image/svg+xml' });
  applyResult(imageObj, getResultIndex(imageObj), blob);
}

/* --- HEIC (heic2any) -> JPEG --- */
async function compressHeic(imageObj) {
  if (!window.heic2any) throw new Error('heic2any no disponible');

  const v = selectedMode.value || { scale: 1, quality: 0.85 };
  const scale = v.scale || 1;
  const quality = typeof v.quality === 'number' ? v.quality : 0.85;

  const out = await heic2any({
    blob: imageObj.file,
    toType: ['image/jpeg'],
    quality,
  });
  const jpg = Array.isArray(out) ? out[0] : out;
  if (!jpg) throw new Error('No se pudo convertir HEIC');

  if (scale < 1) {
    const dec = await decodeImage(new File([jpg], imageObj.file.name, { type: 'image/jpeg' }));
    const canvas = canvasFromSource(
      dec,
      Math.max(1, Math.round(dec.w * scale)),
      Math.max(1, Math.round(dec.h * scale))
    );
    dec.close();
    const scaled = await canvasToBlob(canvas, 'image/jpeg', quality);
    applyResult(imageObj, getResultIndex(imageObj), scaled);
  } else {
    applyResult(imageObj, getResultIndex(imageObj), jpg);
  }
}

/* --- MP3 (lamejs) --- */
async function compressMp3(imageObj) {
  if (!window.lamejs) throw new Error('lamejs no disponible');

  const kbps = typeof selectedMode.value === 'number' ? selectedMode.value : 192;
  const buffer = await imageObj.file.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('AudioContext no disponible');

  const ctx = new AC();
  const audio = await ctx.decodeAudioData(buffer);

  const channels = Math.min(2, audio.numberOfChannels);
  const sampleRate = audio.sampleRate;
  const left = audio.getChannelData(0);
  const right = channels >= 2 ? audio.getChannelData(1) : null;

  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  const blockSize = 1152;
  const out = [];

  for (let i = 0; i < left.length; i += blockSize) {
    const l = left.subarray(i, i + blockSize);
    const r = right ? right.subarray(i, i + blockSize) : l;
    const b = encoder.encodeBuffer(l, r);
    if (b.length) out.push(b);
  }

  const end = encoder.flush();
  if (end.length) out.push(end);
  ctx.close();

  const blob = new Blob(out, { type: 'audio/mpeg' });
  applyResult(imageObj, getResultIndex(imageObj), blob);
}

/* --- ZIP items (deflate preview) --- */
async function compressZipItem(imageObj) {
  if (!window.CompressionStream) throw new Error('CompressionStream no disponible');
  const stream = imageObj.file.stream().pipeThrough(new CompressionStream('deflate'));
  const blob = await new Response(stream).blob();
  applyResult(imageObj, getResultIndex(imageObj), blob);
}

/* --- Find result index from object (stable for skipped cards) --- */
function getResultIndex(imageObj) {
  return images.indexOf(imageObj);
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
  const folder = zip.folder(`comprimidos_${CONFIG.id}`);
  const zipLevel = typeof selectedMode.value === 'number' ? selectedMode.value : 6;

  for (let i = 0; i < readyImages.length; i++) {
    const img = readyImages[i];

    if (CONFIG.kind === 'zip') {
      folder.file(img.file.name, img.file, {
        compression: 'DEFLATE',
        compressionOptions: { level: zipLevel },
      });
    } else {
      const base = img.file.name.replace(/\.[^.]+$/, '');
      let newName;
      if (CONFIG.kind === 'svg') newName = img.file.name.replace(/\.svg$/i, '.min.svg');
      else if (CONFIG.kind === 'mp3') newName = `${base}.mp3`;
      else if (CONFIG.kind === 'heic') newName = `${base}_comprimido.jpg`;
      else newName = `${base}_comprimido.${CONFIG.outputExt}`;
      folder.file(newName, img.compressedBlob);
    }

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

    saveAs(content, `${CONFIG.id}_comprimidos.zip`);
  } catch (err) {
    console.error('Error generando ZIP:', err);
    alert('Error al crear el ZIP. Intenta con menos archivos.');
  }

  downloadAllBtn.disabled = false;
  stickyDownloadBtn.disabled = false;
  downloadAllBtn.textContent = 'Descargar ZIP';
  stickyDownloadBtn.textContent = 'Descargar ZIP';
}