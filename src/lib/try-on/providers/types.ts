import type { GenerateTryOnOptions, GenerateTryOnResponse } from "../types";

export type ImageProviderId = "gemini" | "nvidia";

export interface ImageTransformProvider {
  readonly id: ImageProviderId;
  readonly displayName: string;
  isConfigured(): boolean;
  missingConfigurationMessage(): string;
  generate(options: GenerateTryOnOptions): Promise<GenerateTryOnResponse>;
}
