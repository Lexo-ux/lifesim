let context;
function audio() {
  context ||= new (window.AudioContext || window.webkitAudioContext)();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}
// A prismatic chord for the crossing: detuned voices that open like the seal.
// Returning a stop function gives the cinematic owner full cleanup on skip/hidden.
export function thresholdSound(enabled) {
  if (!enabled) return () => {};
  try {
    const ctx = audio(),
      gain = ctx.createGain(),
      now = ctx.currentTime;
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
    const voices = [
      [130.81, 0],
      [196, 4],
      [329.63, -5],
      [493.88, 7],
      [987.77, 3],
    ].map(([frequency, detune], i) => {
      const voice = ctx.createOscillator();
      voice.type = i < 2 ? "sine" : "triangle";
      voice.frequency.setValueAtTime(frequency, now);
      voice.detune.setValueAtTime(detune, now);
      voice.connect(gain);
      voice.start(now + i * 0.07);
      voice.stop(now + 1.95);
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
    return stop;
  } catch {
    return () => {};
  }
}
// While the portal is held: a low fifth whose pitch and level follow the charge.
export function holdTone(enabled) {
  if (!enabled) return null;
  try {
    const ctx = audio(),
      gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);
    const voices = [110, 164.81].map((frequency) => {
      const voice = ctx.createOscillator();
      voice.type = "sine";
      voice.frequency.value = frequency;
      voice.connect(gain);
      voice.start();
      return voice;
    });
    return {
      set(charge) {
        const t = ctx.currentTime;
        gain.gain.setTargetAtTime(0.0001 + charge * 0.03, t, 0.05);
        voices.forEach((v, i) =>
          v.frequency.setTargetAtTime(
            (i ? 164.81 : 110) * (1 + charge * 0.5),
            t,
            0.05,
          ),
        );
      },
      stop() {
        const t = ctx.currentTime;
        gain.gain.setTargetAtTime(0.0001, t, 0.04);
        for (const voice of voices) {
          try {
            voice.stop(t + 0.2);
          } catch {
            /* Already stopped. */
          }
          voice.onended = () => voice.disconnect();
        }
        setTimeout(() => gain.disconnect(), 260);
      },
    };
  } catch {
    return null;
  }
}
// Short cues. A decision sounds like a shard of glass, never a reward chime.
export function sound(kind, enabled) {
  if (!enabled) return;
  try {
    const ctx = audio();
    const special = {
      commit: [1318.5, 1975.5, 98],
      low: [622.3, 466.2, 82.4],
      mystery: [880, 932.3, 1396.9],
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
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        glass = frequency > 600,
        start = ctx.currentTime + i * (glass ? 0.03 : 0.085);
      oscillator.type = glass ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        glass ? 0.035 : 0.055,
        start + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + (glass ? 0.32 : 0.16),
      );
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + (glass ? 0.34 : 0.17));
    });
  } catch {
    /* Audio is optional. */
  }
}
