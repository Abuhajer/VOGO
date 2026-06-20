import { readFileSync, existsSync } from "fs";
import path from "path";
import { TRY_ON_ENV } from "./env";
import builtinDefaultsJson from "./gemini.defaults.json";

export type GeminiHttpLimits = {
  errorBodyMaxChars: number;
  retry429FallbackSeconds: number;
  retryDelayMinSeconds: number;
  retryDelayMaxSeconds: number;
};

export type GeminiFileDefaults = {
  providerId: string;
  apiBaseUrl: string;
  urlTemplate: string;
  generationConfig: Record<string, unknown>;
  userContentRole: string;
  http: GeminiHttpLimits;
  messages: {
    quotaHintRegex: string;
    modelEnvVarName: string;
  };
};

function mergeGeminiDefaults(
  base: GeminiFileDefaults,
  over: Partial<GeminiFileDefaults>
): GeminiFileDefaults {
  return {
    ...base,
    ...over,
    generationConfig: { ...base.generationConfig, ...(over.generationConfig ?? {}) },
    http: { ...base.http, ...(over.http ?? {}) },
    messages: { ...base.messages, ...(over.messages ?? {}) },
  };
}

function readBuiltinDefaults(): GeminiFileDefaults {
  return structuredClone(builtinDefaultsJson) as GeminiFileDefaults;
}

function loadFileLayer(): GeminiFileDefaults {
  let base = readBuiltinDefaults();
  const custom = process.env.GEMINI_CONFIG_PATH?.trim();
  if (custom) {
    const resolved = path.isAbsolute(custom)
      ? custom
      : path.join(process.cwd(), custom);
    if (existsSync(resolved)) {
      const over = JSON.parse(readFileSync(resolved, "utf-8")) as Partial<GeminiFileDefaults>;
      base = mergeGeminiDefaults(base, over);
    }
  }
  return base;
}

export type GeminiRuntimeConfig = GeminiFileDefaults & {
  effectiveApiBase: string;
  effectiveGenerationConfig: Record<string, unknown>;
};

let cached: GeminiRuntimeConfig | null = null;

export function getGeminiRuntimeConfig(): GeminiRuntimeConfig {
  if (cached) return cached;
  const file = loadFileLayer();
  const effectiveApiBase = (TRY_ON_ENV.geminiApiBaseUrl || file.apiBaseUrl).replace(
    /\/+$/,
    ""
  );

  let gen = { ...file.generationConfig } as Record<string, unknown>;
  const extra = process.env.GEMINI_GENERATION_CONFIG_JSON?.trim();
  if (extra) {
    try {
      const parsed = JSON.parse(extra) as Record<string, unknown>;
      gen = { ...gen, ...parsed };
    } catch {
      throw new Error("GEMINI_GENERATION_CONFIG_JSON must be valid JSON object");
    }
  }

  cached = {
    ...file,
    effectiveApiBase,
    effectiveGenerationConfig: gen,
  };
  return cached;
}

export function resetGeminiRuntimeConfigCache(): void {
  cached = null;
}

export function buildGeminiRequestUrl(cfg: GeminiRuntimeConfig, model: string): string {
  const m = model.replace(/^models\//, "");
  return cfg.urlTemplate
    .replace(/\{base\}/g, cfg.effectiveApiBase)
    .replace(/\{model\}/g, encodeURIComponent(m));
}
