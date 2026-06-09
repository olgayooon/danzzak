import { useCallback, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useTTS() {
  const { ttsEnabled, ttsRate } = useSettingsStore();
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices();
    }
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const speak = useCallback((text: string, lang = 'en-US') => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;

    // Chrome에서 cancel 없이 바로 speak하면 큐가 쌓임
    window.speechSynthesis.cancel();

    // 짧은 delay 없이 cancel 직후 speak하면 Chrome에서 묵음 발생
    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = ttsRate;

      // 해당 언어 voice 우선 선택
      const voices = voicesRef.current;
      const preferred = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && v.default)
        ?? voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    };

    // Chrome bug: cancel 직후 speak가 묵음이 되는 경우 방어
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      setTimeout(doSpeak, 100);
    } else {
      doSpeak();
    }
  }, [ttsEnabled, ttsRate]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, cancel };
}
