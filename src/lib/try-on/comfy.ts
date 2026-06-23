import { buildKleinTryOnWorkflow } from "./comfy-workflow";
import { TRY_ON_ENV } from "./env";
import { clampProgressPercent } from "./progress";
import { saveGeneratedImage, tryOnImageToJpegBuffer } from "./nvidiaCommon";
import type { GenerateTryOnOptions } from "./types";
import type { TryOnProgressCallback } from "./progress";

type ComfyUploadResponse = { name: string; subfolder?: string; type?: string };

type ComfyHistoryImage = {
  filename: string;
  subfolder?: string;
  type?: string;
};

type ComfyHistoryEntry = {
  status?: { status_str?: string; messages?: unknown[] };
  outputs?: Record<string, { images?: ComfyHistoryImage[] }>;
};

function baseUrl(): string {
  return TRY_ON_ENV.comfyBaseUrl.replace(/\/$/, "");
}

export function isComfyConfigured(): boolean {
  return Boolean(TRY_ON_ENV.comfyBaseUrl.trim());
}

export function comfyMissingConfigMessage(): string {
  return (
    "Local try-on is not configured. Set COMFYUI_BASE_URL (e.g. http://127.0.0.1:8188), " +
    "start ComfyUI with FLUX Klein GGUF, and choose Local in Admin → Settings."
  );
}

