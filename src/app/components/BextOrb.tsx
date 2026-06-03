import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface BextOrbProps {
  isThinking?: boolean;
}

export function BextOrb({ isThinking = false }: BextOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.35;

      // Pulsating effect
      const pulseSpeed = isThinking ? 0.08 : 0.03;
      const pulseAmount = isThinking ? 15 : 8;
      const radius = baseRadius + Math.sin(time * pulseSpeed) * pulseAmount;

      // Create multiple gradient layers for depth
      for (let i = 3; i >= 0; i--) {
        const layerRadius = radius * (0.4 + i * 0.2);
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          layerRadius
        );

        if (i === 3) {
          // Outer glow
          gradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
          gradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.1)');
          gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
        } else if (i === 2) {
          // Middle layer
          gradient.addColorStop(0, 'rgba(167, 139, 250, 0.4)');
          gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.3)');
          gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
        } else if (i === 1) {
          // Inner bright layer
          gradient.addColorStop(0, 'rgba(196, 181, 253, 0.8)');
          gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.5)');
          gradient.addColorStop(1, 'rgba(124, 58, 237, 0.2)');
        } else {
          // Core
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          gradient.addColorStop(0.3, 'rgba(196, 181, 253, 0.7)');
          gradient.addColorStop(1, 'rgba(167, 139, 250, 0.4)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add sparkle effect when thinking
      if (isThinking) {
        const sparkleCount = 8;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (time * 0.02 + (i * Math.PI * 2) / sparkleCount);
          const sparkleRadius = radius + 20 + Math.sin(time * 0.1 + i) * 10;
          const x = centerX + Math.cos(angle) * sparkleRadius;
          const y = centerY + Math.sin(angle) * sparkleRadius;

          const sparkleGradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
          sparkleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          sparkleGradient.addColorStop(1, 'rgba(167, 139, 250, 0)');

          ctx.fillStyle = sparkleGradient;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 1;
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isThinking]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-[300px] h-[300px]"
      />
      {isThinking && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
            Ойланып жатыр...
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
