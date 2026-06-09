import type { Word } from '../types/word';
import { generateId } from './id';

export interface ParsedWord {
  term: string;
  definition: string;
}

// ── 구분자 패턴 상수 ─────────────────────────────────────────────

/** Group A: 특수문자 기호 (소스 문자열로 관리해 재사용) */
const SYMBOL_CHARS_SRC = '[*•·\\-–—▪▸►◆●○✦※]';

/** Group B: 번호/순서 패턴 — 내부는 (?:...) 비캡처 그룹으로 통일 */
const NUMBER_PATTERNS_SRC = '(?:\\d+[.)】]|\\(\\d+\\)|[①-⑳]|[a-zA-Z][.)])';

/**
 * 항목 구분자로 쓰일 수 있는 전체 패턴 (Group C → B → A 순으로 매칭).
 * 내부 그룹을 모두 (?:...)으로 처리해 split() 시 undefined가 생기지 않음.
 * 모듈 상단 상수로 선언해 나중에 추가가 쉽게.
 */
export const DELIMITER_PATTERN = new RegExp(
  `((?:${SYMBOL_CHARS_SRC}\\s*${NUMBER_PATTERNS_SRC})` + // Group C
  `|(?:${NUMBER_PATTERNS_SRC})` +                         // Group B
  `|(?:${SYMBOL_CHARS_SRC}))`,                            // Group A
  'g',
);

// ── 전처리: 구분자 기반 줄 분리 ─────────────────────────────────

/**
 * 줄바꿈 없이 기호로 항목이 구분된 입력을 정규화한다.
 *
 * 감지 조건 (둘 다 충족 시에만 적용):
 * 1. DELIMITER_PATTERN에 매칭되는 토큰이 2회 이상 등장
 * 2. "구분자 + 바로 뒤 영문/한글 문자" 패턴이 2회 이상 확인됨
 *
 * 조건 미충족 또는 이미 줄이 충분히 분리된 경우엔 원본 그대로 반환.
 *
 * @example
 * normalizeInput("mail sorting : 우편물 분류 * slightly : 약간, 조금* procrastinate : 미루다")
 * // "mail sorting : 우편물 분류\nslightly : 약간, 조금\nprocrastinate : 미루다"
 */
export function normalizeInput(input: string): string {
  const existingLines = input.split('\n').filter(l => l.trim()).length;

  // 구분자 후보 매칭
  DELIMITER_PATTERN.lastIndex = 0;
  const delimMatches = [...input.matchAll(DELIMITER_PATTERN)];
  DELIMITER_PATTERN.lastIndex = 0;
  if (delimMatches.length < 1) return input;

  // 조건: 구분자 뒤에 영문자가 따라오는 경우 (영문이 새 term 시작을 의미)
  // 한글만 따라오는 경우(복합어 내 하이픈 등)는 구분자로 간주하지 않음
  const wordFollowed = delimMatches.filter(m => {
    const after = input.slice(m.index! + m[0].length).trimStart();
    return /^[a-zA-Z]/.test(after);
  });
  if (wordFollowed.length < 1) return input;

  // 구분자 위치를 뒤에서부터 교체해 인덱스 보정 없이 처리
  let result = input;
  for (let i = wordFollowed.length - 1; i >= 0; i--) {
    const m = wordFollowed[i];
    // 구분자 앞 공백까지 포함해 제거 (앞 토큰 끝의 공백 정리)
    const start = m.index!;
    const beforeSpaceStart = result.slice(0, start).trimEnd().length;
    result =
      result.slice(0, beforeSpaceStart) +
      '\n' +
      result.slice(start + m[0].length);
  }

  const tokens = result.split('\n').map(t => t.trim()).filter(Boolean);

  // 분리 결과가 기존 줄 수보다 많을 때만 적용
  if (tokens.length <= existingLines) return input;

  return tokens.join('\n');
}

// ── 0단계: 한 줄 안의 복수 쌍 분리 ─────────────────────────────

