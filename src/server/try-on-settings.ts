"use server";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { TRY_ON_ENV } from "@/lib/try-on/env";
import { isComfyConfigured, pingComfyUi } from "@/lib/try-on/comfy";
import { isGeminiConfigured } from "@/lib/try-on/gemini";
import type { AdminTryOnProvider } from "@/lib/try-on/providers/types";
import { Role } from "@/types/db";

const SETTING_KEY = "tryOnImageProvider";
const FILE_PATH = path.join(process.cwd(), "data", "app-settings.json");

const providerSchema = z.enum(["gemini", "local"]);

export type TryOnSettingsSnapshot = {
  provider: AdminTryOnProvider;
  source: "database" | "file" | "env";
  geminiConfigured: boolean;
  localConfigured: boolean;
  comfyReachable: boolean;
  comfyStatusMessage: string;
  comfyBaseUrl: string;
};

export type TryOnSettingsActionResult =
  | { ok: true; settings: TryOnSettingsSnapshot }
  | { ok: false; error: "unauthorized" | "validation" | "unknown" };

function envDefaultProvider(): AdminTryOnProvider {
  const raw = TRY_ON_ENV.imageProvider.trim().toLowerCase();
  if (raw === "local" || raw === "comfy") return "local";
  return "gemini";
}

async function readFileSettings(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // missing or invalid file
  }
  return {};
}

async function writeFileSettings(settings: Record<string, string>): Promise<void> {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
}

async function readStoredProvider(): Promise<{
  provider: AdminTryOnProvider | null;
  source: TryOnSettingsSnapshot["source"] | null;
}> {
  const db = getPrisma();
  if (db) {
    try {
      const row = await db.appSetting.findUnique({ where: { key: SETTING_KEY } });
      const parsed = providerSchema.safeParse(row?.value);
      if (parsed.success) {
        return { provider: parsed.data, source: "database" };
      }
    } catch (err) {
      console.warn("[try-on-settings] database read failed", err);
    }
  }

  const file = await readFileSettings();
  const parsed = providerSchema.safeParse(file[SETTING_KEY]);
  if (parsed.success) {
    return { provider: parsed.data, source: "file" };
  }

  return { provider: null, source: null };
}

export async function getTryOnImageProvider(): Promise<AdminTryOnProvider> {
  const stored = await readStoredProvider();
  return stored.provider ?? envDefaultProvider();
}

export async function getTryOnSettingsSnapshot(): Promise<TryOnSettingsSnapshot> {
  const stored = await readStoredProvider();
  const provider = stored.provider ?? envDefaultProvider();
  const comfy = await pingComfyUi();

  return {
    provider,
    source: stored.source ?? "env",
    geminiConfigured: isGeminiConfigured(),
    localConfigured: isComfyConfigured(),
    comfyReachable: comfy.ok,
    comfyStatusMessage: comfy.message,
    comfyBaseUrl: TRY_ON_ENV.comfyBaseUrl,
  };
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session;
}

function revalidateSettingsPages() {
  for (const locale of ["ar", "en"]) {
    revalidatePath(`/${locale}/admin/settings`);
    revalidatePath(`/${locale}/fitting-room`);
  }
}

export async function setTryOnImageProvider(
  value: AdminTryOnProvider
): Promise<TryOnSettingsActionResult> {
  const session = await requireAdmin();
  if (!session) return { ok: false, error: "unauthorized" };

  const parsed = providerSchema.safeParse(value);
  if (!parsed.success) return { ok: false, error: "validation" };

  try {
    const db = getPrisma();
    if (db) {
      await db.appSetting.upsert({
        where: { key: SETTING_KEY },
        create: { key: SETTING_KEY, value: parsed.data },
        update: { value: parsed.data },
      });
    } else {
      const file = await readFileSettings();
      file[SETTING_KEY] = parsed.data;
      await writeFileSettings(file);
    }

    revalidateSettingsPages();
    const settings = await getTryOnSettingsSnapshot();
    return { ok: true, settings };
  } catch (err) {
    console.error("[try-on-settings] save failed", err);
    return { ok: false, error: "unknown" };
  }
}
