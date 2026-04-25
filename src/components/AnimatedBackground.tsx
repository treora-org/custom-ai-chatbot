"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width: number;
    let height: number;
    let animId: number;

    // 3D Sphere Hologram Data
    const numPoints = 800;
    let sphereRadius = 300; 
    const points: { x: number; y: number; z: number }[] = [];

    // Fibonacci sphere distribution for perfectly even points on the globe
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; 
      const radiusAtY = Math.sqrt(1 - y * y); 
      const theta = phi * i; 

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Store normalized coordinates (we will multiply by radius in the draw loop so it resizes well)
      points.push({ x, y, z });
    }

    let rotationX = 0;
    let rotationY = 0;

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Adjust sphere size based on screen width for mobile responsiveness
      sphereRadius = Math.min(width, height) * 0.4;
    }

    function draw() {
      if (!ctx) return;

      // Clear background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Smooth rotation
      rotationX += 0.001;
      rotationY += 0.002;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // --- Draw Sci-Fi HUD Rings ---
      ctx.lineWidth = 1;
      
      // Inner solid ring
      ctx.strokeStyle = "rgba(150, 150, 150, 0.15)";
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, sphereRadius + 20, (sphereRadius + 20) * 0.3, rotationY, 0, Math.PI * 2);
      ctx.stroke();

      // Outer dashed spinning ring
      ctx.strokeStyle = "rgba(200, 200, 200, 0.25)";
      ctx.beginPath();
      ctx.setLineDash([10, 20, 5, 15]);
      ctx.ellipse(centerX, centerY, sphereRadius + 50, (sphereRadius + 50) * 0.3, -rotationX * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // --- Draw 3D Sphere Points ---
      for (let i = 0; i < numPoints; i++) {
        const p = points[i];
        
        // Scale normalized points
        const px = p.x * sphereRadius;
        const py = p.y * sphereRadius;
        const pz = p.z * sphereRadius;

        // 3D Rotation Math
        const y1 = py * cosX - pz * sinX;
        const z1 = py * sinX + pz * cosX;
        const x2 = px * cosY + z1 * sinY;
        const z2 = -px * sinY + z1 * cosY;
        const y2 = y1;

        // Perspective Projection
        const distance = 1000; 
        const zPerspective = distance / (distance - z2);
        const xProjected = centerX + x2 * zPerspective;
        const yProjected = centerY + y2 * zPerspective;

        if (zPerspective < 0) continue; // Behind camera

        // Depth fading (back of the sphere is darker and smaller)
        // z2 ranges from -sphereRadius (front) to +sphereRadius (back)
        const depthRatio = (z2 + sphereRadius) / (sphereRadius * 2); 
        
        // Holographic styling
        const opacity = Math.max(0.05, 1 - depthRatio * 0.95);
        const radius = Math.max(0.5, (1 - depthRatio) * 2.5);

        ctx.fillStyle = `rgba(230, 230, 230, ${opacity})`;
        ctx.beginPath();
        ctx.arc(xProjected, yProjected, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines occasionally to form a "wireframe" network
        if (i % 20 === 0) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(xProjected, yProjected);
            ctx.strokeStyle = `rgba(100, 100, 100, ${opacity * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
      }

      // --- Subtle Scanline Overlay ---
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
      }

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="block w-full h-full mix-blend-screen opacity-60"
      />
      {/* Heavy vignette to keep focus on the center UI and give depth */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_30%,#000_100%)]"></div>
    </div>
  );
}
