"use client";

import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width: number;
    let height: number;
    let cx: number;
    let cy: number;

    const noise3D = createNoise3D();

    let particles: any[] = [];
    let tick = 0;

    // Configurable parameters for the "Vortex"
    const particleCount = 700;
    const baseSpeed = 0.05;
    const rangeSpeed = 0.15;
    const baseRadius = 1;
    const rangeRadius = 2;
    const baseHue = 220; // Blue/Zinc scheme
    const rangeHue = 20;

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      cx = width / 2;
      cy = height / 2;
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(resetParticle({} as any));
      }
    }

    function resetParticle(p: any) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.vx = 0;
      p.vy = 0;
      p.radius = baseRadius + Math.random() * rangeRadius;
      p.speed = baseSpeed + Math.random() * rangeSpeed;
      p.hue = Math.floor(Math.random() * rangeHue) + baseHue;
      p.life = Math.random() * 200 + 50;
      p.tick = 0;
      return p;
    }

    function draw() {
      if (!ctx) return;

      // Dark fade for trail effect (slightly higher alpha for softer trails)
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.tick++;

        // Noise flow field logic
        // x and y scaled down to make the swirls larger
        const n = noise3D(p.x * 0.0015, p.y * 0.0015, tick * 0.0003);
        
        // Convert noise value (-1 to 1) to an angle
        const angle = n * Math.PI * 4;

        // Swirl offset towards the center to create a vortex
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Combine flow field angle with a pull towards the center
        const vortexAngle = Math.atan2(dy, dx) + Math.PI / 2; 
        const pull = Math.max(0, 1 - dist / (width / 1.5));

        // Update velocity
        p.vx += Math.cos(angle) * 0.2 + Math.cos(vortexAngle) * pull * 0.2;
        p.vy += Math.sin(angle) * 0.2 + Math.sin(vortexAngle) * pull * 0.2;

        // Apply friction
        p.vx *= 0.95;
        p.vy *= 0.95;

        // Update position
        p.x += p.vx * p.speed;
        p.y += p.vy * p.speed;

        // Reset if it goes out of bounds or life ends
        if (
          p.x < 0 ||
          p.x > width ||
          p.y < 0 ||
          p.y > height ||
          p.tick > p.life
        ) {
          resetParticle(p);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        // Subtle glow using pure white to zinc tones for Eve's color scheme
        const opacity = Math.sin((p.tick / p.life) * Math.PI);
        // Monochromatic / grayish-blue to match Eve theme
        ctx.fillStyle = `hsla(${p.hue}, 20%, 80%, ${opacity * 0.8})`;
        ctx.fill();
        ctx.closePath();
      }

      tick++;
      requestAnimationFrame(draw);
    }

    // Initialize
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ opacity: 0.8 }}
      />
      {/* Vignette mask to fade the edges to black like a premium UI */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_20%,#000_100%)]"></div>
    </div>
  );
}
