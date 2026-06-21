import { TRY_ON_ENV } from "./env";
import { isNvidiaQwenModel } from "./nvidiaCommon";
import { generateWithNvidiaFlux } from "./nvidiaFlux";
import { generateWithNvidiaQwen } from "./nvidiaQwen";
import type { GenerateTryOnOptions, GenerateTryOnResponse } from "./types";

export {
  isNvidiaConfigured,
  isNvidiaCustomImageUnsupported,
  nvidiaMissingConfigMessage,
} from "./nvidiaCommon";

export async function generateWithNvidia(
  options: GenerateTryOnOptions
): Promise<GenerateTryOnResponse> {
  if (isNvidiaQwenModel()) {
    return generateWithNvidiaQwen(options);
  }
  return generateWithNvidiaFlux(options);
}

export function nvidiaProviderLabel(): string {
  return isNvidiaQwenModel()
    ? `${TRY_ON_ENV.nvidiaProviderDisplayName} (Qwen Edit)`
    : `${TRY_ON_ENV.nvidiaProviderDisplayName} (FLUX Kontext)`;
}
