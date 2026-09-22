/**
 * Automatic Subject Detection and Foreground Depth Mask Extractor
 * Uses canvas-based saliency, background seed clustering, Sobel edge barriers,
 * and alpha feathering to automatically isolate the main subject (person, pet,
 * building, vehicle, or object) without requiring the user to supply a mask.
 */

export interface SubjectMaskOptions {
  sensitivity?: 'low' | 'balanced' | 'high';
  featherRadius?: number;
  onProgress?: (status: string) => void;
}

interface ColorCluster {
  r: number;
  g: number;
  b: number;
  weight: number;
}

/**
 * Loads an image from a URL, data URL, or File into an HTMLImageElement
 */
function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for subject masking: ' + e));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Color distance in weighted perceptual RGB space
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Perceptual color distance formula (approximation of CIE76)
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

/**
 * Extracts background color clusters from the top and upper border zones
 */
function extractBackgroundClusters(data: Uint8ClampedArray, width: number, height: number): ColorCluster[] {
  const samples: { r: number; g: number; b: number }[] = [];

  // Sample top 12% row strip
  const topRows = Math.max(3, Math.floor(height * 0.12));
  const stepX = Math.max(2, Math.floor(width / 35));

  for (let y = 0; y < topRows; y += 2) {
    for (let x = 0; x < width; x += stepX) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }

  // Sample upper corners & edges (top 35% side strips)
  const edgeCols = Math.max(2, Math.floor(width * 0.10));
  const upperHalf = Math.floor(height * 0.35);

  for (let y = topRows; y < upperHalf; y += 4) {
    // Left edge
    for (let x = 0; x < edgeCols; x += 3) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
    // Right edge
    for (let x = width - edgeCols; x < width; x += 3) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }

  if (samples.length === 0) {
    return [{ r: 0, g: 0, b: 0, weight: 1 }];
  }

  // Simple k-means clustering to find up to 3 dominant background tones
  const clusters: ColorCluster[] = [];
  const clusterCount = Math.min(3, samples.length);

  for (let i = 0; i < clusterCount; i++) {
    const s = samples[Math.floor((i * samples.length) / clusterCount)];
    clusters.push({ r: s.r, g: s.g, b: s.b, weight: 1 });
  }

  // 3 quick iterations of k-means
  for (let iter = 0; iter < 3; iter++) {
    const sums = clusters.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

    for (const s of samples) {
      let bestDist = Infinity;
      let bestIdx = 0;
      for (let c = 0; c < clusters.length; c++) {
        const d = colorDistance(s.r, s.g, s.b, clusters[c].r, clusters[c].g, clusters[c].b);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = c;
        }
      }
      sums[bestIdx].r += s.r;
      sums[bestIdx].g += s.g;
      sums[bestIdx].b += s.b;
      sums[bestIdx].count++;
    }

    for (let c = 0; c < clusters.length; c++) {
      if (sums[c].count > 0) {
        clusters[c].r = sums[c].r / sums[c].count;
        clusters[c].g = sums[c].g / sums[c].count;
        clusters[c].b = sums[c].b / sums[c].count;
        clusters[c].weight = sums[c].count / samples.length;
      }
    }
  }

  return clusters;
}

/**
 * Checks if the image already contains non-opaque alpha pixels (pre-cutout PNG)
 */
function hasExistingTransparency(data: Uint8ClampedArray): boolean {
  let transparentCount = 0;
  const total = data.length / 4;
  const sampleStep = Math.max(1, Math.floor(total / 2000));

  for (let i = 3; i < data.length; i += sampleStep * 4) {
    if (data[i] < 240) {
      transparentCount++;
      if (transparentCount > 50) return true;
    }
  }
  return false;
}

/**
 * Automatically finds the main subject in an image and returns a transparent PNG cutout
 */
