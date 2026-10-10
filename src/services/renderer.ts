import QRCode from 'qrcode';
import { ModelCalibration, Plaque, RenderOptions } from '../types';
import { formatSequence } from '../utils/formatters';

// In-memory cache for preloaded artwork images
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Preload an image URL into HTMLImageElement
 */
export async function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) return cached;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Draw synthetic high-fidelity 10x10 cm base artwork for when external image is offline or loading
 */
function drawSyntheticBaseArtwork(
  ctx: CanvasRenderingContext2D,
  model: ModelCalibration,
  width: number,
  height: number
) {
  // Deep dark carbon-fiber-like or brushed metal base
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a0a0d');
  bgGrad.addColorStop(0.5, '#121217');
  bgGrad.addColorStop(1, '#08080a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle border accent
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = width * 0.008;
  ctx.strokeRect(width * 0.02, height * 0.02, width * 0.96, height * 0.96);

  // Outer glow / accent line depending on model category
  const accentColor = model.id === 1 ? '#e1306c' : // Instagram
                      model.id === 2 ? '#4285f4' : // Google
                      model.id === 3 ? '#32bcad' : // Pix
                      model.id === 4 ? '#25d366' : // WhatsApp
                      model.id === 5 ? '#3b82f6' : // WiFi
                      model.id === 6 ? '#f59e0b' : // Cardápio
                      model.id === 7 ? '#8b5cf6' : // Multi
                      '#ef4444'; // Black edition

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = width * 0.004;
  ctx.strokeRect(width * 0.035, height * 0.035, width * 0.93, height * 0.93);

  // Header banner / title zone
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(width * 0.046)}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(model.name.split(' - ')[1] || model.name, width * 0.5, height * 0.12);

  // Subtitle / category
  ctx.fillStyle = '#a1a1aa';
  ctx.font = `500 ${Math.round(width * 0.024)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText(model.category.toUpperCase(), width * 0.5, height * 0.165);

  // NFC Wave Icon in top right
  const nfcX = width * 0.86;
  const nfcY = height * 0.11;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = width * 0.006;
  ctx.beginPath();
  ctx.arc(nfcX, nfcY, width * 0.025, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(nfcX, nfcY, width * 0.04, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  // Bottom action callout
  ctx.fillStyle = '#e4e4e7';
  ctx.font = `600 ${Math.round(width * 0.03)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('APROXIME OU APONTE A CÂMERA', width * 0.5, height * 0.86);

  // Secondary subtext
  ctx.fillStyle = '#71717a';
  ctx.font = `400 ${Math.round(width * 0.02)}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('NFC • QR CODE DINÂMICO • DINÂMICO PRO', width * 0.5, height * 0.90);
}

/**
 * Generate a clean QR Code canvas for dynamic URL
 */
export async function generateQrCanvas(
  url: string,
  size: number,
  darkColor = '#000000',
  lightColor = '#ffffff',
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'H'
): Promise<HTMLCanvasElement> {
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = size;
  qrCanvas.height = size;

  await QRCode.toCanvas(qrCanvas, url, {
    width: size,
    margin: 1,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel,
  });

  return qrCanvas;
}

/**
 * UNIFIED RENDERING ENGINE:
 * Composes the complete 10x10 cm plaque:
 * 1. Base clean artwork (custom uploaded, official URL, or synthetic fallback)
 * 2. Smart masking patch to cleanly eliminate any old illustrative placeholder QR
 * 3. Dynamic QR Code in exact calibrated coordinates
 * 4. Sequential plaque number in non-obtrusive, calibrated position
 */
export async function renderPlaqueCanvas(
  model: ModelCalibration,
  plaque: Plaque,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  // Reference resolution: 1181 x 1181 px for 10x10 cm @ 300 DPI
  const targetWidth = options.width || 1181;
  const targetHeight = options.height || 1181;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Não foi possível obter o contexto 2D do Canvas.');

  // Enable high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Base Artwork
  const artworkUrl = model.customBaseUrl || model.originalUrl;
  let imageLoaded = false;

  try {
    const img = await preloadImage(artworkUrl);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    imageLoaded = true;
  } catch {
    // If external URL cannot be reached, fallback to synthetic high-fidelity artwork
    drawSyntheticBaseArtwork(ctx, model, targetWidth, targetHeight);
  }

  // Calculate calibrated pixel coordinates from normalized 0..1 values
  const qrPixelX = Math.round(model.qrX * targetWidth);
  const qrPixelY = Math.round(model.qrY * targetHeight);
  const qrPixelW = Math.round(model.qrWidth * targetWidth);
  const qrPixelH = Math.round(model.qrHeight * targetHeight);
  const borderRadius = Math.round((model.qrBorderRadius || 24) * (targetWidth / 1181));

  // 2. Clean/Mask Placeholder QR Region (Eliminates the illustrative placeholder completely!)
  if (model.maskEnabled) {
    ctx.save();
    ctx.beginPath();
    // Slightly expand the mask boundary by 2px to ensure 100% complete coverage of any previous artifacts
    const maskPad = 2;
    if (ctx.roundRect) {
      ctx.roundRect(
        qrPixelX - maskPad,
        qrPixelY - maskPad,
        qrPixelW + (maskPad * 2),
        qrPixelH + (maskPad * 2),
        borderRadius
      );
    } else {
      ctx.rect(
        qrPixelX - maskPad,
        qrPixelY - maskPad,
        qrPixelW + (maskPad * 2),
        qrPixelH + (maskPad * 2)
      );
    }
    ctx.fillStyle = model.maskFillColor || '#ffffff';
    ctx.fill();

    // Subtle inner border for bezel effect if white surface
    if (model.maskFillColor === '#ffffff' || model.maskFillColor === '#fff') {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Render Dynamic QR Code
  // Dynamic URL: permanent link stored in plaque
  const qrUrlToEncode = plaque.permanentUrl || `${window.location.origin}/r/${plaque.id}`;
  
  // Padding inside the QR container
  const padding = Math.round((model.qrPadding || 16) * (targetWidth / 1181));
  const innerQrSize = Math.max(32, qrPixelW - (padding * 2));

  const qrCanvas = await generateQrCanvas(
    qrUrlToEncode,
    innerQrSize,
    model.qrDarkColor || '#000000',
    model.qrLightColor || '#ffffff',
    model.qrErrorCorrectionLevel || 'H'
  );

  // Draw QR with rounded clip if specified
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(qrPixelX, qrPixelY, qrPixelW, qrPixelH, borderRadius);
  } else {
    ctx.rect(qrPixelX, qrPixelY, qrPixelW, qrPixelH);
  }
  ctx.clip();

  // Background of the QR badge
  ctx.fillStyle = model.qrLightColor || '#ffffff';
  ctx.fillRect(qrPixelX, qrPixelY, qrPixelW, qrPixelH);

  // Draw the QR Code image centered inside the padded zone
  ctx.drawImage(
    qrCanvas,
    qrPixelX + padding,
    qrPixelY + padding,
    innerQrSize,
    innerQrSize
  );
  ctx.restore();

  // 4. Render Unique Sequential Number
  const formattedNumber = plaque.formattedNumber || formatSequence(plaque.sequenceNumber);
  const numberText = `${model.numberPrefix || 'Nº '}${formattedNumber}`;
  
  const numPixelX = Math.round(model.numberX * targetWidth);
  const numPixelY = Math.round(model.numberY * targetHeight);
  const fontSize = Math.round((model.numberFontSize || 24) * (targetWidth / 1181));

  ctx.save();
  ctx.font = `600 ${fontSize}px ${model.numberFontFamily || 'JetBrains Mono'}, monospace`;
  ctx.textAlign = model.numberAlignment || 'right';
  ctx.textBaseline = 'middle';

  // Measure text for background badge if enabled
  if (model.showNumberBg) {
    const textMetrics = ctx.measureText(numberText);
    const badgePadX = Math.round(fontSize * 0.45);
    const badgePadY = Math.round(fontSize * 0.28);
    const badgeW = textMetrics.width + (badgePadX * 2);
    const badgeH = fontSize + (badgePadY * 2);

    let badgeX = numPixelX - badgePadX;
    if (model.numberAlignment === 'right') {
      badgeX = numPixelX - textMetrics.width - badgePadX;
    } else if (model.numberAlignment === 'center') {
      badgeX = numPixelX - (badgeW / 2);
    }

    const badgeY = numPixelY - (badgeH / 2);

    ctx.fillStyle = model.numberBgColor || 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    const badgeRadius = Math.round(badgeH * 0.3);
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw the sequence number string
  ctx.fillStyle = model.numberColor || '#ffffff';
  ctx.fillText(numberText, numPixelX, numPixelY);
  ctx.restore();

  return canvas;
}

/**
 * Render plaque directly to Blob (PNG format)
 */
export async function renderPlaqueToBlob(
  model: ModelCalibration,
  plaque: Plaque,
  options?: RenderOptions
): Promise<Blob> {
  const canvas = await renderPlaqueCanvas(model, plaque, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar Blob do canvas'));
    }, 'image/png');
  });
}

/**
 * Render plaque directly to Data URL (base64)
 */
export async function renderPlaqueToDataUrl(
  model: ModelCalibration,
  plaque: Plaque,
  options?: RenderOptions
): Promise<string> {
  const canvas = await renderPlaqueCanvas(model, plaque, options);
  return canvas.toDataURL('image/png');
}
