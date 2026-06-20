const NVCF_ASSETS_URL = "https://api.nvcf.nvidia.com/v2/nvcf/assets";

type CreateAssetResponse = {
  assetId?: string;
  uploadUrl?: string;
  contentType?: string;
};

/**
 * Upload image bytes to NVIDIA Cloud Functions asset storage.
 * Required for custom photos on ai.api.nvidia.com (inline base64 is preview-only).
 */
export async function uploadNvcfImageAsset(
  buffer: Buffer,
  contentType: string,
  apiKey: string,
  description = "vogo-fitting-room-person"
): Promise<string> {
  const createRes = await fetch(NVCF_ASSETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ contentType, description }),
    signal: AbortSignal.timeout(60_000),
  });

  const createText = await createRes.text();
  if (!createRes.ok) {
    throw new Error(
      `NVCF asset create failed (${createRes.status}): ${createText.slice(0, 300)}`
    );
  }

  let created: CreateAssetResponse;
  try {
    created = JSON.parse(createText) as CreateAssetResponse;
  } catch {
    throw new Error("NVCF asset create returned non-JSON response");
  }

  const assetId = created.assetId?.trim();
  const uploadUrl = created.uploadUrl?.trim();
  if (!assetId || !uploadUrl) {
    throw new Error("NVCF asset create response missing assetId or uploadUrl");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-meta-nvcf-asset-description": description,
    },
    body: new Uint8Array(buffer),
    signal: AbortSignal.timeout(120_000),
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text().catch(() => "");
    throw new Error(
      `NVCF asset upload failed (${uploadRes.status}): ${uploadErr.slice(0, 300)}`
    );
  }

  return assetId;
}

export function nvcfAssetImageReference(assetId: string, contentType: string): string {
  const mime = contentType.split(";")[0].trim() || "image/jpeg";
  return `data:${mime};asset_id,${assetId}`;
}
