// Additive, authored continuations. Existing selected/queued Task 14 IDs remain valid.
// Requirements choose a route; they never manufacture evidence or a reference.
export const CONTINUATIONS = {
  rs_field_sample: { left: [{ next: "rx_field_crossing" }] },
  rs_archive: { left: [{ next: "rx_geology" }] },
  rs_archive_return: { left: [{ next: "rx_geology" }] },
  rs_measure: { left: [{ next: "rx_debate" }] },
  rs_hypothesis: {
    left: [{ next: "rx_replication" }],
    right: [{ next: "rx_replication" }],
  },
  rs_boundary: { left: [{ next: "rx_veil" }] },
  rx_reference: {
    left: [
      { next: "rs_recognition", gate: "reference" },
      { next: "rx_preparation" },
    ],
    right: [{ next: "rx_preparation" }],
  },
  rs_recognition: {
    left: [{ next: "rx_preparation" }],
    right: [{ next: "rx_preparation" }],
  },
  rs_protection: { left: [{ next: "rx_window" }] },
  rs_alternative: { left: [{ next: "rx_window" }] },
};
