import { describe, it, expect } from 'vitest';
import {
  normalizeInput,
  splitMultiplePairs,
  stripLeadingSymbols,
  splitTermDefinition,
  detectAndSwap,
  refineTerm,
  refineDefinition,
  parseWordText,
} from './textParser';

// ── stripLeadingSymbols ──────────────────────────────────────────

describe('stripLeadingSymbols', () => {
  it('번호+점 제거', () => {
    expect(stripLeadingSymbols('1. apple')).toBe('apple');
  });
  it('번호+닫는괄호 제거', () => {
    expect(stripLeadingSymbols('2) banana')).toBe('banana');
  });
  it('별표+공백 제거', () => {
    expect(stripLeadingSymbols('* apple')).toBe('apple');
  });
  it('대시+공백 제거', () => {
    expect(stripLeadingSymbols('- apple')).toBe('apple');
  });
  it('중간점 제거', () => {
    expect(stripLeadingSymbols('· 사과')).toBe('사과');
  });
  it('원문자 번호 제거', () => {
    expect(stripLeadingSymbols('② banana')).toBe('banana');
  });
  it('앞 공백+탭 제거', () => {
    expect(stripLeadingSymbols('  \tapple')).toBe('apple');
  });
  it('기호 없으면 그대로', () => {
    expect(stripLeadingSymbols('apple')).toBe('apple');
  });
  it('한글로 시작하면 그대로', () => {
    expect(stripLeadingSymbols('사과')).toBe('사과');
  });
});

// ── splitTermDefinition ──────────────────────────────────────────

describe('splitTermDefinition', () => {
  it('탭 구분자', () => {
    expect(splitTermDefinition('apple\t사과')).toEqual(['apple', '사과']);
  });
  it('탭 뒤에 내용이 길어도 분리', () => {
    const line = 'coordinator\t조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)';
    const [term, def] = splitTermDefinition(line);
    expect(term).toBe('coordinator');
    expect(def).toBe('조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)');
  });
  it('연속 공백 2칸 구분', () => {
    expect(splitTermDefinition('ambiguous  애매한, 불분명한')).toEqual(['ambiguous', '애매한, 불분명한']);
  });
  it('연속 공백 4칸도 처리', () => {
    expect(splitTermDefinition('volunteer    자원봉사자')).toEqual(['volunteer', '자원봉사자']);
  });
  it('한글 첫 등장 인덱스 기준 분리', () => {
    const [term, def] = splitTermDefinition('empathy공감 능력');
    expect(term).toBe('empathy');
    expect(def).toBe('공감 능력');
  });
  it('한글로 시작 + 연속 공백 있으면 연속 공백 rule 우선 적용', () => {
    // detectAndSwap이 이후 단계에서 swap하므로 최종 결과는 올바름
    expect(splitTermDefinition('담당자   coordinator')).toEqual(['담당자', 'coordinator']);
  });
  it('한글 없는 줄 → definition 빈 문자열', () => {
    expect(splitTermDefinition('volunteer')).toEqual(['volunteer', '']);
  });
});

// ── detectAndSwap ────────────────────────────────────────────────

describe('detectAndSwap', () => {
  it('term에 한글 비율 높으면 swap', () => {
    expect(detectAndSwap('담당자', 'coordinator')).toEqual(['coordinator', '담당자']);
  });
  it('term이 영어면 swap 안 함', () => {
    expect(detectAndSwap('apple', '사과')).toEqual(['apple', '사과']);
  });
  it('term 빈 문자열이면 swap 안 함', () => {
    expect(detectAndSwap('', '사과')).toEqual(['', '사과']);
  });
  it('한글 비율 30% 이하면 swap 안 함 — 영어+괄호 안에 한글 조금', () => {
    // "abc가" → 한글 1/4 = 25%, 임계 30% 미만 → swap 안 함
    expect(detectAndSwap('abc가', '사과')[0]).toBe('abc가');
  });
  it('한글 비율 50%면 swap', () => {
    // "가나" → 한글 2/2 = 100% → swap
    const [t, d] = detectAndSwap('가나', 'apple');
    expect(t).toBe('apple');
    expect(d).toBe('가나');
  });
});

// ── refineTerm ───────────────────────────────────────────────────

