import { useState, useCallback } from 'react';

export function useCopy(timeout = 1200) {
  const [copied, setCopied] = useState('');

  const copy = useCallback((value, key) => {
    const text = String(value ?? '');
    const done = () => { setCopied(key || text); setTimeout(() => setCopied(''), timeout); };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
      done();
    }
  }, [timeout]);

  return { copied, copy };
}