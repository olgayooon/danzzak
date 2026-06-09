async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_SIZE = 1200;
      let { width, height } = img;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      URL.revokeObjectURL(url);
      resolve(base64);
    };

    img.onerror = reject;
    img.src = url;
  });
}

export interface OcrResult {
  words: { term: string; definition: string }[];
  used: number;
  limit: number;
  remaining: number;
}

export async function extractWordsFromImage(file: File, accessCode: string): Promise<OcrResult> {
  const base64 = await compressImage(file);
  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg', accessCode }),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'OCR 실패'), { data });
  return data as OcrResult;
}
