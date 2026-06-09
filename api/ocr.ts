export const config = { runtime: 'edge' };

const MAX_PER_DAY = parseInt(process.env.VITE_MAX_OCR_PER_DAY ?? '10');

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { imageBase64, mimeType, accessCode } = await request.json() as {
    imageBase64: string;
    mimeType: string;
    accessCode: string;
  };

  // ① 접속 코드 검증
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
  if (!accessCode || accessCode !== process.env.OCR_ACCESS_CODE) {
    return new Response(
      JSON.stringify({ error: 'invalid_code', message: '접속 코드가 올바르지 않아요.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ①-b 입력값 검증
  if (!ALLOWED_MIME.includes(mimeType)) {
    return new Response(
      JSON.stringify({ error: 'invalid_mime', message: '지원하지 않는 이미지 형식이에요.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  // base64 크기 상한 10MB (base64 인코딩 오버헤드 고려)
  if (!imageBase64 || imageBase64.length > 14_000_000) {
    return new Response(
      JSON.stringify({ error: 'too_large', message: '이미지가 너무 커요. 10MB 이하로 업로드해주세요.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ② IP 기반 일일 호출 제한 (Upstash Redis)
  const ip =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const kvKey = `ocr:${ip}:${today}`;

  let count = 0;
  try {
    const kvRes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${kvKey}`,
      { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
    );
    const kvData = await kvRes.json() as { result?: string };
    count = parseInt(kvData.result ?? '0');
  } catch {
    return new Response(
      JSON.stringify({ error: 'service_unavailable', message: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
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
    const prompt = `이 이미지에서 영단어와 한국어 뜻 쌍을 모두 추출해줘.

규칙:
- JSON 배열만 반환. 마크다운(\`\`\`json 등) 절대 붙이지 마.
- 형식: [{"term": "영단어", "definition": "한국어 뜻"}, ...]
- 여러 단어로 된 표현(예: "make up")도 그대로 포함
- 뜻에 예문이나 부연설명 있으면 그대로 포함
- 인식 불확실한 단어는 포함하되 definition 끝에 "?" 추가
- 영단어-뜻 쌍이 없는 이미지면 [] 반환
- 한국어 뜻이 없고 영어 설명만 있어도 그대로 포함`;

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              { text: prompt },
            ],
          }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API error ${geminiRes.status}: ${errBody.slice(0, 200)}`);
    }

    const geminiData = await geminiRes.json() as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    const text = geminiData.candidates[0].content.parts[0].text.trim();

    // JSON 파싱 — 혹시 마크다운 펜스가 붙어도 제거
    const cleaned = text.replace(/^```json\s*|^```\s*|```$/gm, '').trim();
    const words = JSON.parse(cleaned);

    // ⑤ Redis 카운트 +1 (TTL 25시간)
    try {
      await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/set/${kvKey}/${count + 1}/ex/90000`,
        { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
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
    const safeMsg = err instanceof Error ? err.message : String(err).slice(0, 200);
    console.error('OCR error:', safeMsg);

    const message = err instanceof SyntaxError
      ? '단어를 인식했지만 형식 변환에 실패했어요. 다시 시도해주세요.'
      : 'OCR 처리 중 오류가 발생했어요. 다시 시도해주세요.';

    return new Response(
      JSON.stringify({ error: 'ocr_failed', message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
