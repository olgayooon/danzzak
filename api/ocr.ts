import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = { runtime: 'edge' };

const MAX_PER_DAY = parseInt(process.env.VITE_MAX_OCR_PER_DAY ?? '10');

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { imageBase64, mimeType, accessCode } = await request.json();

  // ① 접속 코드 검증
  if (!accessCode || accessCode !== process.env.OCR_ACCESS_CODE) {
    return new Response(
      JSON.stringify({ error: 'invalid_code', message: '접속 코드가 올바르지 않아요.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ② IP 기반 일일 호출 제한 (Vercel KV)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const kvKey = `ocr:${ip}:${today}`;

  let count = 0;
  try {
    const kvRes = await fetch(
      `${process.env.KV_REST_API_URL}/get/${kvKey}`,
      { headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } }
    );
    const kvData = await kvRes.json();
    count = parseInt(kvData.result ?? '0');
  } catch {
    console.warn('KV read failed, skipping rate limit');
  }

  // ③ 한도 초과
  if (count >= MAX_PER_DAY) {
    return new Response(
      JSON.stringify({
        error: 'rate_limit',
        message: `오늘 OCR을 ${MAX_PER_DAY}번 사용했어요. 내일 다시 시도해주세요.`,
        used: count,
        limit: MAX_PER_DAY,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ④ Gemini OCR
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `이 이미지에서 영단어와 한국어 뜻 쌍을 모두 추출해줘.

규칙:
- JSON 배열만 반환. 마크다운(\`\`\`json 등) 절대 붙이지 마.
- 형식: [{"term": "영단어", "definition": "한국어 뜻"}, ...]
- 여러 단어로 된 표현(예: "make up")도 그대로 포함
- 뜻에 예문이나 부연설명 있으면 그대로 포함
- 인식 불확실한 단어는 포함하되 definition 끝에 "?" 추가
- 영단어-뜻 쌍이 없는 이미지면 [] 반환
- 한국어 뜻이 없고 영어 설명만 있어도 그대로 포함`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType as string,
          data: imageBase64,
        },
      },
      prompt,
    ]);

    const text = result.response.text().trim();

    // JSON 파싱 — 혹시 마크다운 펜스가 붙어도 제거
    const cleaned = text.replace(/^```json\s*|^```\s*|```$/gm, '').trim();
    const words = JSON.parse(cleaned);

    // ⑤ KV 카운트 +1 (TTL 25시간)
    try {
      await fetch(
        `${process.env.KV_REST_API_URL}/set/${kvKey}/${count + 1}?ex=90000`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        }
      );
    } catch {
      console.warn('KV write failed');
    }

    return new Response(
      JSON.stringify({
        words,
        used: count + 1,
        limit: MAX_PER_DAY,
        remaining: MAX_PER_DAY - count - 1,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('OCR error:', err);

    const message = err instanceof SyntaxError
      ? '단어를 인식했지만 형식 변환에 실패했어요. 다시 시도해주세요.'
      : 'OCR 처리 중 오류가 발생했어요. 다시 시도해주세요.';

    return new Response(
      JSON.stringify({ error: 'ocr_failed', message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
