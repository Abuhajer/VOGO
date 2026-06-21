import type Sharp from "sharp";

type SharpModule = typeof Sharp;

let sharpPromise: Promise<SharpModule> | null = null;

/** Lazy-load sharp so route registration succeeds even when native bindings are unavailable. */
export async function getSharp(): Promise<SharpModule> {
  if (!sharpPromise) {
    sharpPromise = import("sharp").then((mod) => mod.default ?? mod);
  }
  return sharpPromise;
}
