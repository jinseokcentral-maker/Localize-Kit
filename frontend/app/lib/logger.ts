/**
 * Log timing with simple color thresholds:
 * - < 300ms: green
 * - >= 300ms and < 500ms: orange
 * - >= 500ms: red
 */
export function logTimed(label: string, ms: number) {
  const color = ms >= 500 ? "#ef4444" : ms >= 300 ? "#f59e0b" : "#22c55e"; // red / orange / green
  const rounded = Math.round(ms);
  console.log(
    `%c🦀 ${label}: ${rounded} ms`,
    `color:${color}; font-weight:600; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;`
  );
}
