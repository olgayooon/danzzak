import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, BarChart2, Share2, Link, X, Star, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ModeCard } from '../components/games/ModeCard';
import { useWordSet } from '../hooks/useWordSet';
import { useToast } from '../components/ui/Toast';
import { type GameMode } from '../types/game';
import { getTheme } from '../types/word';
import { useIsDark } from '../hooks/useIsDark';
import { generateShareUrl } from '../utils/shareWordSet';
import { buildGameShareUrl } from '../utils/shareGame';
import { cn } from '../utils/cn';

interface StudyMode {
  id: GameMode;
  title: string;
  description: string;
  icon: string;
  minWords: number;
  disabled?: boolean;
}

interface StudyCategory {
  category: string;
  description: string;
  modes: StudyMode[];
}

const STUDY_CATEGORIES: StudyCategory[] = [
  {
    category: '뜻 암기',
    description: '단어의 의미를 익혀요',
    modes: [
      { id: 'flashcard', title: '플래시카드', description: '앞뒤 뒤집으며 익히기', icon: '🃏', minWords: 1 },
      { id: 'multiple-choice', title: '4지선다', description: '보기 중 정답 고르기', icon: '🔘', minWords: 4 },
    ],
  },
  {
    category: '스펠링 암기',
    description: '철자를 정확하게 외워요',
    modes: [
      { id: 'typewriter', title: 'Typewriter', description: '보고 기억해서 타이핑', icon: '⌨️', minWords: 1 },
      { id: 'missing-letters', title: 'Missing Letters', description: '빈 철자 채우기', icon: '🔤', minWords: 1 },
      { id: 'fill-in', title: '빈칸 채우기', description: '뜻 보고 단어 쓰기', icon: '✍️', minWords: 1 },
    ],
  },
];

const GAME_MODES: StudyMode[] = [
  { id: 'matching', title: '매칭', description: '단어-뜻 빠르게 연결', icon: '🔗', minWords: 4 },
  { id: 'speed-quiz', title: '스피드 퀴즈', description: '타이머 안에 최대한', icon: '⚡', minWords: 4 },
  { id: 'falling', title: '크래싱', description: '떨어지는 단어 잡기', icon: '💥', minWords: 1 },
  { id: 'cloud-jump', title: '클라우드점프', description: '구름 타고 퀴즈 풀기', icon: '☁️', minWords: 4 },
];

type TabType = 'words' | 'study' | 'game';

