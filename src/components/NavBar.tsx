import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, BarChart2 } from 'lucide-react';
import { Button } from './ui/Button';

export function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-[12px] border-b border-[var(--color-hairline)] h-14 flex items-center px-4 no-print">
      <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-[18px] text-[var(--color-primary)] tracking-tight">
          <BookOpen size={22} />
          DANZZAK
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/records')}
            aria-label="학습 기록"
            className="p-2 rounded-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)] transition-colors"
          >
            <BarChart2 size={18} />
          </button>
          <Button size="sm" onClick={() => navigate('/input')}>
            <Plus size={15} />
            새 단어장
          </Button>
        </div>
      </div>
    </nav>
  );
}
