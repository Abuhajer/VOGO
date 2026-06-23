import type { GenerateTryOnOptions, GenerateTryOnResponse } from "../types";

export type ImageProviderId = "gemini" | "nvidia" | "local";

/** Admin-selectable try-on backends (cloud Gemini vs local ComfyUI). */
export type AdminTryOnProvider = "gemini" | "local";

export interface ImageTransformProvider {
  readonly id: ImageProviderId;
  readonly displayName: string;
  isConfigured(): boolean;
  missingConfigurationMessage(): string;
  generate(options: GenerateTryOnOptions): Promise<GenerateTryOnResponse>;
}
