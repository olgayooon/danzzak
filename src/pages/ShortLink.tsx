import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { ThemePreset } from '../types/word';
import type { GameMode } from '../types/game';

interface ShareData {
  title: string;
  emoji: string;
  theme: ThemePreset;
  words: { term: string; definition: string }[];
  gameMode?: GameMode;
  questionType?: 'term' | 'definition' | 'mixed';
}

export default function ShortLink() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) { setError('잘못된 링크예요.'); return; }

    fetch(`/api/share?code=${encodeURIComponent(code)}`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { message?: string };
          setError(data.message ?? '링크가 만료됐거나 존재하지 않아요.');
          return;
        }
        const data = await res.json() as ShareData;

        if (data.gameMode) {
          navigate('/shared/game', { replace: true, state: { data, code } });
        } else {
          navigate('/shared/set', { replace: true, state: { data } });
        }
      })
      .catch(() => setError('네트워크 오류가 발생했어요.'));
  }, [code, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle size={40} className="text-[var(--color-danger)]" />
        <p className="text-[16px] font-semibold text-[var(--color-ink)]">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
    </div>
  );
}