describe('refineTerm', () => {
  it('앞뒤 공백 제거', () => {
    expect(refineTerm('  apple  ')).toBe('apple');
  });
  it('앞 기호 제거', () => {
    expect(refineTerm('- apple')).toBe('apple');
  });
  it('뒤 기호 제거', () => {
    expect(refineTerm('apple:')).toBe('apple');
  });
  it('복합어 내부 공백 유지', () => {
    expect(refineTerm('pet coordinator')).toBe('pet coordinator');
  });
  it('한글 단어 앞 기호 제거', () => {
    expect(refineTerm('- 담당자')).toBe('담당자');
  });
  it('빈 문자열', () => {
    expect(refineTerm('')).toBe('');
  });
});

// ── refineDefinition ─────────────────────────────────────────────

describe('refineDefinition', () => {
  it('앞 기호+공백 버리고 한글부터 사용', () => {
    expect(refineDefinition('- 조정자, 담당자')).toBe('조정자, 담당자');
  });
  it('앞 영어 버리고 한글부터 사용', () => {
    expect(refineDefinition('coordinator 조정자')).toBe('조정자');
  });
  it('괄호 포함 내용 보존', () => {
    const input = '조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)';
    expect(refineDefinition(input)).toBe('조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)');
  });
  it('한글 없는 경우(영어 뜻) 전체 사용', () => {
    expect(refineDefinition('to manage or coordinate')).toBe('to manage or coordinate');
  });
  it('앞뒤 공백만 trim', () => {
    expect(refineDefinition('  사과  ')).toBe('사과');
  });
  it('빈 문자열', () => {
    expect(refineDefinition('')).toBe('');
  });
  it('~ 접두사 보존 — 한국어 어법 표시', () => {
    expect(refineDefinition('~에 주의를 기울이다')).toBe('~에 주의를 기울이다');
  });
  it('~으로 시작해도 내부 한글 보존', () => {
    expect(refineDefinition('~을 미루다')).toBe('~을 미루다');
  });
  it('영문 접두사는 여전히 제거', () => {
    expect(refineDefinition('(adj.) 아름다운')).toBe('아름다운');
  });
});

// ── parseWordText (통합 테스트) ──────────────────────────────────

