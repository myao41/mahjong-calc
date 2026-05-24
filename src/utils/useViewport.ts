import { useState, useEffect } from 'react';

/**
 * ビューポート幅に応じたフラグを返す。
 * - mobile: 480px 未満（iPhone SE等の小型スマホ）
 * - phablet: 768px 未満（大型スマホ）
 */
export function useViewport(): { width: number; isMobile: boolean; isPhablet: boolean } {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    width,
    isMobile: width < 480,
    isPhablet: width < 768,
  };
}
