/**
 * Comprime e converte imagens para WebP no cliente antes do upload.
 * Reduz drasticamente o tamanho dos screenshots de trade.
 */
export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1
  mimeType?: "image/webp" | "image/jpeg";
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  mimeType: "image/webp",
};

function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Comprime um File de imagem retornando um data URL otimizado.
 * Faz fallback para o original se algo falhar (ex.: navegador sem WebP).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const opts = { ...DEFAULTS, ...options };

  // Não-imagens passam direto
  if (!file.type.startsWith("image/")) {
    return readFileAsDataURL(file);
  }

  try {
    const originalDataUrl = await readFileAsDataURL(file);
    const img = await loadImage(originalDataUrl);

    let { width, height } = img;
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalDataUrl;
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL(opts.mimeType, opts.quality);
    // Se a versão "comprimida" ficou maior que a original, mantém a original
    return compressed.length < originalDataUrl.length ? compressed : originalDataUrl;
  } catch {
    // Fallback seguro
    return readFileAsDataURL(file);
  }
}

/**
 * Gera um preview leve (baixa resolução) para exibição imediata enquanto
 * a versão completa carrega. Útil para listas/galeria.
 */
export async function generatePreview(file: File): Promise<string> {
  return compressImage(file, { maxWidth: 320, maxHeight: 320, quality: 0.6 });
}
