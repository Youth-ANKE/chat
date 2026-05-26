import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ScrollNavigatorProps {
  /** Parent container ref to search for the scrollable element within */
  containerRef: React.RefObject<HTMLElement | null>;
  darkMode: boolean;
  messageCount: number;
}

/** Auto-find the actual scrollable container inside the parent */
function findScrollContainer(parent: HTMLElement | null): HTMLElement | null {
  if (!parent) return null;

  // Direct check
  const candidates = parent.querySelectorAll<HTMLElement>('.custom-scrollbar.overflow-y-auto');
  for (const c of candidates) {
    if (c.scrollHeight > c.clientHeight + 1) return c;
  }

  // Fallback: any overflow-y-auto with scrollable content
  const all = parent.querySelectorAll<HTMLElement>('[class*="overflow-y"]');
  for (const el of all) {
    if (el.scrollHeight > el.clientHeight + 1 && el.offsetHeight > 100) return el;
  }

  return null;
}

export function ScrollNavigator({ containerRef, darkMode, messageCount }: ScrollNavigatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollElRef = useRef<HTMLElement | null>(null);

  // Resolve and cache the scrollable element
  useEffect(() => {
    const el = findScrollContainer(containerRef.current);
    if (el) {
      scrollElRef.current = el;
      setScrollProgress(() => {
        const max = el.scrollHeight - el.clientHeight;
        return max > 0 ? el.scrollTop / max : 0;
      });
    }
  }, [containerRef, messageCount]);

  const updateProgress = useCallback(() => {
    const el = scrollElRef.current || findScrollContainer(containerRef.current);
    if (el) scrollElRef.current = el;
    else return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? el.scrollTop / max : 0);
  }, [containerRef]);

  // Attach scroll listener
  useEffect(() => {
    let cleanup: () => void = () => {};

    const attach = () => {
      const el = findScrollContainer(containerRef.current);
      if (!el) return;
      scrollElRef.current = el;
      el.addEventListener('scroll', updateProgress, { passive: true });
      const obs = new ResizeObserver(updateProgress);
      obs.observe(el);

      cleanup = () => {
        el.removeEventListener('scroll', updateProgress);
        obs.disconnect();
      };
    };

    attach();

    // Re-attach periodically in case DOM changes (e.g., switching sessions)
    const interval = setInterval(attach, 1000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [containerRef, messageCount, updateProgress]);

  const scrollTo = useCallback((pct: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollElRef.current || findScrollContainer(containerRef.current);
    if (!el) return;
    el.scrollTo({
      top: pct * (el.scrollHeight - el.clientHeight),
      behavior,
    });
  }, [containerRef]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const track = trackRef.current;
    const el = scrollElRef.current || findScrollContainer(containerRef.current);
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pct = Math.max(0, Math.min(1, y / rect.height));
    scrollTo(pct, 'smooth');
  }, [containerRef, scrollTo]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const track = trackRef.current;
      const el = scrollElRef.current || findScrollContainer(containerRef.current);
      if (!track || !el) return;

      const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      el.scrollTo({
        top: pct * (el.scrollHeight - el.clientHeight),
        behavior: 'instant',
      });
    };

    const onEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, [containerRef]);

  if (messageCount < 3) return null;

  const iconColor = darkMode
    ? 'text-gray-500 hover:text-cyan-400'
    : 'text-gray-400 hover:text-indigo-500';

  const thumbBg = isDragging
    ? (darkMode ? '#818cf8' : '#6366f1')
    : (darkMode ? 'rgba(129,140,248,0.85)' : 'rgba(99,102,241,0.75)');

  return (
    <div
      className="flex flex-col items-center gap-0 select-none z-20"
      style={{ width: 18 }}
    >
      {/* Jump to top */}
      <button
        onClick={() => scrollTo(0)}
        className={`flex items-center justify-center transition-all duration-150 rounded-sm ${iconColor}`}
        style={{ width: 18, height: 22 }}
        title="回到顶部 (Home)"
      >
        <ArrowUp className="w-3 h-3" />
      </button>

      {/* Scroll track with draggable thumb */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative flex-1 cursor-pointer rounded-full mx-auto group"
        style={{
          width: 4,
          minHeight: 40,
          background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = darkMode
            ? 'rgba(255,255,255,0.10)'
            : 'rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = darkMode
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.08)';
        }}
      >
        {/* Thumb */}
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`
            absolute left-1/2 -translate-x-1/2 rounded-full cursor-grab active:cursor-grabbing
            transition-shadow duration-100 ${isDragging ? '' : 'transition-all'}
          `}
          style={{
            width: isDragging ? 5 : 4,
            height: `max(${Math.max(scrollProgress * 100, 4)}%, ${isDragging ? 12 : 8}px)`,
            bottom: `${Math.max((1 - scrollProgress) * 100, 0)}%`,
            background: thumbBg,
            boxShadow: isDragging
              ? `0 0 8px rgba(99,102,241,0.6), 0 0 16px rgba(99,102,241,0.25)`
              : `0 0 3px rgba(99,102,241,0.15)`,
            transformOrigin: 'center',
            transitionProperty: isDragging ? 'none' : 'bottom 0.08s ease-out',
          }}
        >
          {/* Drag grip lines */}
          <div className="absolute inset-x-0 flex flex-col items-center gap-[1px] py-[2px]"
               style={{ opacity: isDragging ? 1 : 0.5 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full rounded-full"
                   style={{
                     height: 1,
                     background: darkMode
                       ? 'rgba(255,255,255,0.35)'
                       : 'rgba(255,255,255,0.55)',
                   }} />
            ))}
          </div>
        </div>
      </div>

      {/* Jump to bottom */}
      <button
        onClick={() => scrollTo(1)}
        className={`flex items-center justify-center transition-all duration-150 rounded-sm ${iconColor}`}
        style={{ width: 18, height: 22 }}
        title="回到最新 (End)"
      >
        <ArrowDown className="w-3 h-3" />
      </button>
    </div>
  );
}
