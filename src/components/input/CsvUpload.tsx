import { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseCsv } from '../../utils/csvParser';
import type { Word } from '../../types/word';

interface CsvUploadProps {
  onParsed: (words: Word[]) => void;
  onError: (msg: string) => void;
}

export function CsvUpload({ onParsed, onError }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(csv|tsv|txt|xlsx?)$/i) && file.type !== 'text/plain') {
      onError('CSV, TSV, TXT 파일만 지원해요.');
      return;
    }
    const text = await file.text();
    const words = parseCsv(text);
    if (words.length === 0) {
      onError('단어를 인식하지 못했어요. "단어,뜻" 또는 "단어\\t뜻" 형식인지 확인해주세요.');
      return;
    }
    onParsed(words);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[var(--color-hairline)] rounded-[14px] cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all"
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="CSV 파일 업로드"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center text-[var(--color-primary)]">
          <FileSpreadsheet size={22} />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-[var(--color-ink)]">CSV / TSV 파일 업로드</p>
          <p className="text-[13px] text-[var(--color-ink-muted)] mt-1">클릭하거나 파일을 드래그하세요</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-faint)]">
          <Upload size={12} />
          .csv · .tsv · .txt 지원
        </div>
      </div>
      <p className="text-[12px] text-[var(--color-ink-muted)] mt-3 text-center">
        형식: <code className="bg-[var(--color-canvas)] px-1.5 py-0.5 rounded text-[var(--color-ink)]">단어,뜻</code> 또는 탭으로 구분된 파일
      </p>
    </div>
  );
}