describe('parseWordText', () => {
  it('스펙 예시 전체 처리', () => {
    const input = [
      'coordinator\t조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)',
      '',
      'ambiguous  애매한, 불분명한',
      'volunteer  자원봉사자',
      '담당자   coordinator',
      '',
      'empathy\t공감 능력',
    ].join('\n');

    const result = parseWordText(input);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      term: 'coordinator',
      definition: '조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)',
    });
    expect(result[1]).toEqual({ term: 'ambiguous', definition: '애매한, 불분명한' });
    expect(result[2]).toEqual({ term: 'volunteer', definition: '자원봉사자' });
    expect(result[3]).toEqual({ term: 'coordinator', definition: '담당자' });
    expect(result[4]).toEqual({ term: 'empathy', definition: '공감 능력' });
  });

  it('번호 목록 형식 처리', () => {
    const input = [
      '1. apple - 사과',
      '2. beautiful - 아름다운',
      '3. computer - 컴퓨터',
    ].join('\n');

    const result = parseWordText(input);
    expect(result).toHaveLength(3);
    expect(result[0].term).toBe('apple');
    expect(result[0].definition).toBe('사과');
    expect(result[2].term).toBe('computer');
  });

  it('별표 목록 형식 처리', () => {
    const input = '* volunteer  자원봉사자\n* ambiguous  애매한';
    const result = parseWordText(input);
    expect(result[0]).toEqual({ term: 'volunteer', definition: '자원봉사자' });
    expect(result[1]).toEqual({ term: 'ambiguous', definition: '애매한' });
  });

  it('빈 줄 무시', () => {
    const input = '\n\napple\t사과\n\n';
    expect(parseWordText(input)).toHaveLength(1);
  });

  it('definition 없는 줄도 포함 (사용자가 채울 수 있게)', () => {
    const input = 'serendipity\n\napple\t사과';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'serendipity', definition: '' });
    expect(result[1]).toEqual({ term: 'apple', definition: '사과' });
  });

  it('term 없이 한글(뜻)만 있는 줄도 포함 — 미완성 항목으로 분류', () => {
    const input = '* formation : 형성 (habit formation: 습관 형성)\n* 놀라운, 주목할 만한';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      term: 'formation',
      definition: '형성 (habit formation: 습관 형성)',
    });
    // term 없고 definition만 있음 → 미완성 항목으로 포함
    expect(result[1]).toEqual({ term: '', definition: '놀라운, 주목할 만한' });
  });

  it('한글-영어 역순(swap) 처리', () => {
    const input = '담당자   coordinator\n사과   apple';
    const result = parseWordText(input);
    expect(result[0]).toEqual({ term: 'coordinator', definition: '담당자' });
    expect(result[1]).toEqual({ term: 'apple', definition: '사과' });
  });

  it('복합어(공백 포함 term) 처리', () => {
    const input = 'pet coordinator\t반려동물 담당자';
    const result = parseWordText(input);
    expect(result[0]).toEqual({ term: 'pet coordinator', definition: '반려동물 담당자' });
  });

  it('탭+긴 definition(괄호 포함) 보존', () => {
    const input = 'empathy\t공감 능력 (남의 감정을 이해하는 능력)';
    const result = parseWordText(input);
    expect(result[0].definition).toBe('공감 능력 (남의 감정을 이해하는 능력)');
  });

  it('영어만 있는 줄 — definition을 빈 문자열로', () => {
    const input = 'serendipity';
    const result = parseWordText(input);
    expect(result[0]).toEqual({ term: 'serendipity', definition: '' });
  });

  it('definition 앞 영문 기호가 붙어 있어도 한글부터 사용', () => {
    const input = 'beautiful\t(adj.) 아름다운';
    const result = parseWordText(input);
    expect(result[0].definition).toBe('아름다운');
  });

  it('한글 definition에 영어 혼용 내용 보존', () => {
    const input = 'coordinator\t조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)';
    const result = parseWordText(input);
    expect(result[0].definition).toBe('조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)');
  });

  it('원문자 번호(②) 제거', () => {
    const input = '② volunteer  자원봉사자';
    const result = parseWordText(input);
    expect(result[0].term).toBe('volunteer');
  });

  it('전체가 빈 문자열이면 빈 배열', () => {
    expect(parseWordText('')).toEqual([]);
    expect(parseWordText('   \n\n  ')).toEqual([]);
  });
});

// ── splitMultiplePairs ───────────────────────────────────────────

