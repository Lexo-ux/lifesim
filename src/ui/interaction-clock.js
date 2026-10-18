// Active reading/decision time only. No Date, Earth-clock or gameplay RNG access.
// Injectable scheduler makes pauses and exact expiry testable.
export function createInteractionClock({
  durationMs,
  elapsedMs = 0,
  mode = "normal",
  now = () => performance.now(),
  schedule = (fn) => setTimeout(fn, 100),
  cancel = (id) => clearTimeout(id),
  onTick = () => {},
  onCheckpoint = () => {},
  onExpire = () => {},
}) {
  let elapsed = elapsedMs,
    previous = now(),
    token = null,
    running = false,
    destroyed = false,
    expired = false,
    checkpoint = elapsedMs;
  const rate = () =>
    mode === "unlimited" ? 0 : mode === "extended" ? 1 / 3 : 1;
  const sample = () => {
    const time = now();
    if (running)
      elapsed = Math.min(
        durationMs,
        elapsed + Math.max(0, time - previous) * rate(),
      );
    previous = time;
    return Math.floor(elapsed);
  };
  const flush = () => {
    const value = sample();
    onCheckpoint(value);
    checkpoint = value;
  };
  const update = () => {
    token = null;
    if (!running || destroyed) return;
    const value = sample();
    onTick({
      elapsedMs: value,
      remainingMs: Math.max(0, durationMs - value),
      mode,
    });
    if (value - checkpoint >= 250) {
      onCheckpoint(value);
      checkpoint = value;
    }
    if (value >= durationMs && mode !== "unlimited" && !expired) {
      expired = true;
      running = false;
      onCheckpoint(value);
      onExpire();
      return;
    }
    token = schedule(update);
  };
  const pause = () => {
    if (destroyed) return;
    flush();
    running = false;
    cancel(token);
    token = null;
  };
  const resume = () => {
    if (destroyed || expired || running) return;
    previous = now();
    running = true;
    token = schedule(update);
  };
  return {
    pause,
    resume,
    checkpoint: flush,
    setMode(next) {
      pause();
      mode = next;
      onTick({
        elapsedMs: Math.floor(elapsed),
        remainingMs: durationMs - elapsed,
        mode,
      });
    },
    destroy() {
      pause();
      destroyed = true;
    },
  };
}
