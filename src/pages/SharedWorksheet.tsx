import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, Home, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { decodeSharePayload } from '../utils/shareWorksheet';
import type { WorksheetConfig } from '../types/worksheet';
import type { Word } from '../types/word';
import { shuffleArray } from '../utils/gameUtils';

const FS: Record<string, string> = { sm: '12px', md: '14px', lg: '16px' };
const ROW_H: Record<string, string> = { normal: '28px', wide: '40px' };

function getQuestionText(word: Word, questionField: 'definition' | 'term') {
  return questionField === 'definition' ? word.definition : word.term;
}

function getAnswerText(word: Word, questionField: 'definition' | 'term') {
  return questionField === 'definition' ? word.term : word.definition;
}

function splitIntoColumns(words: Word[], cols: number): Word[][] {
  const safeCols = cols === 4 ? 3 : cols;
  const perCol = Math.ceil(words.length / safeCols);
  return Array.from({ length: safeCols }, (_, i) =>
    words.slice(i * perCol, (i + 1) * perCol)
  ).filter(g => g.length > 0);
}

export default function SharedWorksheet() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<{ config: WorksheetConfig; words: Word[]; setTitle: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (!hash) { setError(true); return; }
    const payload = decodeSharePayload(hash);
    if (!payload) { setError(true); return; }
    setData(payload);
  }, [location.hash]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <AlertCircle size={40} className="text-[var(--color-danger)]" />
        <p className="text-[16px] font-semibold text-[var(--color-ink)]">시험지 링크가 올바르지 않아요.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  if (!data) return null;

  const { config, setTitle } = data;
  const cols = config.type === 'multiple-choice' ? 1 : config.columns;
  const words = config.scramble ? shuffleArray(data.words) : data.words;
  const fs = FS[config.fontSize] ?? '14px';
  const rowH = ROW_H[config.lineSpacing] ?? '28px';

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 no-print">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
          <Home size={16} /> 홈
        </button>
        <Button onClick={() => window.print()}>
          <Printer size={16} /> 인쇄하기
        </Button>
      </div>

      <div className="worksheet-container bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-hairline)] p-8 shadow-[0_2px_8px_rgba(124,58,237,0.08)]" style={{ minHeight: '842px' }}>
        <div className="worksheet-header border-b-2 border-[var(--color-ink)] pb-3 mb-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[20px] font-extrabold text-[var(--color-ink)]">{config.title || '시험지'}</h2>
            <div className="flex gap-5 text-[13px] text-[var(--color-ink-secondary)] shrink-0">
              <span>이름:&nbsp;<span className="inline-block border-b border-[var(--color-ink)] w-24 align-bottom" /></span>
              <span>날짜:&nbsp;<span className="inline-block border-b border-[var(--color-ink)] w-20 align-bottom" /></span>
              <span>점수:&nbsp;<span className="inline-block border-b border-[var(--color-ink)] w-14 align-bottom" /> 점</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-1.5">{setTitle} · {words.length}문항</p>
        </div>

        {config.type === 'fill-blank' && <FillBlankTable words={words} cols={cols} fs={fs} rowH={rowH} includeAnswer={config.includeAnswer} questionField={config.questionField ?? 'definition'} />}
        {config.type === 'write-repeat' && <WriteRepeatTable words={words} cols={cols} fs={fs} lineSpacing={config.lineSpacing} repeatCount={config.repeatCount ?? 3} />}
        {config.type === 'checklist' && <ChecklistTable words={words} cols={cols} fs={fs} rowH={rowH} />}
        {config.type === 'multiple-choice' && <MultipleChoiceTable words={words} fs={fs} lineSpacing={config.lineSpacing} includeAnswer={config.includeAnswer} questionField={config.questionField ?? 'definition'} />}
      </div>
    </div>
  );
}