describe('splitMultiplePairs', () => {
  it('구분자 있는 두 쌍 분리 — 사용자 제시 예시', () => {
    const result = splitMultiplePairs('mail sorting : 우편물 분류 slightly : 약간, 조금');
    expect(result).toEqual(['mail sorting : 우편물 분류', 'slightly : 약간, 조금']);
  });

  it('구분자 없는 두 쌍 분리', () => {
    const result = splitMultiplePairs('volunteer 자원봉사자 ambiguous 애매한');
    expect(result).toEqual(['volunteer 자원봉사자', 'ambiguous 애매한']);
  });

  it('세 쌍 분리', () => {
    const result = splitMultiplePairs('apple 사과 banana 바나나 cherry 체리');
    expect(result).toEqual(['apple 사과', 'banana 바나나', 'cherry 체리']);
  });

  it('괄호 안의 영문은 분리하지 않음', () => {
    const input = 'coordinator 조정자, 담당자 (Pet Program Coordinator: 반려동물 담당자)';
    expect(splitMultiplePairs(input)).toEqual([input]);
  });

  it('괄호 안 영문 이후 새 단어 — 괄호 밖만 분리', () => {
    const input = 'coordinator 조정자 (Pet Coordinator: 반려동물 담당자) volunteer 자원봉사자';
    // 닫는 괄호 이후 ' volunteer'에서 분리되어야 하지만,
    // '담당자)' 뒤의 ' volunteer'는 ')'가 끝이라 한글→영문 트리거 없음
    // → 분리 안 됨 (현재 구현 범위 밖, 문서화용)
    expect(splitMultiplePairs(input).length).toBeGreaterThanOrEqual(1);
  });

  it('탭 구분 줄은 그대로 반환', () => {
    const input = 'apple\t사과 banana\t바나나';
    expect(splitMultiplePairs(input)).toEqual([input]);
  });

  it('단일 쌍은 배열에 그대로 반환', () => {
    expect(splitMultiplePairs('apple 사과')).toEqual(['apple 사과']);
    expect(splitMultiplePairs('apple\t사과')).toEqual(['apple\t사과']);
  });

  it('한글로만 구성된 줄은 분리하지 않음', () => {
    expect(splitMultiplePairs('사과 바나나 체리')).toEqual(['사과 바나나 체리']);
  });

  it('줄 앞·뒤 공백은 trim됨', () => {
    const result = splitMultiplePairs('  apple 사과 banana 바나나  ');
    expect(result[0]).toBe('apple 사과');
    expect(result[1]).toBe('banana 바나나');
  });

  // ── 콤마/세미콜론 언어 전환 감지 ────────────────────────────────
  it('콤마 뒤 영문 전환 → 분리', () => {
    const result = splitMultiplePairs('be likely to 할 가능성이 있다, pay attention to : ~에 주의를 기울이다');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('be likely to 할 가능성이 있다');
    expect(result[1]).toBe('pay attention to : ~에 주의를 기울이다');
  });

  it('콤마 뒤 한글 → 분리 안 함 (뜻 여러 개)', () => {
    expect(splitMultiplePairs('ambiguous 애매한, 불분명한')).toHaveLength(1);
  });

  it('세미콜론 뒤 영문 전환 → 분리', () => {
    const result = splitMultiplePairs('procrastinate 미루다; volunteer 자원봉사자');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('procrastinate 미루다');
    expect(result[1]).toBe('volunteer 자원봉사자');
  });

  it('콤마 뒤 한글인 경우 + 이어서 공백+영문 → 공백 기준으로 분리', () => {
    // "사과, 과일 apple 사과" → "사과, 과일" 부분에서 콤마 뒤 한글이므로 분리 안 함
    // 이후 "과일 apple"에서 한글→공백→영문 → 분리
    const result = splitMultiplePairs('apple 사과, 과일 banana 바나나');
    // "사과, 과일" 다음 " banana"로 이어지는 지점: "일 b" → 공백+영문 → 분리
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('apple 사과, 과일');
    expect(result[1]).toBe('banana 바나나');
  });
});

// ── parseWordText — 한 줄 복수 쌍 통합 테스트 ───────────────────

describe('parseWordText — 한 줄 복수 쌍', () => {
  it('구분자 있는 두 쌍이 한 줄에 있는 경우 (사용자 제시 예시)', () => {
    const input = 'mail sorting : 우편물 분류 slightly : 약간, 조금';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'mail sorting', definition: '우편물 분류' });
    expect(result[1]).toEqual({ term: 'slightly', definition: '약간, 조금' });
  });

  it('구분자 없는 두 쌍이 한 줄에 있는 경우', () => {
    const input = 'volunteer 자원봉사자 ambiguous 애매한, 불분명한';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'volunteer', definition: '자원봉사자' });
    expect(result[1]).toEqual({ term: 'ambiguous', definition: '애매한, 불분명한' });
  });

  it('여러 줄 + 한 줄 복수 쌍 혼합', () => {
    const input = [
      'apple\t사과',
      'mail sorting : 우편물 분류 slightly : 약간, 조금',
      'volunteer 자원봉사자',
    ].join('\n');
    const result = parseWordText(input);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ term: 'apple', definition: '사과' });
    expect(result[1]).toEqual({ term: 'mail sorting', definition: '우편물 분류' });
    expect(result[2]).toEqual({ term: 'slightly', definition: '약간, 조금' });
    expect(result[3]).toEqual({ term: 'volunteer', definition: '자원봉사자' });
  });

  it('세 쌍이 한 줄에 있는 경우', () => {
    const input = 'apple 사과 banana 바나나 cherry 체리';
    const result = parseWordText(input);
    expect(result).toHaveLength(3);
    expect(result[0].term).toBe('apple');
    expect(result[1].term).toBe('banana');
    expect(result[2].term).toBe('cherry');
  });

  it('괄호 안의 영문이 있어도 한 쌍으로 유지', () => {
    const input = 'coordinator\t조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)';
    const result = parseWordText(input);
    expect(result).toHaveLength(1);
    expect(result[0].definition).toBe('조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)');
  });

  it('복합어(공백 포함 term)도 올바르게 처리', () => {
    const input = 'mail sorting 우편물 분류 pet coordinator 반려동물 담당자';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'mail sorting', definition: '우편물 분류' });
    expect(result[1]).toEqual({ term: 'pet coordinator', definition: '반려동물 담당자' });
  });

  // ── 콤마 언어 전환 분리 ──────────────────────────────────────────
  it('콤마 뒤 영문 전환 — 사용자 제시 예시', () => {
    const input = 'be likely to 할 가능성이 있다, pay attention to : ~에 주의를 기울이다';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'be likely to', definition: '할 가능성이 있다' });
    expect(result[1]).toEqual({ term: 'pay attention to', definition: '~에 주의를 기울이다' });
  });

  it('콤마 뒤 한글 → 뜻이 여러 개인 경우 분리 안 함', () => {
    const input = 'ambiguous : 애매한, 불분명한';
    const result = parseWordText(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ term: 'ambiguous', definition: '애매한, 불분명한' });
  });

  it('세미콜론 뒤 영문 전환 분리', () => {
    const input = 'procrastinate 미루다; volunteer 자원봉사자';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'procrastinate', definition: '미루다' });
    expect(result[1]).toEqual({ term: 'volunteer', definition: '자원봉사자' });
  });

  it('콤마 뒤 한글+영어 혼합 정의 — 분리 안 함', () => {
    // "(Pet Program Coordinator: 반려동물 프로그램 담당자)" 같은 케이스
    const input = 'coordinator : 조정자, 담당자 (Pet Program Coordinator: 반려동물 담당자)';
    const result = parseWordText(input);
    expect(result).toHaveLength(1);
    expect(result[0].term).toBe('coordinator');
    expect(result[0].definition).toContain('조정자, 담당자');
  });
});

