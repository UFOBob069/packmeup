const CELEBRATION_COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"];

export async function fireCelebrationConfetti() {
  const confetti = (await import("canvas-confetti")).default;

  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.62 },
    colors: CELEBRATION_COLORS,
    disableForReducedMotion: true,
  });

  const end = Date.now() + 1800;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: CELEBRATION_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: CELEBRATION_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
