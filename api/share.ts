export const config = { runtime: 'edge' };

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const TTL = 60 * 60 * 24 * 30; // 30일
const MAX_WORDS = 200;

function redis(path: string, method = 'GET', body?: unknown) {
  return fetch(`${REDIS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8);
}

export default async function handler(request: Request) {
  const url = new URL(request.url);

  // ── GET /api/share?code=aB3kP9 ──────────────────────────────
  if (request.method === 'GET') {
    const code = url.searchParams.get('code');
    if (!code || !/^[a-z0-9]{6}$/i.test(code)) {
      return json({ error: 'invalid_code', message: '잘못된 코드예요.' }, 400);
    }

    const res = await redis(`/get/share:${code}`);
    const { result } = await res.json() as { result: string | null };
    if (!result) {
      return json({ error: 'not_found', message: '링크가 만료됐거나 존재하지 않아요.' }, 404);
    }

    try {
      return json(JSON.parse(result));
    } catch {
      return json({ error: 'parse_error', message: '데이터를 불러오는 데 실패했어요.' }, 500);
    }
  }

  // ── POST /api/share ──────────────────────────────────────────
  if (request.method === 'POST') {
    let words: unknown[], title: string;
    try {
      ({ words, title } = await request.json() as { words: unknown[]; title: string });
    } catch {
      return json({ error: 'invalid_body', message: '요청 형식이 올바르지 않아요.' }, 400);
    }

    if (!Array.isArray(words) || words.length === 0 || words.length > MAX_WORDS) {
      return json({ error: 'invalid_words', message: `단어는 1~${MAX_WORDS}개만 공유할 수 있어요.` }, 400);
    }
    if (typeof title !== 'string' || !title.trim()) {
      return json({ error: 'invalid_title', message: '제목이 필요해요.' }, 400);
    }

    // 코드 중복 시 최대 3회 재시도
    let code = '';
    for (let i = 0; i < 3; i++) {
      const candidate = randomCode();
      const check = await redis(`/get/share:${candidate}`);
      const { result } = await check.json() as { result: string | null };
      if (!result) { code = candidate; break; }
    }
    if (!code) {
      return json({ error: 'collision', message: '잠시 후 다시 시도해주세요.' }, 503);
    }

    const value = JSON.stringify({ words, title: title.trim() });
    await redis(`/set/share:${code}`, 'POST', [value, 'EX', TTL]);

    const origin = url.origin.includes('localhost') ? url.origin : 'https://danzzak.vercel.app';
    return json({ code, url: `${origin}/s/${code}` }, 201);
  }

  return new Response('Method Not Allowed', { status: 405 });
}