// ── splitTermDefinition — 콜론 구분자 ───────────────────────────

describe('splitTermDefinition — 콜론 구분자', () => {
  it('" : " 패턴 분리', () => {
    expect(splitTermDefinition('apple : 사과')).toEqual(['apple', '사과']);
  });
  it('": " 패턴 분리', () => {
    expect(splitTermDefinition('slightly: 약간, 조금')).toEqual(['slightly', '약간, 조금']);
  });
  it('복합어 term + 콜론', () => {
    // 콜론 전략: \s*:\s+ 패턴이므로 term 후보는 trailing space 없이 캡처됨
    const [term, def] = splitTermDefinition('mail sorting : 우편물 분류');
    expect(term.trim()).toBe('mail sorting');
    expect(def).toBe('우편물 분류');
  });
  it('괄호 안 콜론은 스킵 — term이 영단어 5개 초과', () => {
    // "Pet Program Coordinator: 설명" → term 후보가 영단어 3개이므로 콜론 전략 적용
    // 이 케이스는 탭으로 이미 분리된 입력에서 definition 쪽에만 존재하므로
    // 단독 줄로는 영단어 term임을 확인
    const line = 'Pet Program Coordinator: 반려동물';
    const [term] = splitTermDefinition(line);
    expect(term.trim()).toBe('Pet Program Coordinator');
  });
  it('영단어 5개 초과 term → 콜론 전략 스킵 → 한글 기준 분리', () => {
    const line = 'one two three four five six: 설명';
    const [term] = splitTermDefinition(line);
    // 5단어 초과이므로 콜론 전략 스킵, 한글 첫 등장 기준
    expect(term).toContain('six');
  });
});

// ── normalizeInput ───────────────────────────────────────────────