/**
 * 한 줄에 여러 단어-뜻 쌍이 공백으로 이어진 경우를 분리한다.
 *
 * 분리 기준: 괄호 밖에서 한글 문자 뒤에 1칸 이상 공백, 그 다음 영문자가 올 때.
 * 핵심 조건: 분리점 이전 구간에 영문자가 있어야만 분리 (없으면 swap 케이스).
 *
 * 언어 전환 감지:
 * - [한글] + 공백+ + [영문] → 기존 동작
 * - [한글] + (공백*) + [,|;] + 공백* + [영문] → NEW: 콤마/세미콜론 뒤 영문 전환
 *   단, 콤마 뒤가 한글이면(뜻이 여러 개인 경우) 분리하지 않음
 */
export function splitMultiplePairs(line: string): string[] {
  if (line.includes('\t')) return [line];

  const splitPoints: number[] = [];
  let depth = 0;
  let lastSplit = 0;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if ('([（【'.includes(ch)) { depth++; continue; }
    if (')]）】'.includes(ch)) { depth = Math.max(0, depth - 1); continue; }
    if (depth > 0) continue;

    if (/[가-힣]/.test(ch)) {
      let j = i + 1;

      // 공백 건너뜀
      while (j < line.length && line[j] === ' ') j++;

      // 콤마 또는 세미콜론이 있으면 추가로 건너뜀 (언어 전환 감지)
      if (j < line.length && /[,;]/.test(line[j])) {
        j++; // 구분자 건너뜀
        while (j < line.length && line[j] === ' ') j++; // 구분자 뒤 공백 건너뜀
      }

      // 다음 문자가 영문이어야 분리 (한글이면 뜻이 여러 개인 것 → 분리 안 함)
      if (j > i + 1 && j < line.length && /[a-zA-Z]/.test(line[j])) {
        const segment = line.slice(lastSplit, j);
        if (/[a-zA-Z]/.test(segment)) {
          splitPoints.push(j);
          lastSplit = j;
          i = j - 1;
        }
      }
    }
  }

  if (splitPoints.length === 0) return [line];

  const parts: string[] = [];
  let prev = 0;
  for (const sp of splitPoints) {
    // 분리점 앞 구간에서 trailing 구분자(, ;)를 제거
    const part = line.slice(prev, sp).trim().replace(/[,;]\s*$/, '');
    if (part) parts.push(part);
    prev = sp;
  }
  const last = line.slice(prev).trim();
  if (last) parts.push(last);

  return parts;
}

// ── 1단계: 줄 앞 기호/번호/공백 제거 ────────────────────────────

/**
 * 줄 맨 앞에서 첫 번째 영문자 또는 한글 문자가 나올 때까지
 * 번호, 기호, 공백, 탭 등을 모두 제거한다.
 */
export function stripLeadingSymbols(line: string): string {
  return line.replace(/^[^a-zA-Z가-힣]+/, '');
}

// ── 2단계: term / definition 분리 (전략 패턴) ────────────────────

/** 문자열에서 한글 문자가 처음 나오는 인덱스. 없으면 -1. */
function firstKoreanIndex(str: string): number {
  for (let i = 0; i < str.length; i++) {
    if (/[가-힣]/.test(str[i])) return i;
  }
  return -1;
}

type SplitStrategy = (line: string) => [string, string] | null;

/**
 * term/definition 분리 전략 배열.
 * 순서대로 시도하며 null이 아닌 결과를 처음 반환하는 전략을 사용한다.
 * 나중에 구분자를 추가할 때 이 배열에 항목만 넣으면 된다.
 */
const SPLIT_STRATEGIES: SplitStrategy[] = [
  // 1) 탭 구분
  (line) => {
    if (!line.includes('\t')) return null;
    const idx = line.indexOf('\t');
    return [line.slice(0, idx), line.slice(idx + 1)];
  },

  // 2) 콜론 구분자 (" : " 또는 ": ")
  //    term 후보가 영단어 1~4개 이하일 때만 적용
  (line) => {
    const colonMatch = line.match(/^(.*?)\s*:\s+(.*)$/);
    if (!colonMatch) return null;
    const termCandidate = colonMatch[1];
    const isSimpleTerm =
      /^[a-zA-Z\s\-]+$/.test(termCandidate) &&
      termCandidate.trim().split(/\s+/).length <= 4;
    if (!isSimpleTerm) return null;
    return [colonMatch[1], colonMatch[2]];
  },

  // 3) 연속 공백 2칸 이상
  (line) => {
    const m = line.match(/^(.*?)(  +)(.*)$/);
    return m ? [m[1], m[3]] : null;
  },

  // 4) 한글 첫 등장 인덱스 기준
  (line) => {
    const korIdx = firstKoreanIndex(line);
    if (korIdx > 0) return [line.slice(0, korIdx), line.slice(korIdx)];
    if (korIdx === 0) return ['', line];
    return null;
  },

  // 5) 한글 없음 → term만
  (line) => [line, ''],
];

