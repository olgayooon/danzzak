import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, BarChart2, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettingsStore, type ThemeMode } from '../store/settingsStore';

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark'];

const THEME_ICON: Record<ThemeMode, React.ReactNode> = {
  light: <Sun size={18} />,
  dark: <Moon size={18} />,
  system: <Monitor size={18} />,
};

const THEME_LABEL: Record<ThemeMode, string> = {
  light: '라이트 모드',
  dark: '다크 모드',
  system: '시스템 설정',
};

export function NavBar() {
  const navigate = useNavigate();
  const theme = useSettingsStore(s => s.theme);
  const setTheme = useSettingsStore(s => s.setTheme);

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  }

  return (
    <nav className="sticky top-0 z-40 bg-[var(--color-surface)]/80 backdrop-blur-[12px] border-b border-[var(--color-hairline)] h-14 flex items-center px-4 no-print">
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
          <button
            onClick={cycleTheme}
            aria-label={THEME_LABEL[theme]}
            title={THEME_LABEL[theme]}
            className="p-2 rounded-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)] transition-colors"
          >
            {THEME_ICON[theme]}
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
