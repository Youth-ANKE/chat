import { useMemo } from 'react';

interface TechBackgroundProps {
  count?: number;
  dark?: boolean;
}

export function TechBackground({ count = 20, dark = true }: TechBackgroundProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${1 + Math.random() * 2}px`,
    }));
  }, [count]);

  if (!dark) return null;

  return (
    <div className="tech-particles" aria-hidden="true">
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