export async function generateSubjectMask(
  source: string | File,
  options: SubjectMaskOptions = {}
): Promise<string> {
  const {
    sensitivity = 'balanced',
    featherRadius = 3,
    onProgress,
  } = options;

  onProgress?.('Loading image data...');
  const img = await loadImage(source);

  // Check if original is loaded
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // 1. Working Resolution (Fast & Accurate: ~640px max dimension)
  const maxDim = 640;
  let workW = origW;
  let workH = origH;
  if (workW > maxDim || workH > maxDim) {
    if (workW > workH) {
      workH = Math.round((workH * maxDim) / workW);
      workW = maxDim;
    } else {
      workW = Math.round((workW * maxDim) / workH);
      workH = maxDim;
    }
  }

  const workCanvas = document.createElement('canvas');
  workCanvas.width = workW;
  workCanvas.height = workH;
  const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!workCtx) {
    throw new Error('Could not create offscreen canvas context');
  }

  workCtx.drawImage(img, 0, 0, workW, workH);
  const imgData = workCtx.getImageData(0, 0, workW, workH);
  const data = imgData.data;

  // If the image is already a transparent cutout, export immediately
  if (hasExistingTransparency(data)) {
    onProgress?.('Using existing cutout alpha channel...');
    return typeof source === 'string' ? source : workCanvas.toDataURL('image/png');
  }

  onProgress?.('Analyzing color distribution & background...');
  // 2. Extract background color models from perimeter seeds
  const bgClusters = extractBackgroundClusters(data, workW, workH);

  // Sensitivity threshold tuning
  // Lower threshold = stricter background removal (more foreground)
  // Higher threshold = removes more background
  const baseThreshold =
    sensitivity === 'high' ? 68 : sensitivity === 'low' ? 44 : 56;

  // 3. Sobel Gradient Barrier Computation for boundary preservation
  const edgeBarrier = new Float32Array(workW * workH);
  for (let y = 1; y < workH - 1; y++) {
    for (let x = 1; x < workW - 1; x++) {
      const idx = (y * workW + x) * 4;
      const leftIdx = (y * workW + (x - 1)) * 4;
      const rightIdx = (y * workW + (x + 1)) * 4;
      const upIdx = ((y - 1) * workW + x) * 4;
      const downIdx = ((y + 1) * workW + x) * 4;

      const gx =
        Math.abs(data[rightIdx] - data[leftIdx]) +
        Math.abs(data[rightIdx + 1] - data[leftIdx + 1]) +
        Math.abs(data[rightIdx + 2] - data[leftIdx + 2]);

      const gy =
        Math.abs(data[downIdx] - data[upIdx]) +
        Math.abs(data[downIdx + 1] - data[upIdx + 1]) +
        Math.abs(data[downIdx + 2] - data[upIdx + 2]);

      edgeBarrier[y * workW + x] = (gx + gy) / 6;
    }
  }

  onProgress?.('Segmenting main subject silhouette...');
  // 4. Multi-cue foreground classification
  const rawAlpha = new Uint8Array(workW * workH);

  const centerX = workW / 2;
  const centerY = workH * 0.65; // Subject center of mass is typically below middle
  const maxCenterDist = Math.sqrt(centerX * centerX + (workH * 0.5) * (workH * 0.5));

  for (let y = 0; y < workH; y++) {
    const yNorm = y / workH;

    for (let x = 0; x < workW; x++) {
      const pixelIdx = (y * workW + x) * 4;
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];

      // Minimum distance to background seeds
      let minBgDist = Infinity;
      for (const cl of bgClusters) {
        const d = colorDistance(r, g, b, cl.r, cl.g, cl.b);
        if (d < minBgDist) minBgDist = d;
      }

      // Spatial saliency prior
      // Upper 18% is background-biased (where clock time numbers sit)
      // Middle & bottom center is subject-biased
      const dx = x - centerX;
      const dy = y - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const centerFactor = 1 - Math.min(1, distFromCenter / maxCenterDist);

      let spatialBias = 0;
      if (yNorm < 0.20) {
        // High penalty for top area to keep clock digits clearly visible behind subject
        spatialBias = -25 * (1 - yNorm / 0.20);
      } else if (yNorm > 0.40) {
        spatialBias = 15 * centerFactor + (yNorm - 0.4) * 20;
      }

      const edgeScore = edgeBarrier[y * workW + x];
      const effectiveDist = minBgDist + spatialBias + (edgeScore > 30 ? 10 : 0);

      if (effectiveDist >= baseThreshold) {
        // Foreground Subject
        rawAlpha[y * workW + x] = 255;
      } else if (effectiveDist <= baseThreshold * 0.65) {
        // Clear Background
        rawAlpha[y * workW + x] = 0;
      } else {
        // Transition band
        const t = (effectiveDist - baseThreshold * 0.65) / (baseThreshold * 0.35);
        rawAlpha[y * workW + x] = Math.round(t * 255);
      }
    }
  }

  // 5. Connected Component / Flood refinement from top border
  // Anything connected to the top border that is not strong foreground is background
  const visited = new Uint8Array(workW * workH);
  const queue: number[] = [];

  // Seed top row
  for (let x = 0; x < workW; x++) {
    if (rawAlpha[x] < 200) {
      queue.push(x);
      visited[x] = 1;
      rawAlpha[x] = 0;
    }
  }

  // Fast flood-fill
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % workW;
    const cy = Math.floor(curr / workW);

    const neighbors = [
      cy > 0 ? curr - workW : -1,
      cy < workH - 1 ? curr + workW : -1,
      cx > 0 ? curr - 1 : -1,
      cx < workW - 1 ? curr + 1 : -1,
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n]) {
        // If not a strong edge and not strong subject, propagate background
        if (rawAlpha[n] < 220 && edgeBarrier[n] < 45) {
          visited[n] = 1;
          rawAlpha[n] = 0;
          queue.push(n);
        }
      }
    }
  }

  onProgress?.('Feathering smooth depth edges...');
  // 6. Alpha Feathering / Edge Anti-aliasing (Separable Box Blur)
  const featheredAlpha = new Uint8Array(workW * workH);
  const radius = Math.max(1, featherRadius);

  // Horizontal blur pass
  const tempAlpha = new Float32Array(workW * workH);
  for (let y = 0; y < workH; y++) {
    for (let x = 0; x < workW; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const nx = x + k;
        if (nx >= 0 && nx < workW) {
          sum += rawAlpha[y * workW + nx];
          count++;
        }
      }
      tempAlpha[y * workW + x] = sum / count;
    }
  }

  // Vertical blur pass
  for (let y = 0; y < workH; y++) {
    for (let x = 0; x < workW; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const ny = y + k;
        if (ny >= 0 && ny < workH) {
          sum += tempAlpha[ny * workW + x];
          count++;
        }
      }
      featheredAlpha[y * workW + x] = Math.round(sum / count);
    }
  }

  onProgress?.('Rendering transparent subject cutout...');
  // 7. Render high-resolution masked output
  // Create output canvas at crisp display size (max 1920px)
  const outW = Math.min(1920, origW);
  const outH = Math.round((origH * outW) / origW);

  // Draw alpha mask to intermediate canvas
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = workW;
  alphaCanvas.height = workH;
  const alphaCtx = alphaCanvas.getContext('2d');
  if (!alphaCtx) throw new Error('Could not create alpha canvas');

  const alphaImgData = alphaCtx.createImageData(workW, workH);
  for (let i = 0; i < featheredAlpha.length; i++) {
    const a = featheredAlpha[i];
    const idx = i * 4;
    alphaImgData.data[idx] = 255;
    alphaImgData.data[idx + 1] = 255;
    alphaImgData.data[idx + 2] = 255;
    alphaImgData.data[idx + 3] = a;
  }
  alphaCtx.putImageData(alphaImgData, 0, 0);

  // Final Composite Canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not create output canvas');

  // Step A: Draw original image full resolution
  outCtx.drawImage(img, 0, 0, outW, outH);

  // Step B: Mask with alpha channel using destination-in
  outCtx.globalCompositeOperation = 'destination-in';
  outCtx.drawImage(alphaCanvas, 0, 0, outW, outH);

  onProgress?.('Complete!');
  return outCanvas.toDataURL('image/png');
}
