const displayCanvas = document.getElementById('asciiCanvas');
const displayCtx = displayCanvas.getContext('2d');
const colorModeSelect = document.getElementById('colorMode');

const video = document.createElement('video');
const sampleCanvas = document.createElement('canvas');
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

const density = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const cols = 120;
const rows = 75;
const charWidth = 8;
const charHeight = 10;

sampleCanvas.width = cols;
sampleCanvas.height = rows;

displayCanvas.width = cols * charWidth;
displayCanvas.height = rows * charHeight;

let hueOffset = 0;

async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    requestAnimationFrame(renderFrame);
  } catch (err) {
    displayCtx.fillStyle = "#ff4444";
    displayCtx.font = "16px monospace";
    displayCtx.fillText("Webcam access denied or unavailable: " + err.message, 20, 40);
  }
}

function getCharacterColor(r, g, b, brightness, x, y, mode) {
  switch (mode) {
    case 'truecolor':
      return `rgb(${r}, ${g}, ${b})`;

    case 'rainbow': {
      const hue = (x * 3 + y * 2 + hueOffset) % 360;
      const lightness = Math.max(15, (brightness / 255) * 70);
      return `hsl(${hue}, 100%, ${lightness}%)`;
    }

    case 'cyberpunk': {
      const ratio = brightness / 255;
      const red = Math.round(255 * (1 - ratio * 0.8));
      const green = Math.round(255 * ratio);
      const blue = 255;
      return `rgb(${red}, ${green}, ${blue})`;
    }

    case 'matrix':
    default:
      return '#00ff66';
  }
}

function renderFrame() {
  sampleCtx.save();
  sampleCtx.scale(-1, 1);
  sampleCtx.drawImage(video, -cols, 0, cols, rows);
  sampleCtx.restore();

  const pixels = sampleCtx.getImageData(0, 0, cols, rows).data;
  const mode = colorModeSelect.value;

  displayCtx.fillStyle = '#0d0d0d';
  displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

  displayCtx.font = `bold ${charHeight}px "Courier New", monospace`;
  displayCtx.textBaseline = 'top';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const charIndex = Math.floor((brightness / 255) * (density.length - 1));
      const char = density[charIndex];

      if (char === ' ') continue;

      displayCtx.fillStyle = getCharacterColor(r, g, b, brightness, x, y, mode);
      displayCtx.fillText(char, x * charWidth, y * charHeight);
    }
  }

  hueOffset = (hueOffset + 2) % 360;
  requestAnimationFrame(renderFrame);
}

initWebcam();
