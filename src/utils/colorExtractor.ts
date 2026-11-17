export interface ExtractedPalette {
  primary: string;
  secondary: string;
}

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' +
  [r, g, b]
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(c)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('');

export async function extractColorsFromImage(file: File): Promise<ExtractedPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }

    img.onload = () => {
      const maxSize = 160;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const counts = new Map<string, number>();

      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 200) continue;
        const r = Math.floor(data[i] / 24) * 24;
        const g = Math.floor(data[i + 1] / 24) * 24;
        const b = Math.floor(data[i + 2] / 24) * 24;
        const key = `${r},${g},${b}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

      let bestKey = '15,76,58';
      let bestCount = 0;
      for (const [key, count] of counts.entries()) {
        if (count > bestCount) {
          bestCount = count;
          bestKey = key;
        }
      }

      const [r, g, b] = bestKey.split(',').map(Number);
      resolve({
        primary: rgbToHex(r, g, b),
        secondary: rgbToHex(255 - r, 255 - g, 255 - b),
      });
    };

    img.onerror = () => reject(new Error('Falha ao ler imagem para extração de cores'));

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.onerror = () => reject(new Error('Falha ao abrir arquivo de imagem'));
    reader.readAsDataURL(file);
  });
}
