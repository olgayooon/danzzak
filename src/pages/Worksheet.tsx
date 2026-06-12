import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Pencil, Eye, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '../components/ui/Button';
import { SortableItem } from '../components/worksheet/SortableItem';
import { useWordSet } from '../hooks/useWordSet';
import { useToast } from '../components/ui/Toast';
import type { WorksheetConfig, WorksheetType } from '../types/worksheet';
import { WORKSHEET_TYPE_INFO } from '../types/worksheet';
import { shuffleArray } from '../utils/gameUtils';
import type { Word } from '../types/word';
import { cn } from '../utils/cn';

const DEFAULT_CONFIG: WorksheetConfig = {
  type: 'fill-blank',
  title: '',
  columns: 2,
  questionField: 'definition',
  repeatCount: 3,
  includeAnswer: true,
  fontSize: 'md',
  lineSpacing: 'normal',
  scramble: false,
};

const AVAILABLE_TYPES: WorksheetType[] = ['fill-blank', 'write-repeat', 'checklist', 'multiple-choice', 'translation'];

/** 단어 배열을 N개 컬럼으로 균등 분할 */
function splitIntoColumns(words: Word[], cols: number): Word[][] {
  const safeCols = cols === 4 ? 3 : cols;
  const perCol = Math.ceil(words.length / safeCols);
  return Array.from({ length: safeCols }, (_, i) =>
    words.slice(i * perCol, (i + 1) * perCol)
  ).filter(g => g.length > 0);
}

export default function Worksheet() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { sets } = useWordSet();
  const toast = useToast();

  const wordSet = sets.find(s => s.id === setId);
  const [config, setConfig] = useState<WorksheetConfig>({
    ...DEFAULT_CONFIG,
    title: wordSet ? `${wordSet.title} 시험지` : '단어 시험지',
  });
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(config.title);
  const [editedWords, setEditedWords] = useState<Word[]>(wordSet?.words ?? []);
