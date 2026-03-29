import { useEffect, useRef } from 'react';

const ACTORS = [
  { name: 'CentralBank', x: 0.5, y: 0.15, color: '#7C3AED' },
  { name: 'RegulatorX', x: 0.15, y: 0.4, color: '#7C3AED' },
  { name: 'CommBank', x: 0.85, y: 0.4, color: '#00D4AA' },
  { name: 'FintechCo', x: 0.3, y: 0.75, color: '#00D4AA' },
  { name: 'IMF', x: 0.7, y: 0.75, color: '#F59E0B' },
  { name: 'Ministry', x: 0.5, y: 0.55, color: '#F59E0B' },
];

const EDGES = [
  [0, 1], [0, 2], [0, 5], [1, 3], [1, 5],
  [2, 4], [2, 5], [3, 4], [3, 5], [4, 5],
];

export default function SimPreviewCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles on edges
    const initParticles = () => {
      const p = [];
      for (const edge of EDGES) {
        p.push({
          edge,
          t: Math.random(),
          speed: 0.002 + Math.random() * 0.003,
        });
      }
      particlesRef.current = p;
    };
    initParticles();

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, w, h);

      const nodes = ACTORS.map((a) => ({
        ...a,
        px: a.x * w,
        py: a.y * h,
      }));

      // Draw edges
      for (const [i, j] of EDGES) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].px, nodes[i].py);
        ctx.lineTo(nodes[j].px, nodes[j].py);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw travelling particles
      for (const p of particlesRef.current) {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        const [i, j] = p.edge;
        const px = nodes[i].px + (nodes[j].px - nodes[i].px) * p.t;
        const py = nodes[i].py + (nodes[j].py - nodes[i].py) * p.t;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = nodes[i].color + 'AA';
        ctx.fill();

        // Particle glow
        const grd = ctx.createRadialGradient(px, py, 1, px, py, 8);
        grd.addColorStop(0, nodes[i].color + '44');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = 1 + Math.sin(timeRef.current * 2 + node.px) * 0.15;

        // Outer glow
        const grd = ctx.createRadialGradient(
          node.px, node.py, 6 * pulse,
          node.px, node.py, 24 * pulse
        );
        grd.addColorStop(0, node.color + '30');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.px, node.py, 24 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(node.px, node.py, 6, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = 'rgba(232,235,240,0.55)';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.px, node.py + 20);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
