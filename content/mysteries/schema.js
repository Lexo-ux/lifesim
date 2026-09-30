// Authored incident records, not a scripting language or a second world clock.
export const note = (id, text, extra = {}) => ({ id, text, ...extra });
export const option = (label, result, next = null, extra = {}) => ({
  label,
  result,
  next,
  ...extra,
});
export const beat = (id, text, observations, left, right, extra = {}) => ({
  id,
  text,
  observations,
  left,
  right,
  ...extra,
});
export const cap = (id) => ({ type: "capability", id });
export const prior = (id) => ({ type: "meta-discovery", id });
export const document = (
  id,
  source,
  date,
  reliability,
  contradicts = null,
) => ({ id, source, date, reliability, contradicts });
