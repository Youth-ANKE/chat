import { useMemo } from 'react';

interface TechBackgroundProps {
  count?: number;
  dark?: boolean;
}

export function TechBackground({ count = 40, dark = true }: TechBackgroundProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${1 + Math.random() * 2.5}px`,
    }));
  }, [count]);

  return (
    <div className="tech-particles" aria-hidden="true">
      {/* Rich ambient glow blobs — the colorful canvas behind glass blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        {dark ? (
          <>
            {/* ─── Dark mode blobs ─── */}
            <div
              className="absolute -top-[25%] -left-[15%] w-[55%] h-[55%] rounded-full"
              style={{ background: 'radial-gradient(circle at 40% 40%, rgba(0,160,255,0.35) 0%, rgba(20,80,200,0.20) 25%, transparent 65%)' }}
            />
            <div
              className="absolute top-[5%] -right-[20%] w-[50%] h-[50%] rounded-full"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(160,80,240,0.32) 0%, rgba(120,50,200,0.15) 30%, transparent 65%)' }}
            />
            <div
              className="absolute top-[35%] left-[25%] w-[50%] h-[45%] rounded-full"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(40,120,220,0.18) 0%, transparent 60%)' }}
            />
            <div
              className="absolute -bottom-[15%] right-[10%] w-[45%] h-[40%] rounded-full"
              style={{ background: 'radial-gradient(circle at 60% 40%, rgba(100,160,220,0.22) 0%, rgba(60,120,200,0.10) 35%, transparent 65%)' }}
            />
            <div
              className="absolute -bottom-[25%] -left-[10%] w-[50%] h-[45%] rounded-full"
              style={{ background: 'radial-gradient(circle at 40% 40%, rgba(140,60,220,0.20) 0%, transparent 65%)' }}
            />
            <div
              className="absolute top-[45%] right-[0%] w-[35%] h-[35%] rounded-full"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(80,140,220,0.16) 0%, transparent 60%)' }}
            />
          </>
        ) : (
          <>
            {/* ─── Light mode blobs — soft pastels ─── */}
            <div
              className="absolute -top-[25%] -left-[15%] w-[55%] h-[55%] rounded-full"
              style={{ background: 'radial-gradient(circle at 40% 40%, rgba(120,160,240,0.20) 0%, rgba(100,140,220,0.10) 25%, transparent 65%)' }}
            />
            <div
              className="absolute top-[5%] -right-[20%] w-[50%] h-[50%] rounded-full"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(180,140,240,0.18) 0%, rgba(160,120,220,0.08) 30%, transparent 65%)' }}
            />
            <div
              className="absolute top-[35%] left-[25%] w-[50%] h-[45%] rounded-full"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(100,160,230,0.12) 0%, transparent 60%)' }}
            />
            <div
              className="absolute -bottom-[15%] right-[10%] w-[45%] h-[40%] rounded-full"
              style={{ background: 'radial-gradient(circle at 60% 40%, rgba(140,190,240,0.14) 0%, rgba(100,150,220,0.06) 35%, transparent 65%)' }}
            />
            <div
              className="absolute -bottom-[25%] -left-[10%] w-[50%] h-[45%] rounded-full"
              style={{ background: 'radial-gradient(circle at 40% 40%, rgba(160,120,230,0.12) 0%, transparent 65%)' }}
            />
            <div
              className="absolute top-[45%] right-[0%] w-[35%] h-[35%] rounded-full"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(120,170,230,0.10) 0%, transparent 60%)' }}
            />
          </>
        )}
      </div>
      {particles.map((p) => (
        <div
          key={p.id}
          className="tech-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}