export async function pingComfyUi(): Promise<{ ok: boolean; message: string }> {
  if (!isComfyConfigured()) {
    return { ok: false, message: "COMFYUI_BASE_URL is not set" };
  }
  try {
    const res = await fetch(`${baseUrl()}/system_stats`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      return { ok: false, message: `ComfyUI returned HTTP ${res.status}` };
    }
    return { ok: true, message: "ComfyUI is reachable" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Cannot reach ComfyUI at ${baseUrl()} — start it with start.ps1. (${msg})`,
    };
  }
}

async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append(
    "image",
    new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }),
    filename
  );
  form.append("overwrite", "true");

  const res = await fetch(`${baseUrl()}/upload/image`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(TRY_ON_ENV.comfyRequestTimeoutMs),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ComfyUI image upload failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as ComfyUploadResponse;
  if (!json.name) {
    throw new Error("ComfyUI upload returned no filename");
  }
  return json.name;
}

async function queuePrompt(
  workflow: Record<string, unknown>,
  clientId: string
): Promise<string> {
  const res = await fetch(`${baseUrl()}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ComfyUI prompt rejected (${res.status}): ${text.slice(0, 500)}`);
  }

  const json = (await res.json()) as { prompt_id?: string };
  if (!json.prompt_id) {
    throw new Error("ComfyUI did not return a prompt_id");
  }
  return json.prompt_id;
}

function comfyWsUrl(clientId: string): string {
  const wsBase = baseUrl().replace(/^http/i, (scheme) => (scheme.toLowerCase() === "https" ? "wss" : "ws"));
  return `${wsBase}/ws?clientId=${encodeURIComponent(clientId)}`;
}

type ComfyWsProgress = { value: number; max: number; prompt_id?: string };

function watchComfyUiProgress(
  promptId: string,
  clientId: string,
  totalSteps: number,
  onProgress: TryOnProgressCallback | undefined,
  estimatedMs: number
): () => void {
  if (!onProgress) {
    return () => undefined;
  }

  let lastSamplerStep = 0;
  const started = Date.now();
  let closed = false;

  const reportSampler = (value: number, max: number) => {
    if (max <= 0) return;
    lastSamplerStep = value;
    const stepRatio = Math.min(1, value / max);
    const percent = clampProgressPercent(18 + stepRatio * 72);
    onProgress({
      percent,
      phase: "generate",
      step: Math.min(max, Math.max(0, Math.round(value))),
      totalSteps: max,
    });
  };

  const fallbackTimer = setInterval(() => {
    if (closed || lastSamplerStep > 0) return;
    const elapsed = Date.now() - started;
    const ratio = Math.min(1, elapsed / estimatedMs);
    onProgress({
      percent: clampProgressPercent(18 + ratio * 70),
      phase: "generate",
      step: Math.min(totalSteps, Math.max(1, Math.ceil(ratio * totalSteps))),
      totalSteps,
    });
  }, 2000);

  let ws: WebSocket | null = null;
  try {
    if (typeof WebSocket !== "undefined") {
      ws = new WebSocket(comfyWsUrl(clientId));
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type?: string;
            data?: ComfyWsProgress;
          };
          if (msg.type !== "progress" || !msg.data) return;
          if (msg.data.prompt_id && msg.data.prompt_id !== promptId) return;
          reportSampler(msg.data.value, msg.data.max);
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onerror = () => {
        /* fallback timer handles progress */
      };
    }
  } catch {
    ws = null;
  }

  return () => {
    closed = true;
    clearInterval(fallbackTimer);
    try {
      ws?.close();
    } catch {
      /* noop */
    }
  };
}

async function pollHistory(promptId: string): Promise<ComfyHistoryEntry> {
  const deadline = Date.now() + TRY_ON_ENV.comfyRequestTimeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl()}/history/${promptId}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`ComfyUI history failed (${res.status})`);
    }
    const hist = (await res.json()) as Record<string, ComfyHistoryEntry>;
    const entry = hist[promptId];
    if (entry) {
      if (entry.status?.status_str === "error") {
        throw new Error(
          `ComfyUI generation failed: ${JSON.stringify(entry.status.messages ?? []).slice(0, 500)}`
        );
      }
      return entry;
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error("ComfyUI generation timed out — try lowering COMFYUI_MEGAPIXELS or restart ComfyUI");
}

async function fetchOutputImage(images: ComfyHistoryImage[]): Promise<Buffer> {
  const img = images[0];
  if (!img?.filename) {
    throw new Error("ComfyUI returned no output image");
  }

  const params = new URLSearchParams({
    filename: img.filename,
    type: img.type ?? "output",
    subfolder: img.subfolder ?? "",
  });

  const res = await fetch(`${baseUrl()}/view?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`ComfyUI image fetch failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function generateWithComfy(options: GenerateTryOnOptions) {
  if (!isComfyConfigured()) {
    throw new Error(comfyMissingConfigMessage());
  }

  const onProgress = options.onProgress;
  onProgress?.({ percent: 5, phase: "prepare" });

  const ping = await pingComfyUi();
  if (!ping.ok) {
    throw new Error(ping.message);
  }

  const images = options.originalImages ?? [];
  if (images.length < 2) {
    throw new Error("Local FLUX Klein requires person and garment reference images");
  }

  const prompt = options.prompt?.trim();
  if (!prompt) {
    throw new Error("Try-on prompt is required for local ComfyUI generation");
  }

  const personBuffer = await tryOnImageToJpegBuffer(images[0]);
  const garmentBuffer = await tryOnImageToJpegBuffer(images[1]);
  const stamp = Date.now();
  const clientId = crypto.randomUUID();
  const totalSteps = TRY_ON_ENV.comfySteps;
  const estimatedMs = totalSteps * 12_000;

  console.log(`[TryOn] ${TRY_ON_ENV.comfyProviderDisplayName}: uploading images to ComfyUI…`);
  onProgress?.({ percent: 8, phase: "upload" });
  const personFile = await uploadImage(personBuffer, `vogo-person-${stamp}.jpg`);
  onProgress?.({ percent: 12, phase: "upload" });
  const garmentFile = await uploadImage(garmentBuffer, `vogo-garment-${stamp}.jpg`);
  onProgress?.({ percent: 16, phase: "upload" });

  const workflow = buildKleinTryOnWorkflow(personFile, garmentFile, prompt, {
    megapixels: TRY_ON_ENV.comfyMegapixels,
    cfg: TRY_ON_ENV.comfyCfg,
    steps: TRY_ON_ENV.comfySteps,
  });

  console.log(
    `[TryOn] ${TRY_ON_ENV.comfyProviderDisplayName}: queueing Klein workflow ` +
      `(${totalSteps} steps, ${TRY_ON_ENV.comfyMegapixels} MP)…`
  );
  onProgress?.({ percent: 18, phase: "generate", step: 0, totalSteps });
  const promptId = await queuePrompt(workflow, clientId);
  const stopWatch = watchComfyUiProgress(promptId, clientId, totalSteps, onProgress, estimatedMs);
  let history: ComfyHistoryEntry;
  try {
    history = await pollHistory(promptId);
  } finally {
    stopWatch();
  }
  onProgress?.({ percent: 90, phase: "generate", step: totalSteps, totalSteps });

  const allImages: ComfyHistoryImage[] = [];
  for (const node of Object.values(history.outputs ?? {})) {
    if (node.images?.length) {
      allImages.push(...node.images);
    }
  }

  const buffer = await fetchOutputImage(allImages);
  return saveGeneratedImage(buffer);
}
