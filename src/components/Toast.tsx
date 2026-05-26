import { useState, useEffect, useCallback } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'info' | 'error';
}

let addToastFn: ((text: string, type: 'info' | 'error') => void) | null = null;

export function showToast(text: string, type: 'info' | 'error' = 'info') {
  addToastFn?.(text, type);
}

let nextId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'info' | 'error') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 400, width: 'calc(100% - 32px)',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px', borderRadius: 8,
          background: t.type === 'error' ? '#c0392b' : '#2c3e50',
          color: '#fff', fontSize: 13, lineHeight: 1.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          animation: 'toast-in 0.2s ease-out',
        }}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
