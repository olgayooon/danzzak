import { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';

const DISMISSED_KEY = 'danzzak_install_dismissed';

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as Record<string, unknown>).standalone === true;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    if (isStandalone) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!isIOS && !isAndroid) return;

    // Android: deferredPrompt가 있으면 즉시, 없으면 잠시 후 재확인
    const check = () => {
      const prompt = (window as unknown as Record<string, unknown>).deferredPrompt;
      if (prompt) setHasPrompt(true);
    };
    check();
    const timer = setTimeout(check, 1500);

    setVisible(true);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  async function handleInstall() {
    const prompt = (window as unknown as Record<string, unknown>).deferredPrompt as
      | { prompt: () => void; userChoice: Promise<unknown> }
      | undefined;
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    (window as unknown as Record<string, unknown>).deferredPrompt = null;
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-hairline)] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] no-print">
      <div className="max-w-[600px] mx-auto flex items-start gap-3">
        <div className="text-2xl leading-none mt-0.5">📱</div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[var(--color-ink)] mb-0.5">
            홈화면에 추가하면 앱처럼 써요!
          </p>
          {isIOS ? (
            <p className="text-[12px] text-[var(--color-ink-muted)] leading-relaxed">
              Safari 하단{' '}
              <Share size={12} className="inline relative -top-[1px]" />{' '}
              공유 버튼 →{' '}
              <span className="font-semibold text-[var(--color-ink)]">홈 화면에 추가</span>{' '}
              탭하세요
            </p>
          ) : hasPrompt ? (
            <button
              onClick={handleInstall}
              className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--color-primary)] text-white text-[12px] font-bold"
            >
              <Download size={13} /> 지금 설치하기
            </button>
          ) : (
            <p className="text-[12px] text-[var(--color-ink-muted)]">
              브라우저 메뉴 → <span className="font-semibold text-[var(--color-ink)]">홈 화면에 추가</span>
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="배너 닫기"
          className="p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
