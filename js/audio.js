let context;
export function sound(kind, enabled) {
  if (!enabled) return;
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === "suspended") context.resume().catch(() => {});
    const notes =
      kind === "achievement"
        ? [523, 659, 784]
        : kind === "year"
          ? [392, 523]
          : kind === "money"
            ? [740, 988]
            : [440];
    notes.forEach((frequency, i) => {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        start = context.currentTime + i * 0.085;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    });
  } catch {
    /* Audio is optional. */
  }
}
