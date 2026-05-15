import confetti from 'canvas-confetti';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
}

export const _triggerConfetti = (options: ConfettiOptions = {}) => {
  const defaults = {
    particleCount: 100,
    spread: 70,
    startVelocity: 30,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    origin: { y: 0.6 },
    colors: ['#4AE66C', '#5E2DEB', '#F79C42', '#00B4D8', '#9D4EDD'],
  };

  const finalOptions = { ...defaults, ...options };

  // Create multiple bursts
  const bursts = 3;
  const burstInterval = 150;

  for (let i = 0; i < bursts; i++) {
    setTimeout(() => {
      confetti({
        ...finalOptions,
        particleCount: Math.floor(finalOptions.particleCount! / bursts),
        origin: {
          x: Math.random() * 0.3 + 0.35, // Random x position between 0.35 and 0.65
          y: finalOptions.origin?.y || 0.6,
        },
      });
    }, i * burstInterval);
  }
};

export const triggerConfetti = _triggerConfetti;
