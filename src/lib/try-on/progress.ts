export type TryOnProgressPhase = "prepare" | "upload" | "generate" | "finalize";

export type TryOnProgressUpdate = {
  percent: number;
  phase: TryOnProgressPhase;
  /** Sampler step (ComfyUI) when known */
  step?: number;
  totalSteps?: number;
};

export type TryOnProgressCallback = (update: TryOnProgressUpdate) => void;

/** Map server phase → atelier stage rail index (0–3). */
export function phaseToStageIndex(phase: TryOnProgressPhase): number {
  switch (phase) {
    case "prepare":
      return 0;
    case "upload":
      return 1;
    case "generate":
      return 2;
    case "finalize":
      return 3;
    default:
      return 0;
  }
}

export function clampProgressPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Gemini has no step API — gentle creep while the HTTP request is in flight. */
export function startIndeterminateProgress(
  onProgress: TryOnProgressCallback,
  options: { startPercent?: number; capPercent?: number; intervalMs?: number } = {}
): () => void {
  const start = options.startPercent ?? 12;
  const cap = options.capPercent ?? 88;
  const intervalMs = options.intervalMs ?? 2500;
  let current = start;
  let cancelled = false;

  onProgress({ percent: current, phase: "generate" });

  const timer = setInterval(() => {
    if (cancelled) return;
    const remaining = cap - current;
    if (remaining <= 0) return;
    const bump = Math.max(1, Math.round(remaining * 0.08));
    current = clampProgressPercent(Math.min(cap, current + bump));
    onProgress({ percent: current, phase: "generate" });
  }, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
