/** Lightweight try-on config check — no sharp/NVIDIA/Gemini module imports. */
export function isTryOnConfiguredFromEnv(): boolean {
  const provider = process.env.IMAGE_PROVIDER?.trim().toLowerCase() ?? "gemini";
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const nvidia = Boolean(process.env.NVIDIA_API_KEY?.trim());

  if (provider === "local" || provider === "comfy") {
    return true;
  }
  if (provider === "nvidia") {
    return nvidia || gemini;
  }
  return gemini;
}

/** Runtime check using admin setting when available. */
export async function isTryOnConfiguredForRuntime(): Promise<boolean> {
  const { isTryOnConfigured } = await import("./providers/registry");
  return isTryOnConfigured();
}
