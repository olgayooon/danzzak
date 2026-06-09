import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Clock, Zap, ChevronDown } from 'lucide-react';
import { useStudyRecord, calcAccuracy } from '../hooks/useStudyRecord';
import { useWordSet } from '../hooks/useWordSet';
import { GAME_MODE_INFO } from '../types/game';
import { Badge } from '../components/ui/Badge';
import { getTheme } from '../types/word';
import { useIsDark } from '../hooks/useIsDark';
import { cn } from '../utils/cn';

function formatDuration(secs: number) {
  if (secs < 60) return `${secs}초`;
  return `${Math.floor(secs / 60)}분 ${secs % 60}초`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AccuracyText({ value }: { value: number }) {
  const color = value >= 80
    ? 'text-[var(--color-success)]'
    : value >= 50
    ? 'text-[var(--color-warning)]'
    : 'text-[var(--color-danger)]';
  return <span className={color}>{value}%</span>;
}

// ── 단어장별 집중 뷰 ────────────────────────────────────────────────
function SetRecordsView({ setId }: { setId: string }) {
  const navigate = useNavigate();
  const { records } = useStudyRecord();
  const { sets } = useWordSet();

  const wordSet = sets.find(s => s.id === setId);
  const setRecords = records
    .filter(r => r.setId === setId)
    .slice()
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

  const isDark = useIsDark();
  const theme = getTheme(wordSet?.theme ?? 'violet', isDark);

  const totalGames = setRecords.length;
  const avgAccuracy = totalGames > 0
    ? Math.round(setRecords.reduce((acc, r) => acc + calcAccuracy(r), 0) / totalGames)
    : 0;
  const maxCombo = setRecords.reduce((max, r) => Math.max(max, r.combo), 0);
  const totalTime = setRecords.reduce((sum, r) => sum + r.duration, 0);

  // 게임 모드별 집계
  const byMode = setRecords.reduce((acc, r) => {
    if (!acc[r.mode]) acc[r.mode] = { count: 0, correctSum: 0, wrongSum: 0 };
    acc[r.mode].count++;
    acc[r.mode].correctSum += r.correct;
    acc[r.mode].wrongSum += r.wrong;
    return acc;
  }, {} as Record<string, { count: number; correctSum: number; wrongSum: number }>);

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      {/* 헤더 */}
      <button
        onClick={() => navigate(`/study/${setId}`)}
        className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {wordSet?.title ?? '단어장으로'}
      </button>

      {/* 단어장 타이틀 배너 */}
      <div
        className="rounded-[16px] px-5 py-4 mb-6 flex items-center gap-3"
        style={{ backgroundColor: theme.cardBg, border: `1.5px solid ${theme.cardBorder}` }}
      >
        <span className="text-3xl">{wordSet?.emoji ?? '📖'}</span>
        <div>
          <p className="text-[18px] font-extrabold text-[var(--color-ink)]">{wordSet?.title ?? '삭제된 단어장'}</p>
          <p className="text-[12px] text-[var(--color-ink-muted)]">{wordSet?.words.length ?? 0}개 단어 · 학습 기록</p>
        </div>
      </div>

      {totalGames === 0 ? (
        <div className="text-center py-16 text-[var(--color-ink-muted)]">
          <p className="text-[16px] mb-2">아직 이 단어장의 게임 기록이 없어요.</p>
          <button
            onClick={() => navigate(`/study/${setId}?tab=study`)}
            className="text-[14px] font-semibold text-[var(--color-primary)] hover:underline"
          >
            지금 학습 시작하기 →
          </button>
        </div>
      ) : (
        <>
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <Target size={16} />, label: '총 게임', value: `${totalGames}회`, color: 'text-[var(--color-primary)]' },
              { icon: <TrendingUp size={16} />, label: '평균 정확도', value: `${avgAccuracy}%`, color: avgAccuracy >= 80 ? 'text-[var(--color-success)]' : avgAccuracy >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]' },
              { icon: <Zap size={16} />, label: '최고 콤보', value: `${maxCombo}`, color: 'text-[var(--color-accent-yellow)]' },
              { icon: <Clock size={16} />, label: '총 학습 시간', value: formatDuration(totalTime), color: 'text-[var(--color-info)]' },
            ].map(stat => (
              <div key={stat.label} className="bg-[var(--color-surface)] rounded-[14px] border border-[var(--color-hairline)] p-3 flex flex-col gap-1.5">
                <div className={stat.color}>{stat.icon}</div>
                <p className={`text-[20px] font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-[var(--color-ink-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* 게임 모드별 현황 */}
          <div className="mb-8">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">게임 모드별 현황</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(byMode).map(([mode, stat]) => {
                const modeInfo = GAME_MODE_INFO[mode as keyof typeof GAME_MODE_INFO];
                if (!modeInfo) return null;
                const acc = Math.round(stat.correctSum / (stat.correctSum + stat.wrongSum) * 100);
                return (
                  <div
                    key={mode}
                    className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-hairline)] px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-xl shrink-0">{modeInfo.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--color-ink)]">{modeInfo.label}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">{stat.count}회 플레이</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-bold"><AccuracyText value={acc} /></p>
                      <p className="text-[10px] text-[var(--color-ink-faint)]">평균 정확도</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 최근 기록 목록 */}
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">최근 기록</h2>
            <div className="flex flex-col gap-1.5">
              {setRecords.map((record, idx) => {
                const accuracy = calcAccuracy(record);
                const modeInfo = GAME_MODE_INFO[record.mode];
                return (
                  <div
                    key={idx}
                    className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-hairline)] px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: theme.cardBg }}>
                      {modeInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--color-ink)]">{modeInfo.label}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">{formatDate(record.playedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-[14px] font-bold"><AccuracyText value={accuracy} /></p>
                        <p className="text-[10px] text-[var(--color-ink-faint)]">{record.correct}/{record.correct + record.wrong}</p>
                      </div>
                      {record.combo >= 5 && (
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">🔥{record.combo}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 전체 기록 뷰 ────────────────────────────────────────────────────
export default function Records() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { records } = useStudyRecord();
  const { sets } = useWordSet();
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());

  const focusSetId = searchParams.get('setId');
  if (focusSetId) return <SetRecordsView setId={focusSetId} />;

  const totalGames = records.length;
  const avgAccuracy = totalGames > 0
    ? Math.round(records.reduce((acc, r) => acc + calcAccuracy(r), 0) / totalGames)
    : 0;
  const maxCombo = records.reduce((max, r) => Math.max(max, r.combo), 0);
  const totalTime = records.reduce((sum, r) => sum + r.duration, 0);

  function toggleSet(setId: string) {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) newExpanded.delete(setId);
    else newExpanded.add(setId);
    setExpandedSets(newExpanded);
  }

  const recordsBySet = records.reduce((acc, record) => {
    if (!acc[record.setId]) acc[record.setId] = [];
    acc[record.setId].push(record);
    return acc;
  }, {} as Record<string, typeof records>);

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={16} /> 홈
        </button>
        <h1 className="text-[24px] font-extrabold text-[var(--color-ink)] tracking-tight">학습 기록</h1>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: <Target size={18} />, label: '총 게임', value: `${totalGames}회`, color: 'text-[var(--color-primary)]' },
          { icon: <TrendingUp size={18} />, label: '평균 정확도', value: `${avgAccuracy}%`, color: totalGames > 0 ? (avgAccuracy >= 80 ? 'text-[var(--color-success)]' : avgAccuracy >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]') : 'text-[var(--color-ink-muted)]' },
          { icon: <Zap size={18} />, label: '최고 콤보', value: `${maxCombo}`, color: 'text-[var(--color-accent-yellow)]' },
          { icon: <Clock size={18} />, label: '총 학습 시간', value: formatDuration(totalTime), color: 'text-[var(--color-info)]' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-hairline)] p-4 flex flex-col gap-2">
            <div className={`${stat.color}`}>{stat.icon}</div>
            <p className={`text-[22px] font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-[12px] text-[var(--color-ink-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-ink-muted)]">
          <p className="text-[16px] mb-2">아직 게임 기록이 없어요.</p>
          <p className="text-[14px]">단어장을 만들고 게임을 시작해보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-2">기록</h2>
          {Object.entries(recordsBySet).map(([setId, setRecords]) => {
            const wordSet = sets.find(s => s.id === setId);
            const isExpanded = expandedSets.has(setId);

            return (
              <div key={setId} className="border border-[var(--color-hairline)] rounded-[14px] overflow-hidden">
                <button
                  onClick={() => toggleSet(setId)}
                  className="w-full bg-[var(--color-surface)] hover:bg-[var(--color-canvas)] transition-colors p-4 flex items-center gap-3"
                >
                  <ChevronDown
                    size={18}
                    className={cn(
                      'text-[var(--color-ink-muted)] transition-transform shrink-0',
                      !isExpanded && '-rotate-90'
                    )}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[14px] font-bold text-[var(--color-ink)] truncate">
                      {wordSet?.title ?? '삭제된 단어장'}
                    </p>
                    <p className="text-[12px] text-[var(--color-ink-muted)]">
                      {setRecords.length}개 기록
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const avgAcc = Math.round(
                        setRecords.reduce((acc, r) => acc + calcAccuracy(r), 0) / setRecords.length
                      );
                      return (
                        <p className={`text-[14px] font-bold ${
                          avgAcc >= 80 ? 'text-[var(--color-success)]' : avgAcc >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
                        }`}>
                          {avgAcc}%
                        </p>
                      );
                    })()}
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/records?setId=${setId}`); }}
                      className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline px-2 py-1 rounded-md hover:bg-[var(--color-primary-subtle)] transition-colors"
                    >
                      자세히
                    </button>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-[var(--color-canvas)] border-t border-[var(--color-hairline)]">
                    {setRecords.map((record, idx) => {
                      const accuracy = calcAccuracy(record);
                      const modeInfo = GAME_MODE_INFO[record.mode];
                      return (
                        <div
                          key={idx}
                          onClick={() => navigate(`/study/${record.setId}`)}
                          className={cn(
                            'p-3 flex items-center gap-3 hover:bg-[var(--color-surface)] transition-colors cursor-pointer',
                            idx > 0 && 'border-t border-[var(--color-hairline)]'
                          )}
                        >
                          <div className="w-8 h-8 rounded-[8px] bg-[var(--color-surface)] flex items-center justify-center text-lg shrink-0">
                            {modeInfo.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--color-ink)] truncate">{modeInfo.label}</p>
                            <p className="text-[11px] text-[var(--color-ink-muted)]">{formatDate(record.playedAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className={`text-[14px] font-bold ${accuracy >= 80 ? 'text-[var(--color-success)]' : accuracy >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>
                                {accuracy}%
                              </p>
                              <p className="text-[10px] text-[var(--color-ink-faint)]">{record.correct}/{record.correct + record.wrong}</p>
                            </div>
                            {record.combo >= 5 && (
                              <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">{record.combo}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
