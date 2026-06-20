export type TryOnImageInput = {
  url?: string;
  b64Json?: string;
  mimeType?: string;
};

/** Ordered Gemini content: instruction text → person photo → garment reference. */
export type TryOnMultimodalPart =
  | { type: "text"; text: string }
  | { type: "image"; image: TryOnImageInput };

export type GarmentTextContext = {
  title?: string | null;
  description?: string | null;
};

export type GenerateTryOnOptions = {
  prompt: string;
  originalImages?: TryOnImageInput[];
  /** When set, Gemini receives parts in this order instead of prompt-then-images. */
  multimodalParts?: TryOnMultimodalPart[];
  /** Person photo dimensions — injected into prompts for pixel-perfect output lock. */
  targetDimensions?: { width: number; height: number };
  /** Gemini prompt/images when NVIDIA hosted trial rejects custom photos. */
  fallbackPrompt?: string;
  fallbackImages?: TryOnImageInput[];
  fallbackMultimodalParts?: TryOnMultimodalPart[];
};

export type GenerateTryOnResponse = {
  url: string;
  width?: number;
  height?: number;
};

export type FittingRoomProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  imageSrc: string;
  price: number;
};