export default function Study() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sets, setActiveSetId } = useWordSet();
  const toast = useToast();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [sharingSet, setSharingSet] = useState(false);

  const currentTab = (searchParams.get('tab') || 'words') as TabType;
  const weakOnly = searchParams.get('weakOnly') === 'true';
  const wordSet = sets.find(s => s.id === setId);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [hideTerms, setHideTerms] = useState(false);
  const [hideDefinitions, setHideDefinitions] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);

  const allWords = wordSet?.words ?? [];
  const displayWords = weakOnly ? allWords.filter(w => w.stats.wrong > w.stats.correct) : allWords;
  const weakCount = allWords.filter(w => w.stats.wrong > w.stats.correct).length;

  if (!wordSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[16px] text-[var(--color-ink-muted)]">단어장을 찾을 수 없어요.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  const isDark = useIsDark();
  const theme = getTheme(wordSet.theme, isDark);

  function handleSelectMode(mode: StudyMode) {
    if (mode.disabled) {
      toast('아직 준비 중인 게임이에요.', 'error');
      return;
    }
    if (displayWords.length < mode.minWords) {
      toast(`이 게임은 단어가 최소 ${mode.minWords}개 필요해요.`, 'error');
      return;
    }
    if (!wordSet) return;
    setActiveSetId(wordSet.id);
    const query = weakOnly ? '?weakOnly=true' : '';
    navigate(`/game/${mode.id}/${setId}${query}`);
  }

  function handleTabChange(tab: TabType) {
    setSearchParams({ tab });
  }

  function handleWeakOnlyToggle() {
    if (weakOnly) {
      setSearchParams({ tab: 'study' });
    } else {
      setSearchParams({ tab: 'study', weakOnly: 'true' });
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast('링크를 복사했어요!', 'success');
    } catch {
      toast('링크 복사에 실패했어요.', 'error');
    }
    setShareMenuOpen(false);
  }

  async function handleShareSet() {
    if (!wordSet || sharingSet) return;
    setSharingSet(true);
    try {
      const url = await generateShareUrl(wordSet);
      await navigator.clipboard.writeText(url);
      toast('단어장 링크를 복사했어요!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '링크 생성에 실패했어요.';
      toast(msg, 'error');
    } finally {
      setSharingSet(false);
      setShareMenuOpen(false);
    }
  }

  const allModes = [...STUDY_CATEGORIES.flatMap(c => c.modes), ...GAME_MODES];

  // weakOnly이고 취약단어가 0개면 안내 화면
  if (weakOnly && weakCount === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          내 단어장
        </button>

        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <p className="text-[40px]">🎉</p>
          <p className="text-[18px] font-bold text-[var(--color-ink)] text-center">취약단어가 없어요! 다 외웠네요.</p>
          <Button onClick={() => handleWeakOnlyToggle()}>전체 단어 학습하기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      {/* 헤더 */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        내 단어장
      </button>

      <h1 className="text-[20px] font-extrabold text-[var(--color-ink)] mb-1">{wordSet.title}</h1>
      <p className="text-[13px] text-[var(--color-ink-muted)] mb-6">
        {displayWords.length}개 단어 {weakCount > 0 && `· 취약 ${weakCount}개`}
      </p>

      {/* 공유 & 편집 버튼 */}
      <div className="flex gap-2 mb-6">
        <Button variant="utility" size="sm" onClick={() => navigate(`/edit/${wordSet.id}`)}>
          편집
        </Button>
        <div className="relative">
          <Button variant="utility" size="sm" onClick={() => setShareMenuOpen(v => !v)}>
            <Share2 size={13} />
            공유
          </Button>
          {shareMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShareMenuOpen(false)} />
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-40 bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-y-auto max-h-[60vh] min-w-[200px] max-w-[calc(100vw-32px)] sm:max-w-none animate-fade-in">
                <button
                  onClick={handleShareSet}
                  disabled={sharingSet}
                  className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-[var(--color-canvas)] transition-colors disabled:opacity-60"
                >
                  {sharingSet
                    ? <div className="w-[15px] h-[15px] rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin shrink-0" />
                    : <Link size={15} className="text-[var(--color-primary)] shrink-0" />
                  }
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">단어장 공유</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {sharingSet ? '링크 생성 중...' : '받는 사람이 내 단어장에 추가'}
                    </p>
                  </div>
                </button>
                <div className="h-px bg-[var(--color-hairline)]" />
                {allModes.map(mode => (
                  mode.id === 'multiple-choice' ? (
                    <div key={mode.id}>
                      <button
                        onClick={() => copyUrl(buildGameShareUrl(wordSet, 'multiple-choice', 'term'))}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-left hover:bg-[var(--color-canvas)] transition-colors"
                      >
                        <span className="text-lg">{mode.icon}</span>
                        <div>
                          <p className="font-semibold text-[var(--color-ink)]">4지선다 · 뜻 고르기</p>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">단어 보고 뜻 선택</p>
                        </div>
                      </button>
                      <button
                        onClick={() => copyUrl(buildGameShareUrl(wordSet, 'multiple-choice', 'definition'))}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-left hover:bg-[var(--color-canvas)] transition-colors"
                      >
                        <span className="text-lg">{mode.icon}</span>
                        <div>
                          <p className="font-semibold text-[var(--color-ink)]">4지선다 · 단어 고르기</p>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">뜻 보고 단어 선택</p>
                        </div>
                      </button>
                      <button
                        onClick={() => copyUrl(buildGameShareUrl(wordSet, 'multiple-choice', 'mixed'))}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-left hover:bg-[var(--color-canvas)] transition-colors"
                      >
                        <span className="text-lg">{mode.icon}</span>
                        <div>
                          <p className="font-semibold text-[var(--color-ink)]">4지선다 · 랜덤 혼합</p>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">뜻/단어 무작위 출제</p>
                        </div>
                      </button>
                    </div>
                  ) : (
                  <button
                    key={mode.id}
                    onClick={() => copyUrl(buildGameShareUrl(wordSet, mode.id as GameMode))}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-left hover:bg-[var(--color-canvas)] transition-colors"
                  >
                    <span className="text-lg">{mode.icon}</span>
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{mode.title}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">닉네임 입력 후 바로 플레이</p>
                    </div>
                  </button>
                  )
                ))}
                <div className="h-px bg-[var(--color-hairline)]" />
                <button
                  onClick={() => setShareMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas)] transition-colors"
                >
                  <X size={13} /> 닫기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 취약단어 필터 칩 */}
      {weakOnly && (
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]">
          <span className="text-[12px] font-semibold text-[var(--color-danger)]">🔴 취약단어 {weakCount}개만 학습 중</span>
          <button
            onClick={handleWeakOnlyToggle}
            className="text-[var(--color-danger)] hover:text-[var(--color-danger)] font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 탭 바 */}
      <div className="flex gap-6 border-b border-[var(--color-hairline)] mb-6 overflow-x-auto">
        {(['words', 'study', 'game'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              'pb-3 text-[15px] font-bold transition-colors relative whitespace-nowrap',
              currentTab === tab
                ? 'text-[var(--color-ink)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            )}
          >
            {tab === 'words' ? '📝 단어' : tab === 'study' ? '📖 학습하기' : '🎮 게임하기'}
            {currentTab === tab && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: theme.primary }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 단어 탭 */}
      {currentTab === 'words' && (
        <div className="space-y-3">
          {displayWords.length === 0 ? (
            <p className="text-center text-[13px] text-[var(--color-ink-muted)] py-8">
              단어가 없어요.
            </p>
          ) : (
            <>
              {/* 필터/정렬 버튼 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setOnlyStarred(!onlyStarred)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all',
                    onlyStarred
                      ? 'bg-[var(--color-warning)] text-white'
                      : 'bg-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas)]'
                  )}
                >
                  ★ 별표만
                </button>
                <button
                  onClick={() => setSortAlphabetically(!sortAlphabetically)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all',
                    sortAlphabetically
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas)]'
                  )}
                >
                  ABC 정렬
                </button>
              </div>

              {/* 단어 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-hairline)]">
                      <th className="px-3 py-2 text-left text-[12px] font-semibold text-[var(--color-ink-muted)] w-8">#</th>
                      <th className="px-3 py-2 text-left text-[12px] font-semibold text-[var(--color-ink-muted)] w-8"></th>
                      <th className="px-3 py-2 text-left text-[12px] font-semibold text-[var(--color-ink-muted)] min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span>영단어</span>
                          <button
                            onClick={() => setHideTerms(!hideTerms)}
                            className="text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors"
                            title={hideTerms ? '보기' : '숨기기'}
                          >
                            {hideTerms ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-[12px] font-semibold text-[var(--color-ink-muted)] min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span>한글뜻</span>
                          <button
                            onClick={() => setHideDefinitions(!hideDefinitions)}
                            className="text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors"
                            title={hideDefinitions ? '보기' : '숨기기'}
                          >
                            {hideDefinitions ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let words = displayWords;
                      if (onlyStarred) {
                        words = words.filter(w => starredIds.has(w.id));
                      }
                      if (sortAlphabetically) {
                        words = [...words].sort((a, b) => a.term.localeCompare(b.term));
                      }
                      return words.map((word, idx) => (
                        <tr key={word.id} className="border-b border-[var(--color-hairline)] hover:bg-[var(--color-canvas)]">
                          <td className="px-3 py-2 text-[12px] text-[var(--color-ink-muted)]">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => {
                                const newStarred = new Set(starredIds);
                                if (newStarred.has(word.id)) {
                                  newStarred.delete(word.id);
                                } else {
                                  newStarred.add(word.id);
                                }
                                setStarredIds(newStarred);
                              }}
                              className="text-[var(--color-ink-muted)] hover:text-[var(--color-warning)] transition-colors"
                            >
                              <Star
                                size={16}
                                fill={starredIds.has(word.id) ? 'currentColor' : 'none'}
                                className={starredIds.has(word.id) ? 'text-[var(--color-warning)]' : ''}
                              />
                            </button>
                          </td>
                          <td className={cn(
                            'px-3 py-2 text-[14px] font-semibold',
                            hideTerms
                              ? 'text-[var(--color-hairline)]'
                              : 'text-[var(--color-ink)]'
                          )}>
                            {hideTerms ? '••••••' : word.term}
                          </td>
                          <td className={cn(
                            'px-3 py-2 text-[13px]',
                            hideDefinitions
                              ? 'text-[var(--color-hairline)]'
                              : 'text-[var(--color-ink-muted)]'
                          )}>
                            {hideDefinitions ? '••••••' : word.definition}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 학습하기 탭 */}
      {currentTab === 'study' && (
        <div className="space-y-6">
          {/* 취약단어 배너 */}
          {!weakOnly && weakCount > 0 && (
            <div className="p-4 rounded-lg border-l-4 border-[var(--color-danger)] bg-[var(--color-danger-subtle)]">
              <p className="text-[14px] font-bold text-[var(--color-danger)] mb-1">
                🔴 취약단어 {weakCount}개 있어요
              </p>
              <p className="text-[13px] text-[var(--color-danger)] mb-3">
                취약단어만 골라서 학습할까요?
              </p>
              <button
                onClick={handleWeakOnlyToggle}
                className="text-[13px] font-semibold text-[var(--color-danger)] hover:underline"
              >
                취약단어만 학습 →
              </button>
            </div>
          )}

          {/* 카테고리별 모드 */}
          {STUDY_CATEGORIES.map((cat, idx) => (
            <div key={idx}>
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {cat.category}
                </p>
                <p className="text-[13px] text-[var(--color-ink-muted)]">{cat.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cat.modes.map(mode => (
                  <ModeCard
                    key={mode.id}
                    icon={mode.icon}
                    title={mode.title}
                    description={mode.description}
                    onClick={() => handleSelectMode(mode)}
                    disabled={mode.disabled}
                    dimmed={displayWords.length < mode.minWords}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 게임하기 탭 */}
      {currentTab === 'game' && (
        <div className="space-y-6">
          {/* 유도 문구 */}
          <div className="text-center">
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              💡 단어를 먼저 학습하고 오면 더 재밌어요!
            </p>
            <button
              onClick={() => handleTabChange('study')}
              className="text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
            >
              학습하기 탭에서 먼저 외워보세요 →
            </button>
          </div>

          {/* 게임 카드 그리드 */}
          <div className="grid grid-cols-2 gap-2">
            {GAME_MODES.map(mode => (
              <ModeCard
                key={mode.id}
                icon={mode.icon}
                title={mode.title}
                description={mode.description}
                badge={mode.id === 'cloud-jump' ? 'NEW' : undefined}
                onClick={() => handleSelectMode(mode)}
                disabled={mode.disabled}
                dimmed={displayWords.length < mode.minWords}
              />
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="border-t border-[var(--color-hairline)] mt-8 pt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate(`/worksheet/${wordSet.id}`)}>
          <FileText size={16} />
          시험지 만들기
        </Button>
        <Button variant="utility" onClick={() => navigate(`/records?setId=${wordSet.id}`)}>
          <BarChart2 size={16} />
          학습 기록
        </Button>
      </div>
    </div>
  );
}
