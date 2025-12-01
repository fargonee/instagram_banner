// script.js — FINAL WORKING VERSION for FarGonE Instagram 3-Split Tool
let originalImage = null;
let usePNG = false;

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const resultDiv = document.getElementById('result');
const pngToggle = document.getElementById('png-mode');

// === CLICK & DRAG/DROP HANDLING ===
dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('click', e => e.stopPropagation());

['dragover', 'dragenter'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'dragend', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

const handleFile = (file) => {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      preview.classList.remove('hidden');
      runSplit('free'); // default mode
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

dropzone.addEventListener('drop', e => {
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

// === MODE BUTTONS ===
document.querySelectorAll('.mode-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-buttons button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    runSplit(btn.dataset.mode);
  });
});

// === PNG TOGGLE ===
pngToggle.addEventListener('change', e => {
  usePNG = e.target.checked;
  if (originalImage) runSplit(document.querySelector('.mode-buttons .active').dataset.mode);
});

// === MAIN SPLIT FUNCTION ===
function runSplit(mode) {
  resultDiv.innerHTML = `
    <h3 style="text-align:center; margin:40px 0 20px; color:#e4405f; font-size:1.8rem;">
      ${mode === 'free' ? 'Free Split' : mode === 'grid' ? 'Grid 3:4 (1080×1440)' : 'Square'} 
      <span style="font-size:0.9rem; opacity:0.8;">
        ${usePNG ? '• PNG (100% Lossless)' : '• JPG (High Quality)'}
      </span>
    </h3>
    <div class="images"></div>
  `;

  const imagesContainer = resultDiv.querySelector('.images');
  imagesContainer.innerHTML = ''; // clear previous

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const parts = [];

  const w = originalImage.width;
  const h = originalImage.height;
  const partW = Math.floor(w / 3);

  for (let i = 0; i < 3; i++) {
    const left = i * partW;
    const right = i === 2 ? w : left + partW;
    const pw = right - left;

    canvas.width = pw;
    canvas.height = h;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, left, 0, pw, h, 0, 0, pw, h);

    let finalCanvas = canvas;

    if (mode === 'grid') {
      const targetH = Math.round(pw * 1440 / 1080);
      const top = Math.max(0, Math.floor((h - targetH) / 2));

      finalCanvas = document.createElement('canvas');
      finalCanvas.width = 1080;
      finalCanvas.height = 1440;
      const fctx = finalCanvas.getContext('2d');
      fctx.drawImage(canvas, 0, top, pw, targetH, 0, 0, 1080, 1440);
    }

    if (mode === 'square') {
      const side = Math.min(pw, h);
      const top = Math.floor((h - side) / 2);

      finalCanvas = document.createElement('canvas');
      finalCanvas.width = finalCanvas.height = side;
      const fctx = finalCanvas.getContext('2d');
      fctx.drawImage(canvas, 0, top, pw, side, 0, 0, side, side);
    }

    const mime = usePNG ? 'image/png' : 'image/jpeg';
    const quality = usePNG ? 1.0 : 0.95;

    finalCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      img.style.borderRadius = '12px';
      img.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
      imagesContainer.appendChild(img);

      parts.push({
        blob,
        name: `${i + 1}${usePNG ? '.png' : '.jpg'}`
      });

      if (parts.length === 3) {
        document.getElementById('download-all').onclick = () => downloadZIP(parts, mode);
      }
    }, mime, quality);
  }
}

// === ZIP DOWNLOAD ===
function downloadZIP(parts, mode) {
  if (typeof JSZip === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => createZip(parts, mode);
    document.head.appendChild(script);
  } else {
    createZip(parts, mode);
  }
}

function createZip(parts, mode) {
  const zip = new JSZip();
  parts.forEach(p => zip.file(p.name, p.blob));

  zip.generateAsync({ type: 'blob' }).then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `FarGonE_3split_${mode}${usePNG ? '_PNG' : ''}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }).catch(() => {
    alert('ZIP failed — downloading files individually...');
    parts.forEach((p, i) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(p.blob);
      a.download = p.name;
      a.click();
    });
  });
}