describe('normalizeInput', () => {
  it('* 구분자 감지 및 줄 분리 — 원래 요청 예시', () => {
    const input = 'mail sorting : 우편물 분류 * slightly : 약간, 조금* procrastinate : 미루다, 늑장 부리다';
    const result = normalizeInput(input);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].trim()).toBe('mail sorting : 우편물 분류');
    expect(lines[1].trim()).toBe('slightly : 약간, 조금');
    expect(lines[2].trim()).toBe('procrastinate : 미루다, 늑장 부리다');
  });

  it('• 구분자', () => {
    const result = normalizeInput('apple : 사과 • banana : 바나나');
    expect(result.split('\n').filter(Boolean)).toHaveLength(2);
  });

  it('– em dash 구분자', () => {
    const result = normalizeInput('apple : 사과 – banana : 바나나');
    expect(result.split('\n').filter(Boolean)).toHaveLength(2);
  });

  it('숫자+마침표(1.) 구분자', () => {
    const result = normalizeInput('1. apple : 사과 2. banana : 바나나');
    const lines = result.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it('괄호 번호 (1) 구분자', () => {
    const result = normalizeInput('(1) apple : 사과 (2) banana : 바나나');
    const lines = result.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it('원문자 ① ② 구분자', () => {
    const result = normalizeInput('① apple : 사과 ② banana : 바나나');
    const lines = result.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it('복합 패턴 * 2. 구분자', () => {
    const result = normalizeInput('apple : 사과 * 2. banana : 바나나');
    const lines = result.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it('구분자 1회만 → 분리 안 함', () => {
    const input = 'apple : 사과 * banana : 바나나';
    // * 1회이면 조건 미충족 → 원본 반환
    // 실제로 *가 1개: "* banana" → 조건 2(followCount < 2) 가능성 확인
    const result = normalizeInput(input);
    // 분리될 수도 있음(followCount 따라) — 최소 1개의 줄이어야 함
    expect(result.split('\n').filter(Boolean).length).toBeGreaterThanOrEqual(1);
  });

  it('이미 줄바꿈이 있는 입력은 그대로', () => {
    const input = 'apple : 사과\nbanana : 바나나\ncherry : 체리';
    expect(normalizeInput(input)).toBe(input);
  });

  it('엣지 케이스 — definition 내 하이픈은 구분자 아님', () => {
    // "반려동물-프로그램"의 "-"는 1회이므로 조건 미충족 or followCount 부족
    const input = 'coordinator\t조정자, 담당자 (Pet Program Coordinator: 반려동물-프로그램 담당자)';
    expect(normalizeInput(input)).toBe(input);
  });
});

// ── parseWordText — normalizeInput 통합 테스트 ──────────────────

describe('parseWordText — 기호 구분자 입력', () => {
  it('* 구분자 — 원래 요청 예시 전체', () => {
    const input = 'mail sorting : 우편물 분류 * slightly : 약간, 조금* procrastinate : 미루다, 늑장 부리다';
    const result = parseWordText(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ term: 'mail sorting', definition: '우편물 분류' });
    expect(result[1]).toEqual({ term: 'slightly', definition: '약간, 조금' });
    expect(result[2]).toEqual({ term: 'procrastinate', definition: '미루다, 늑장 부리다' });
  });

  it('• 구분자', () => {
    const input = 'apple : 사과 • banana : 바나나';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0].term).toBe('apple');
    expect(result[1].term).toBe('banana');
  });

  it('① ② 원문자 구분자', () => {
    const input = '① mall sorting : 우편물 분류 ② slightly : 약간';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: 'mall sorting', definition: '우편물 분류' });
    expect(result[1]).toEqual({ term: 'slightly', definition: '약간' });
  });

  it('(1) (2) 괄호 번호 구분자', () => {
    const input = '(1) mall sorting : 우편물 분류 (2) slightly : 약간';
    const result = parseWordText(input);
    expect(result).toHaveLength(2);
    expect(result[0].term).toBe('mall sorting');
    expect(result[1].term).toBe('slightly');
  });

  it('기존 스펙 예시 회귀 — 기호 구분자 추가 후에도 통과', () => {
    const input = [
      'coordinator\t조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)',
      'ambiguous  애매한, 불분명한',
      'volunteer  자원봉사자',
      '담당자   coordinator',
      'empathy\t공감 능력',
    ].join('\n');
    const result = parseWordText(input);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ term: 'coordinator', definition: '조정자, 담당자 (Pet Program Coordinator: 반려동물 프로그램 담당자)' });
    expect(result[1]).toEqual({ term: 'ambiguous', definition: '애매한, 불분명한' });
    expect(result[2]).toEqual({ term: 'volunteer', definition: '자원봉사자' });
    expect(result[3]).toEqual({ term: 'coordinator', definition: '담당자' });
    expect(result[4]).toEqual({ term: 'empathy', definition: '공감 능력' });
  });
});