function FillBlankTable({ words, cols, fs, rowH, includeAnswer, questionField }: {
  words: Word[]; cols: number; fs: string; rowH: string; includeAnswer: boolean; questionField: 'definition' | 'term';
}) {
  const groups = splitIntoColumns(words, cols);
  return (
    <>
      <div className="worksheet-section flex gap-6">
        {groups.map((group, gi) => {
          const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
          return (
            <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
              <colgroup><col style={{ width: '24px' }} /><col style={{ width: '45%' }} /><col /></colgroup>
              <tbody>
                {group.map((word, i) => (
                  <tr key={word.id} style={{ minHeight: rowH }}>
                    <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-top pt-1 whitespace-nowrap">{offset + i + 1}.</td>
                    <td className="align-top pt-1 pb-1 pr-2 text-[var(--color-ink-secondary)] leading-snug break-words">{getQuestionText(word, questionField)}</td>
                    <td className="align-bottom" style={{ borderBottom: '1.5px solid #18181B' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
      {includeAnswer && <AnswerKeyTable words={words} cols={cols} fs={fs} answerField={questionField === 'definition' ? 'term' : 'definition'} />}
    </>
  );
}

function WriteRepeatTable({ words, cols, fs, lineSpacing, repeatCount }: {
  words: Word[]; cols: number; fs: string; lineSpacing: string; repeatCount: number;
}) {
  const groups = splitIntoColumns(words, cols);
  const lineH = lineSpacing === 'wide' ? '36px' : '26px';
  return (
    <div className="worksheet-section flex gap-8">
      {groups.map((group, gi) => {
        const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
        return (
          <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
            <tbody>
              {group.map((word, i) => (
                <>
                  <tr key={`${word.id}-l`}>
                    <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-top pt-1" style={{ width: '22px', fontSize: '11px' }}>{offset + i + 1}.</td>
                    <td className="pt-1 pb-0.5">
                      <span className="font-bold text-[var(--color-ink)]">{word.term}</span>
                      <span className="text-[var(--color-ink-muted)] ml-1.5" style={{ fontSize: '11px' }}>— {word.definition}</span>
                    </td>
                  </tr>
                  {Array.from({ length: repeatCount }).map((_, j) => (
                    <tr key={`${word.id}-${j}`} style={{ height: lineH }}>
                      <td /><td style={{ borderBottom: '1px solid #E4E4E7' }} />
                    </tr>
                  ))}
                  <tr style={{ height: '6px' }}><td /><td /></tr>
                </>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}

function ChecklistTable({ words, cols, fs, rowH }: {
  words: Word[]; cols: number; fs: string; rowH: string;
}) {
  const groups = splitIntoColumns(words, cols);
  return (
    <div className="worksheet-section flex gap-6">
      {groups.map((group, gi) => {
        const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
        return (
          <table key={gi} className="flex-1 border-collapse" style={{ fontSize: fs }}>
            <colgroup><col style={{ width: '22px' }} /><col style={{ width: '18px' }} /><col style={{ width: '40%' }} /><col /></colgroup>
            <tbody>
              {group.map((word, i) => (
                <tr key={word.id} style={{ height: rowH, borderBottom: '1px solid #E4E4E7' }}>
                  <td className="text-right pr-1.5 text-[var(--color-ink-faint)] align-middle" style={{ fontSize: '11px' }}>{offset + i + 1}.</td>
                  <td className="align-middle px-1"><div className="w-3.5 h-3.5 rounded border border-[var(--color-ink)]" /></td>
                  <td className="align-middle font-semibold text-[var(--color-ink)] pr-2">{word.term}</td>
                  <td className="align-middle text-[var(--color-ink-muted)]">{word.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}

function MultipleChoiceTable({ words, fs, lineSpacing, includeAnswer, questionField }: {
  words: Word[]; fs: string; lineSpacing: string; includeAnswer: boolean; questionField: 'definition' | 'term';
}) {
  const rowH = lineSpacing === 'wide' ? '36px' : '28px';
  return (
    <>
      <table className="worksheet-section w-full table-fixed border-collapse" style={{ fontSize: fs }}>
        <colgroup><col style={{ width: '30px' }} /><col /></colgroup>
        <tbody>
          {words.map((word, i) => {
            const choices = shuffleArray([word, ...shuffleArray(words.filter(w => w.id !== word.id)).slice(0, 3)]);
            return (
              <>
                <tr key={`${word.id}-q`} style={{ height: rowH, borderTop: i > 0 ? '1px solid #E4E4E7' : undefined }}>
                  <td className="text-right pr-2 text-[var(--color-ink-faint)] align-top pt-1.5" style={{ fontSize: '11px' }}>{i + 1}.</td>
                  <td className="align-top pt-1.5 pr-4 font-semibold text-[var(--color-ink)] leading-snug break-words">{getQuestionText(word, questionField)}</td>
                </tr>
                <tr key={`${word.id}-c`} style={{ height: rowH }}>
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
              </>
            );
          })}
        </tbody>
      </table>
      {includeAnswer && <AnswerKeyTable words={words} cols={5} fs={fs} answerField={questionField === 'definition' ? 'term' : 'definition'} />}
    </>
  );
}

function AnswerKeyTable({ words, cols, fs, answerField = 'term' }: {
  words: Word[]; cols: number; fs: string; answerField?: 'term' | 'definition';
}) {
  const groups = splitIntoColumns(words, cols);
  const answerFs = Math.max(11, parseInt(fs) - 2) + 'px';
  return (
    <div className="worksheet-section mt-8 pt-5 border-t-2 border-dashed border-[var(--color-hairline)]">
      <p className="font-bold text-[var(--color-ink-muted)] mb-2" style={{ fontSize: '12px' }}>[ 정답 ]</p>
      <div className="worksheet-section flex gap-6">
        {groups.map((group, gi) => {
          const offset = groups.slice(0, gi).reduce((s, g) => s + g.length, 0);
          return (
            <table key={gi} className="flex-1 border-collapse" style={{ fontSize: answerFs }}>
              <colgroup><col style={{ width: '22px' }} /><col /></colgroup>
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