/**
 * 한 줄에서 term과 definition을 분리한다.
 * 전략 배열을 순서대로 시도해 첫 번째 매칭 결과를 반환한다.
 */
export function splitTermDefinition(line: string): [string, string] {
  for (const strategy of SPLIT_STRATEGIES) {
    const result = strategy(line);
    if (result !== null) return result;
  }
  return [line, ''];
}

// ── 3단계: 영한 자동 교체 ────────────────────────────────────────

export function detectAndSwap(term: string, definition: string): [string, string] {
  if (koreanRatio(term) > 0.3) return [definition, term];
  return [term, definition];
}

function koreanRatio(str: string): number {
  if (str.length === 0) return 0;
  return (str.match(/[가-힣]/g) ?? []).length / str.length;
}

// ── 4단계: term 정제 ─────────────────────────────────────────────

export function refineTerm(raw: string): string {
  return raw
    .trim()
    .replace(/^[^a-zA-Z가-힣]+/, '')
    .replace(/[^a-zA-Z가-힣0-9)]+$/, '');
}

// ── 5단계: definition 정제 ───────────────────────────────────────

/**
 * 한글 앞에 있는 "제거 가능한" 접두사 패턴.
 * 영문, 공백, 기본 기호만 포함될 때 해당 구간을 버린다.
 * `~`(한국어 어법 접두사), `※` 등 뜻의 일부인 기호는 제거 대상에서 제외.
 */
const DROPPABLE_PREFIX_RE = /^[a-zA-Z\s().,:\-\[\]/]+$/;

export function refineDefinition(raw: string): string {
  const trimmed = raw.trim();
  const korIdx = firstKoreanIndex(trimmed);
  if (korIdx > 0) {
    const prefix = trimmed.slice(0, korIdx);
    // 접두사가 순수 영문/기호(~, ※ 등 제외)일 때만 제거
    if (DROPPABLE_PREFIX_RE.test(prefix)) {
      return trimmed.slice(korIdx).trim();
    }
  }
  return trimmed;
}

// ── 메인 파서 ────────────────────────────────────────────────────

/**
 * 자유 형식 텍스트에서 영단어-뜻 쌍을 추출한다.
 *
 * 처리 순서:
 * 1. normalizeInput — 기호 구분자 감지 후 줄 분리
 * 2. 각 줄: stripLeadingSymbols → splitMultiplePairs → splitTermDefinition
 *           → detectAndSwap → refineTerm/refineDefinition
 */
export function parseWordText(input: string): ParsedWord[] {
  const normalized = normalizeInput(input);
  const lines = normalized.split('\n');
  const results: ParsedWord[] = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const stripped = stripLeadingSymbols(rawLine);
    if (!stripped.trim()) continue;

    const subLines = splitMultiplePairs(stripped);

    for (const subLine of subLines) {
      if (!subLine.trim()) continue;

      const [rawTerm, rawDef] = splitTermDefinition(subLine);
      const [swappedTerm, swappedDef] = detectAndSwap(rawTerm, rawDef);
      const term = refineTerm(swappedTerm);
      const definition = refineDefinition(swappedDef);

      // term·definition 둘 다 비어있으면 스킵
      // 어느 한 쪽만 있으면 미완성 항목으로 포함 → UI에서 사용자가 채울 수 있게
      if (!term && !definition) continue;

      results.push({ term, definition });
    }
  }

  return results;
}

// ── 기존 호환 래퍼 ───────────────────────────────────────────────

export function parseText(text: string): Word[] {
  return parseWordText(text).map(({ term, definition }) => ({
    id: generateId(),
    term,
    definition,
    isWeak: false,
    stats: { correct: 0, wrong: 0 },
  }));
}