const [typeOpen, setTypeOpen] = useState(true);
  const [editOpen, setEditOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!wordSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--color-ink-muted)]">단어장을 찾을 수 없어요.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  function toggleEdit() {
    if (!editMode) {
      setEditedTitle(config.title);
      setEditedWords(config.scramble ? shuffleArray(wordSet!.words) : [...wordSet!.words]);
    }
    setEditMode(v => !v);
  }

  const displayWords = editMode
    ? editedWords
    : (config.scramble ? shuffleArray(wordSet.words) : wordSet.words);

  function update<K extends keyof WorksheetConfig>(key: K, value: WorksheetConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditedWords(items => {
        const oldIdx = items.findIndex(w => w.id === active.id);
        const newIdx = items.findIndex(w => w.id === over.id);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  }

  function updateEditedWord(id: string, field: 'term' | 'definition', value: string) {
    setEditedWords(words => words.map(w => w.id === id ? { ...w, [field]: value } : w));
  }


const fontSize = config.fontSize;
  const lineSpacing = config.lineSpacing;
  const cols = config.type === 'multiple-choice' ? 1 : config.columns;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6 no-print">
        <button onClick={() => navigate(`/study/${setId}`)} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={16} /> 뒤로
        </button>
        <h1 className="text-[22px] font-extrabold text-[var(--color-ink)] tracking-tight flex-1">시험지 만들기</h1>
        <button
          onClick={toggleEdit}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all',
            editMode
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-canvas)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-hairline)]'
          )}
        >
          {editMode ? <><Eye size={14} /> 미리보기</> : <><Pencil size={14} /> 직접 편집</>}
        </button>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* 설정 패널 */}
        <div className="no-print w-full lg:w-64 shrink-0 flex flex-col gap-4">
          {/* 시험지 유형 */}
          <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-hairline)] overflow-hidden">
            <button
              onClick={() => setTypeOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-canvas)] transition-colors"
            >
              <h2 className="text-[14px] font-bold text-[var(--color-ink)]">시험지 유형</h2>
              {typeOpen ? <ChevronUp size={16} className="text-[var(--color-ink-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-ink-muted)]" />}
            </button>
            {typeOpen && (
              <div className="px-5 pb-4 flex flex-col gap-1">
                {(Object.entries(WORKSHEET_TYPE_INFO) as [WorksheetType, typeof WORKSHEET_TYPE_INFO[WorksheetType]][]).map(([type, info]) => {
                  const available = AVAILABLE_TYPES.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => available && update('type', type)}
                      disabled={!available}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-[10px] text-left transition-all',
                        config.type === type && available ? 'bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]' : '',
                        available ? 'hover:bg-[var(--color-canvas)] cursor-pointer' : 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <span className="text-lg">{info.emoji}</span>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--color-ink)]">{info.label}</p>
                        {!available && <p className="text-[10px] text-[var(--color-ink-faint)]">준비중</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 시험지 편집 */}
          <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-hairline)] overflow-hidden">
            <button
              onClick={() => setEditOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-canvas)] transition-colors"
            >
              <h2 className="text-[14px] font-bold text-[var(--color-ink)]">시험지 편집</h2>
              {editOpen ? <ChevronUp size={16} className="text-[var(--color-ink-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-ink-muted)]" />}
            </button>
            <div className={cn('px-5 pb-5 flex flex-col gap-3', editOpen ? 'block' : 'hidden')}>

            <div>
              <label className="text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block uppercase tracking-wide">제목</label>
              <input
                value={editMode ? editedTitle : config.title}
                onChange={e => editMode ? setEditedTitle(e.target.value) : update('title', e.target.value)}
                className="w-full border border-[var(--color-hairline)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            {(config.type === 'fill-blank' || config.type === 'multiple-choice') && (
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block uppercase tracking-wide">문제</label>
                <div className="flex gap-1.5">
                  {([
                    ['definition', '한글 뜻'] as const,
                    ['term', '영단어'] as const,
                  ]).map(([field, label]) => (
                    <button
                      key={field}
                      onClick={() => update('questionField', field)}
                      className={cn(
                        'flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all',
                        (config.questionField ?? 'definition') === field
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-hairline)] hover:border-[var(--color-primary)]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {config.type !== 'multiple-choice' && (
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block uppercase tracking-wide">열 수</label>
                <div className="flex gap-1.5">
                  {([1, 2, 3] as const).map(col => (
                    <button key={col} onClick={() => update('columns', col)}
                      className={cn('flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all',
                        config.columns === col ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-hairline)] hover:border-[var(--color-primary)]'
                      )}>
                      {col}단
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block uppercase tracking-wide">글자 크기</label>
              <div className="flex gap-1.5">
                {(['sm', 'md', 'lg'] as const).map(size => (
                  <button key={size} onClick={() => update('fontSize', size)}
                    className={cn('flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all',
                      config.fontSize === size ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-hairline)] hover:border-[var(--color-primary)]'
                    )}>
                    {size === 'sm' ? '작게' : size === 'md' ? '보통' : '크게'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block uppercase tracking-wide">줄 간격</label>
              <div className="flex gap-1.5">
                {(['normal', 'wide'] as const).map(spacing => (
                  <button key={spacing} onClick={() => update('lineSpacing', spacing)}
                    className={cn('flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all',
                      config.lineSpacing === spacing ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-hairline)] hover:border-[var(--color-primary)]'
                    )}>
                    {spacing === 'normal' ? '보통' : '넓게'}
                  </button>
                ))}
              </div>
            </div>

            {!editMode && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.scramble} onChange={e => update('scramble', e.target.checked)} className="w-4 h-4 accent-[var(--color-primary)]" />
                <span className="text-[12px] text-[var(--color-ink)]">문제 순서 섞기</span>
              </label>
            )}

            {config.type !== 'write-repeat' && config.type !== 'checklist' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.includeAnswer} onChange={e => update('includeAnswer', e.target.checked)} className="w-4 h-4 accent-[var(--color-primary)]" />
                <span className="text-[12px] text-[var(--color-ink)]">정답지 포함</span>
              </label>
            )}

            {config.type === 'write-repeat' && (
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block uppercase tracking-wide">반복 횟수</label>
                <input type="number" min={1} max={10} value={config.repeatCount ?? 3}
                  onChange={e => update('repeatCount', Number(e.target.value))}
                  className="w-full border border-[var(--color-hairline)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button size="md" onClick={() => window.print()} className="flex-1">
                <Printer size={15} /> 인쇄
              </Button>
            </div>
            <Button
              size="md"
              variant="utility"
              className="w-full"
              onClick={() => {
                toast('인쇄 창이 열리면 "PDF로 저장"을 선택하세요.', 'success');
                setTimeout(() => window.print(), 300);
              }}
            >
              <FileDown size={15} /> PDF 저장
            </Button>
          </div>
        </div>

        {/* 시험지 미리보기 */}
        <div className="flex-1 overflow-x-auto rounded-[16px]">
          <div
            className="worksheet-container bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-hairline)] p-8 shadow-[0_2px_8px_rgba(124,58,237,0.08)] min-w-[680px]"
            style={{ minHeight: '842px' }}
          >
          {/* 시험지 헤더 */}
          <div className="worksheet-header border-b-2 border-[var(--color-ink)] pb-3 mb-5">
            <div className="flex items-end justify-between gap-4">
              {editMode ? (
                <input
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="text-[20px] font-extrabold text-[var(--color-ink)] bg-transparent border-b-2 border-[var(--color-primary)] outline-none flex-1 min-w-0"
                  aria-label="시험지 제목 편집"
                />
              ) : (
                <h2 className="text-[20px] font-extrabold text-[var(--color-ink)]">{config.title || '시험지'}</h2>
              )}
              <div className="flex gap-5 text-[13px] text-[var(--color-ink-secondary)] shrink-0">
                <span>이름:&nbsp;<span className="inline-block border-b border-[var(--color-ink)] w-24 align-bottom" /></span>
                <span>날짜:&nbsp;<span className="inline-block border-b border-[var(--color-ink)] w-20 align-bottom" /></span>
                <span>점수:&nbsp;<span className="inline-block border-b border-[var(--color-ink)] w-14 align-bottom" /> 점</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-ink-muted)] mt-1.5">
              {wordSet.title} · {displayWords.length}문항
              {editMode && <span className="ml-2 text-[var(--color-primary)] font-semibold">편집 모드 — 드래그로 순서 변경, 텍스트 클릭으로 수정</span>}
            </p>
          </div>

          {/* 시트 본문 */}
          {editMode ? (
            <EditableSheet
              words={editedWords}
              config={config}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              onDragEnd={handleDragEnd}
              onUpdateWord={updateEditedWord}
              sensors={sensors}
            />
          ) : (
            <SheetRenderer
              words={displayWords}
              config={config}
              cols={cols}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 공통 스타일 헬퍼 ────────────────────────────────────────────

const FS: Record<string, string> = { sm: '12px', md: '14px', lg: '16px' };
const ROW_H: Record<string, string> = { normal: '28px', wide: '40px' };

function getQuestionText(word: Word, questionField: 'definition' | 'term') {
  return questionField === 'definition' ? word.definition : word.term;
}

function getAnswerText(word: Word, questionField: 'definition' | 'term') {
  return questionField === 'definition' ? word.term : word.definition;
}

// ── 미리보기 렌더러 ─────────────────────────────────────────────

function SheetRenderer({ words, config, cols, fontSize, lineSpacing }: {
  words: Word[]; config: WorksheetConfig; cols: number; fontSize: string; lineSpacing: string;
}) {
  if (config.type === 'fill-blank') {
    return <FillBlankTable words={words} cols={cols} fontSize={fontSize} lineSpacing={lineSpacing} includeAnswer={config.includeAnswer} questionField={config.questionField ?? 'definition'} />;
  }
  if (config.type === 'write-repeat') {
    return <WriteRepeatTable words={words} cols={cols} fontSize={fontSize} lineSpacing={lineSpacing} repeatCount={config.repeatCount ?? 3} />;
  }
  if (config.type === 'checklist') {
    return <ChecklistTable words={words} cols={cols} fontSize={fontSize} lineSpacing={lineSpacing} />;
  }
  if (config.type === 'multiple-choice') {
    return <MultipleChoiceTable words={words} fontSize={fontSize} lineSpacing={lineSpacing} includeAnswer={config.includeAnswer} questionField={config.questionField ?? 'definition'} />;
  }
  if (config.type === 'translation') {
    return <TranslationTable words={words} cols={cols} fontSize={fontSize} lineSpacing={lineSpacing} includeAnswer={config.includeAnswer} />;
  }
  return null;
}

// ── 빈칸 채우기 ─────────────────────────────────────────────────

function FillBlankTable({ words, cols, fontSize, lineSpacing, includeAnswer, questionField }: {
  words: Word[]; cols: number; fontSize: string; lineSpacing: string; includeAnswer: boolean; questionField: 'definition' | 'term';
}) {
  const groups = splitIntoColumns(words, cols);
  const fs = FS[fontSize] ?? '14px';
  const rowH = ROW_H[lineSpacing] ?? '28px';

  return (
    <>
      <div className="worksheet-section flex gap-6">
        {groups.map((group, gi) => {
          const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
          return (
            <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
              <colgroup>
                <col style={{ width: '24px' }} />
                <col style={{ width: '45%' }} />
                <col />
              </colgroup>
              <tbody>
                {group.map((word, i) => (
                  <tr key={word.id} style={{ minHeight: rowH, breakInside: 'avoid' }}>
                    <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-top pt-1 whitespace-nowrap">
                      {offset + i + 1}.
                    </td>
                    <td className="align-top pt-1 pb-1 pr-2 text-[var(--color-ink-secondary)] leading-snug break-words">
                      {getQuestionText(word, questionField)}
                    </td>
                    <td className="align-bottom" style={{ borderBottom: '1.5px solid #18181B' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
      {includeAnswer && <AnswerKeyTable words={words} cols={cols} fontSize={fontSize} answerField={questionField === 'definition' ? 'term' : 'definition'} />}
    </>
  );
}

// ── 반복 쓰기 ────────────────────────────────────────────────────

function WriteRepeatTable({ words, cols, fontSize, lineSpacing, repeatCount }: {
  words: Word[]; cols: number; fontSize: string; lineSpacing: string; repeatCount: number;
}) {
  const groups = splitIntoColumns(words, cols);
  const fs = FS[fontSize] ?? '14px';
  const lineH = lineSpacing === 'wide' ? '36px' : '26px';

  return (
    <div className="worksheet-section flex gap-8">
      {groups.map((group, gi) => {
        const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
        return (
          <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
              {group.map((word, i) => (
                <tbody key={word.id} style={{ breakInside: 'avoid' }}>
                  <tr>
                    <td className="text-right pr-1.5 text-[var(--color-ink-faint)] whitespace-nowrap align-top pt-1" style={{ width: '22px', fontSize: '11px' }}>
                      {offset + i + 1}.
                    </td>
                    <td className="pt-1 pb-0.5">
                      <span className="font-bold text-[var(--color-ink)]">{word.term}</span>
                      <span className="text-[var(--color-ink-muted)] ml-1.5" style={{ fontSize: '11px' }}>— {word.definition}</span>
                    </td>
                  </tr>
                  {Array.from({ length: repeatCount }).map((_, j) => (
                    <tr key={j} style={{ height: lineH }}>
                      <td />
                      <td style={{ borderBottom: '1px solid #E4E4E7' }} />
                    </tr>
                  ))}
                  <tr style={{ height: '6px' }}><td /><td /></tr>
                </tbody>
              ))}
          </table>
        );
      })}
    </div>
  );
}

// ── 체크리스트 ───────────────────────────────────────────────────

function ChecklistTable({ words, cols, fontSize, lineSpacing }: {
  words: Word[]; cols: number; fontSize: string; lineSpacing: string;
}) {
  const groups = splitIntoColumns(words, cols);
  const fs = FS[fontSize] ?? '14px';
  const rowH = ROW_H[lineSpacing] ?? '28px';

  return (
    <div className="worksheet-section flex gap-6">
      {groups.map((group, gi) => {
        const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
        return (
          <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
            <colgroup>
              <col style={{ width: '22px' }} />
              <col style={{ width: '18px' }} />
              <col style={{ width: '40%' }} />
              <col />
            </colgroup>
            <tbody>
              {group.map((word, i) => (
                <tr key={word.id} style={{ height: rowH, borderBottom: '1px solid #E4E4E7', breakInside: 'avoid' }}>
                  <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-middle" style={{ fontSize: '11px' }}>
                    {offset + i + 1}.
                  </td>
                  <td className="align-middle px-1">
                    <div className="w-3.5 h-3.5 rounded border border-[var(--color-ink)]" />
                  </td>
                  <td className="align-middle font-semibold text-[var(--color-ink)] pr-2">
                    {word.term}
                  </td>
                  <td className="align-middle text-[var(--color-ink-muted)]">
                    {word.definition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}

// ── 객관식 ───────────────────────────────────────────────────────

function MultipleChoiceTable({ words, fontSize, lineSpacing, includeAnswer, questionField }: {
  words: Word[]; fontSize: string; lineSpacing: string; includeAnswer: boolean; questionField: 'definition' | 'term';
}) {
  const fs = FS[fontSize] ?? '14px';
  const rowH = lineSpacing === 'wide' ? '36px' : '28px';

  return (
    <>
      <table className="worksheet-section w-full table-fixed border-collapse" style={{ fontSize: fs }}>
        <colgroup>
          <col style={{ width: '30px' }} />
          <col />
        </colgroup>
        {words.map((word, i) => {
          const others = shuffleArray(words.filter(w => w.id !== word.id)).slice(0, 3);
          const choices = shuffleArray([word, ...others]);
          return (
            <tbody key={word.id} style={{ breakInside: 'avoid' }}>
              <tr style={{ height: rowH, borderTop: i > 0 ? '1px solid #E4E4E7' : undefined }}>
                <td className="text-right pr-2 text-[var(--color-ink-faint)] align-top pt-1.5" style={{ fontSize: '11px' }}>
                  {i + 1}.
                </td>
                <td className="align-top pt-1.5 pr-4 font-semibold text-[var(--color-ink)] leading-snug break-words">
                  {getQuestionText(word, questionField)}
                </td>
              </tr>
              <tr style={{ height: rowH }}>
                <td />
                <td className="pb-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 justify-items-start">
                    {choices.map((c, j) => (
                      <span key={c.id} className="flex min-w-0 items-start text-left text-[var(--color-ink-secondary)] leading-snug break-words">
                        <span className="text-[var(--color-ink-faint)] mr-1">{String.fromCharCode(9312 + j)}</span>
                        <span className="min-w-0 break-words">{getAnswerText(c, questionField)}</span>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          );
        })}
      </table>
      {includeAnswer && <AnswerKeyTable words={words} cols={5} fontSize={fontSize} answerField={questionField === 'definition' ? 'term' : 'definition'} />}
    </>
  );
}

// ── 정답 키 ─────────────────────────────────────────────────────

// ── 영작 연습 ────────────────────────────────────────────────────

function TranslationTable({ words, cols, fontSize, lineSpacing, includeAnswer }: {
  words: Word[]; cols: number; fontSize: string; lineSpacing: string; includeAnswer: boolean;
}) {
  const groups = splitIntoColumns(words, cols);
  const fs = FS[fontSize] ?? '14px';
  const rowH = lineSpacing === 'wide' ? '44px' : '32px';

  return (
    <>
      <div className="worksheet-section flex gap-6">
        {groups.map((group, gi) => {
          const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
          return (
            <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
              <colgroup>
                <col style={{ width: '24px' }} />
                <col style={{ width: '44%' }} />
                <col />
              </colgroup>
              <tbody>
                {group.map((word, i) => (
                  <tr key={word.id} style={{ height: rowH, breakInside: 'avoid' }}>
                    <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-middle" style={{ fontSize: '11px' }}>
                      {offset + i + 1}.
                    </td>
                    <td className="align-middle pr-3 text-[var(--color-ink-secondary)]">
                      {word.definition}
                    </td>
                    <td className="align-bottom" style={{ borderBottom: '1.5px solid #18181B' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
      {includeAnswer && (
        <div className="worksheet-section mt-8 pt-5 border-t-2 border-dashed border-[var(--color-hairline)]">
          <p className="font-bold text-[var(--color-ink-muted)] mb-2" style={{ fontSize: '12px' }}>[ 정답 ]</p>
          <div className="worksheet-section flex gap-6">
            {groups.map((group, gi) => {
              const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
              const answerFs = Math.max(11, parseInt(fs) - 2) + 'px';
              return (
                <table key={gi} className="flex-1 border-collapse" style={{ fontSize: answerFs }}>
                  <colgroup><col style={{ width: '22px' }} /><col /></colgroup>
                  <tbody>
                    {group.map((word, i) => (
                      <tr key={word.id}>
                        <td className="text-right pr-1.5 text-[var(--color-ink-faint)]">{offset + i + 1}.</td>
                        <td className="font-semibold text-[var(--color-ink-secondary)] pl-0.5">{word.term}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function AnswerKeyTable({ words, cols, fontSize, answerField = 'term' }: {
  words: Word[]; cols: number; fontSize: string; answerField?: 'term' | 'definition';
}) {
  const groups = splitIntoColumns(words, cols);
  const fs = FS[fontSize] ?? '14px';
  const answerFs = Math.max(11, parseInt(fs) - 2) + 'px';

  return (
    <div className="worksheet-section mt-8 pt-5 border-t-2 border-dashed border-[var(--color-hairline)]">
      <p className="font-bold text-[var(--color-ink-muted)] mb-2" style={{ fontSize: '12px' }}>[ 정답 ]</p>
      <div className="worksheet-section flex gap-6">
        {groups.map((group, gi) => {
          const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
          return (
            <table key={gi} className="flex-1 border-collapse" style={{ fontSize: answerFs }}>
              <colgroup>
                <col style={{ width: '22px' }} />
                <col />
              </colgroup>
              <tbody>
                {group.map((word, i) => (
                  <tr key={word.id}>
                    <td className="text-right pr-1.5 text-[var(--color-ink-faint)]">{offset + i + 1}.</td>
                    <td className="font-semibold text-[var(--color-ink-secondary)] pl-0.5 leading-snug break-words">{word[answerField]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
    </div>
  );
}

// ── 편집 모드 (DnD + contenteditable) ──────────────────────────

function EditableSheet({ words, config, fontSize, lineSpacing, onDragEnd, onUpdateWord, sensors }: {
  words: Word[];
  config: WorksheetConfig;
  fontSize: string;
  lineSpacing: string;
  onDragEnd: (e: DragEndEvent) => void;
  onUpdateWord: (id: string, field: 'term' | 'definition', value: string) => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const fs = FS[fontSize] ?? '14px';
  const rowH = ROW_H[lineSpacing] ?? '28px';
  const editCell = 'outline-none focus:bg-[var(--color-primary-subtle)] rounded px-0.5';

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={words.map(w => w.id)} strategy={verticalListSortingStrategy}>
        <table className="w-full border-collapse" style={{ fontSize: fs }}>
          <colgroup>
            <col style={{ width: '28px' }} />
            {config.type === 'fill-blank' && <><col style={{ width: '44%' }} /><col /></>}
            {config.type === 'write-repeat' && <><col style={{ width: '55%' }} /><col /></>}
            {config.type === 'checklist' && <><col style={{ width: '20px' }} /><col style={{ width: '38%' }} /><col /></>}
            {config.type === 'multiple-choice' && <col />}
          </colgroup>
          <tbody>
            {words.map((word, i) => (
              <SortableItem key={word.id} id={word.id} editMode>
                <EditableTableRow
                  word={word}
                  index={i}
                  config={config}
                  rowH={rowH}
                  editCell={editCell}
                  onUpdate={onUpdateWord}
                  lineSpacing={lineSpacing}
                />
              </SortableItem>
            ))}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
}

function EditableTableRow({ word, index, config, rowH, editCell, onUpdate, lineSpacing }: {
  word: Word; index: number; config: WorksheetConfig; rowH: string; editCell: string;
  onUpdate: (id: string, field: 'term' | 'definition', value: string) => void;
  lineSpacing: string;
}) {
  if (config.type === 'fill-blank') {
    const questionField = config.questionField ?? 'definition';
    return (
      <tr style={{ height: rowH, borderBottom: '1px solid #E4E4E7' }}>
        <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-top pt-1 text-[11px]">{index + 1}.</td>
        <td className="align-top pt-1 pb-1 pr-2 text-[var(--color-ink-secondary)] leading-snug break-words">
          <span
            contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate(word.id, questionField, e.currentTarget.textContent ?? '')}
            className={editCell}
          >{word[questionField]}</span>
        </td>
        <td className="align-bottom" style={{ borderBottom: '1.5px solid #18181B' }} />
      </tr>
    );
  }

  if (config.type === 'write-repeat') {
    const lineH = lineSpacing === 'wide' ? '36px' : '26px';
    return (
      <>
        <tr key={`${word.id}-h`}>
          <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-top pt-1 text-[11px]">{index + 1}.</td>
          <td className="pt-1 pb-0.5" colSpan={2}>
            <span
              contentEditable suppressContentEditableWarning
              onBlur={e => onUpdate(word.id, 'term', e.currentTarget.textContent ?? '')}
              className={cn(editCell, 'font-bold text-[var(--color-ink)]')}
            >{word.term}</span>
            <span className="ml-1.5 text-[var(--color-ink-muted)] text-[11px]">— </span>
            <span
              contentEditable suppressContentEditableWarning
              onBlur={e => onUpdate(word.id, 'definition', e.currentTarget.textContent ?? '')}
              className={cn(editCell, 'text-[var(--color-ink-muted)] text-[11px]')}
            >{word.definition}</span>
          </td>
        </tr>
        {Array.from({ length: config.repeatCount ?? 3 }).map((_, j) => (
          <tr key={`${word.id}-l${j}`} style={{ height: lineH }}>
            <td /><td colSpan={2} style={{ borderBottom: '1px solid #E4E4E7' }} />
          </tr>
        ))}
        <tr key={`${word.id}-gap`} style={{ height: '6px' }}><td /><td colSpan={2} /></tr>
      </>
    );
  }

  if (config.type === 'checklist') {
    return (
      <tr style={{ height: rowH, borderBottom: '1px solid #E4E4E7' }}>
        <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-middle text-[11px]">{index + 1}.</td>
        <td className="align-middle px-1"><div className="w-3.5 h-3.5 rounded border border-[var(--color-ink)]" /></td>
        <td className="align-middle pr-2">
          <span
            contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate(word.id, 'term', e.currentTarget.textContent ?? '')}
            className={cn(editCell, 'font-semibold text-[var(--color-ink)]')}
          >{word.term}</span>
        </td>
        <td className="align-middle text-[var(--color-ink-muted)]">
          <span
            contentEditable suppressContentEditableWarning
            onBlur={e => onUpdate(word.id, 'definition', e.currentTarget.textContent ?? '')}
            className={editCell}
          >{word.definition}</span>
        </td>
      </tr>
    );
  }

  // multiple-choice (편집에서는 term/definition만 수정, 보기는 자동 생성이므로 단순 표시)
  return (
    <tr style={{ height: rowH, borderBottom: '1px solid #E4E4E7' }}>
      <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-middle text-[11px]">{index + 1}.</td>
      <td className="align-middle pr-2 font-semibold text-[var(--color-ink)]">
        <span
          contentEditable suppressContentEditableWarning
          onBlur={e => onUpdate(word.id, 'term', e.currentTarget.textContent ?? '')}
          className={editCell}
        >{word.term}</span>
      </td>
      <td className="align-middle text-[var(--color-ink-muted)]">
        <span
          contentEditable suppressContentEditableWarning
          onBlur={e => onUpdate(word.id, 'definition', e.currentTarget.textContent ?? '')}
          className={editCell}
        >{word.definition}</span>
      </td>
    </tr>
  );
}
