/** ComfyUI API workflow for FLUX.2 Klein dual-reference image edit (GGUF, 6GB-friendly). */

export function buildKleinTryOnWorkflow(
  personFilename: string,
  garmentFilename: string,
  prompt: string,
  options: { megapixels?: number; cfg?: number; steps?: number; seed?: number } = {}
): Record<string, unknown> {
  const megapixels = options.megapixels ?? 0.5;
  const cfg = options.cfg ?? 1.0;
  const steps = options.steps ?? 6;
  const seed = options.seed ?? Math.floor(Math.random() * 2_000_000_000);

  return {
    "1": {
      class_type: "UnetLoaderGGUF",
      inputs: { unet_name: "flux-2-klein-4b-Q4_K_S.gguf" },
    },
    "2": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: "qwen_3_4b_fp4_flux2.safetensors",
        type: "flux2",
      },
    },
    "3": {
      class_type: "VAELoader",
      inputs: { vae_name: "flux2-vae.safetensors" },
    },
    "4": { class_type: "LoadImage", inputs: { image: personFilename } },
    "5": { class_type: "LoadImage", inputs: { image: garmentFilename } },
    "6": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["2", 0], text: prompt },
    },
    "7": {
      class_type: "ConditioningZeroOut",
      inputs: { conditioning: ["6", 0] },
    },
    "8": {
      class_type: "ImageScaleToTotalPixels",
      inputs: {
        image: ["4", 0],
        upscale_method: "nearest-exact",
        megapixels,
        resolution_steps: 1,
      },
    },
    "9": {
      class_type: "ImageScaleToTotalPixels",
      inputs: {
        image: ["5", 0],
        upscale_method: "nearest-exact",
        megapixels,
        resolution_steps: 1,
      },
    },
    "10": {
      class_type: "VAEEncode",
      inputs: { pixels: ["8", 0], vae: ["3", 0] },
    },
    "11": {
      class_type: "ReferenceLatent",
      inputs: { conditioning: ["6", 0], latent: ["10", 0] },
    },
    "12": {
      class_type: "ReferenceLatent",
      inputs: { conditioning: ["7", 0], latent: ["10", 0] },
    },
    "13": {
      class_type: "VAEEncode",
      inputs: { pixels: ["9", 0], vae: ["3", 0] },
    },
    "14": {
      class_type: "ReferenceLatent",
      inputs: { conditioning: ["11", 0], latent: ["13", 0] },
    },
    "15": {
      class_type: "ReferenceLatent",
      inputs: { conditioning: ["12", 0], latent: ["13", 0] },
    },
    "16": { class_type: "GetImageSize", inputs: { image: ["8", 0] } },
    "17": {
      class_type: "EmptyFlux2LatentImage",
      inputs: {
        width: ["16", 0],
        height: ["16", 1],
        batch_size: 1,
      },
    },
    "18": {
      class_type: "Flux2Scheduler",
      inputs: { steps, width: ["16", 0], height: ["16", 1] },
    },
    "19": {
      class_type: "RandomNoise",
      inputs: { noise_seed: seed },
    },
    "20": {
      class_type: "KSamplerSelect",
      inputs: { sampler_name: "euler" },
    },
    "21": {
      class_type: "CFGGuider",
      inputs: {
        model: ["1", 0],
        positive: ["14", 0],
        negative: ["15", 0],
        cfg,
      },
    },
    "22": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["19", 0],
        guider: ["21", 0],
        sampler: ["20", 0],
        sigmas: ["18", 0],
        latent_image: ["17", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["3", 0] },
    },
    "24": {
      class_type: "SaveImage",
      inputs: { images: ["23", 0], filename_prefix: "vogo-tryon" },
    },
  };
}
