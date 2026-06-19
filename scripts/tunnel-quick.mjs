#!/usr/bin/env node
/**
 * Starts a temporary Cloudflare quick tunnel to the local Next.js app.
 * No Cloudflare account required — URL is printed as *.trycloudflare.com
 */
import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3000";
const origin = `http://localhost:${port}`;

console.log(`Starting Cloudflare quick tunnel → ${origin}`);
console.log("Press Ctrl+C to stop.\n");

const child = spawn("cloudflared", ["tunnel", "--url", origin], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
