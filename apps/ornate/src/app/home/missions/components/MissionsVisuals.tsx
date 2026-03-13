'use client';

import { memo, useEffect, useState, type ComponentType } from 'react';

export const TerminalDataNodes = memo(({ accentColor }: { accentColor: string }) => {
  const [nodes, setNodes] = useState<{ left: string; top: string; opacity: number }[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNodes(Array.from({ length: 8 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        opacity: 0.1 + (Math.random() * 0.2),
      })));
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full animate-[float-node_20s_infinite]"
          style={{
            left: node.left,
            top: node.top,
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
            animationDelay: `${i * -2.5}s`,
            opacity: node.opacity,
          }}
        />
      ))}
    </div>
  );
});
TerminalDataNodes.displayName = 'TerminalDataNodes';

export function MissionsSectionHeader({ icon: Icon, label, count, color, glow }: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
  color: string;
  glow: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 pb-2 md:pb-3 border-b border-white/5">
      <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-sm border ${color} ${glow} bg-current/5`} style={{ borderColor: 'currentColor' }}>
        <Icon className={`w-3 h-3 md:w-4 md:h-4 ${color}`} />
      </div>
      <span className={`text-xs md:text-sm font-black tracking-[0.3em] md:tracking-[0.4em] uppercase ${color}`}>{label}</span>
      <span className="text-[8px] md:text-[9px] font-black tracking-widest text-white border border-gray-800 px-1.5 md:px-2 py-0.5 rounded-sm">{count} DIRECTIVES</span>
    </div>
  );
}
