import { loadImage } from '../utils/index.js';

export async function loadKeyedSpriteSheet() {
  const url = new URL('../../assets/player/spritesheet.png', import.meta.url);
  const sheet = await loadImage(url.href);
  const canvas = document.createElement('canvas');
  canvas.width = sheet.naturalWidth;
  canvas.height = sheet.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  context.drawImage(sheet, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const keyRed = pixels[0];
  const keyGreen = pixels[1];
  const keyBlue = pixels[2];

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] === keyRed && pixels[index + 1] === keyGreen && pixels[index + 2] === keyBlue) {
      pixels[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}