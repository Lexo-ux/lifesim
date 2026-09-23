let context;
// A restrained two-voice resonance, started only by the final crossing gesture.
// Returning a stop function gives the cinematic owner full cleanup on skip/hidden.
export function thresholdSound(enabled) {
  if (!enabled) return () => {};
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    const gain = context.createGain(),
      now = context.currentTime;
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.75);
    const voices = [130.81, 196].map((frequency) => {
      const voice = context.createOscillator();
      voice.type = "sine";
      voice.frequency.setValueAtTime(frequency, now);
      voice.connect(gain);
      voice.start(now);
      voice.stop(now + 1.8);
      voice.onended = () => voice.disconnect();
      return voice;
    });
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      for (const voice of voices) {
        try {
          voice.stop();
        } catch {
          /* Already ended. */
        }
        voice.disconnect();
      }
      gain.disconnect();
    };
    voices.at(-1).onended = stop;
    if (context.state === "suspended") context.resume().catch(stop);
    return stop;
  } catch {
    return () => {};
  }
}
export function sound(kind, enabled) {
  if (!enabled) return;
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === "suspended") context.resume().catch(() => {});
    const special = {
      commit: [330, 440],
      low: [330, 262],
      mystery: [220, 233, 330],
      death: [330, 262, 196],
    };
    const notes =
      special[kind] ||
      (kind === "achievement"
        ? [523, 659, 784]
        : kind === "year"
          ? [392, 523]
          : kind === "money"
            ? [740, 988]
            : [440]);
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
