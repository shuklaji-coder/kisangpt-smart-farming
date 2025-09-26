// Lightweight ONNX runtime loader and disease detection scaffold
// Loads onnxruntime-web from CDN if available and runs a simple model if configured

export interface OnnxDetectionResult {
  label: string;
  confidence: number; // 0-1
}

const ORT_CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
const MODEL_URL = (process.env.REACT_APP_ONNX_DISEASE_MODEL_URL || '').trim();

async function loadOrt(): Promise<any | null> {
  if ((window as any).ort) return (window as any).ort;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = ORT_CDN;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load onnxruntime-web'));
    document.body.appendChild(s);
  });
  return (window as any).ort || null;
}

function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      createImageBitmap(img)
        .then((bmp) => { URL.revokeObjectURL(url); resolve(bmp); })
        .catch(reject);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function detectDiseaseOnDevice(file: File): Promise<OnnxDetectionResult | null> {
  try {
    if (!MODEL_URL) return null; // not configured
    const ort = await loadOrt();
    if (!ort) return null;

    const session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] });

    // Preprocess image to tensor (very simplified placeholder)
    const bmp = await fileToImageBitmap(file);
    const W = 224, H = 224; // typical
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);

    const input = new Float32Array(W * H * 3);
    // Normalize to [0,1] and CHW
    let p = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255; const g = data[i + 1] / 255; const b = data[i + 2] / 255;
      input[p++] = r; // simplistic; real models expect mean/std normalization and channel order
      input[p++] = g;
      input[p++] = b;
    }

    const tensor = new ort.Tensor('float32', input, [1, 3, H, W]);
    const feeds: any = {};
    // Guess first input name
    const firstInput = session.inputNames[0];
    feeds[firstInput] = tensor;

    const results = await session.run(feeds);
    const firstOutput = session.outputNames[0];
    const out = results[firstOutput];
    const scores = Array.from(out.data as Float32Array);

    // Softmax to probabilities
    const maxLogit = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - maxLogit));
    const sumExp = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumExp);

    // Pick top class (labels need to match model; placeholder generic mapping)
    const idx = probs.indexOf(Math.max(...probs));
    const label = `class_${idx}`;

    return { label, confidence: Math.max(0, Math.min(1, probs[idx] || 0)) } as OnnxDetectionResult;
  } catch (e) {
    console.warn('ONNX on-device detection unavailable:', e);
    return null;
  }
}
