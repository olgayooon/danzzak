import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';

/** 객체 → deflate 압축 → URL-safe base64 */
export function encodeCompressed(data: unknown): string {
  const json = JSON.stringify(data);
  const compressed = deflateSync(strToU8(json), { level: 9 });
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** URL-safe base64 → deflate 해제 → 객체 */
export function decodeCompressed<T>(encoded: string): T | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(strFromU8(inflateSync(bytes))) as T;
  } catch {
    return null;
  }
}
