"use client";

import { useRef } from "react";
import { useMouse } from "@/hooks/useMouse";

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.05)",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-2xl bg-black border border-white/10 ${className}`}
    >
      <div className="absolute inset-0 z-0 bg-transparent transition-colors duration-300 group-hover:bg-transparent pointer-events-none" />
      <Spotlight cardRef={cardRef} spotlightColor={spotlightColor} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Spotlight({
  cardRef,
  spotlightColor,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  spotlightColor: string;
}) {
  const mouse = useMouse();

  if (!cardRef.current) return null;

  const rect = cardRef.current.getBoundingClientRect();
  const x = mouse.x - rect.left;
  const y = mouse.x === 0 && mouse.y === 0 ? 0 : mouse.y - rect.top;

  return (
    <div
      className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
      style={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`,
      }}
    />
  );
}
