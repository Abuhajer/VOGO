import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getNextBin, getProjectRoot } from "./lib/next-bin.mjs";

const root = getProjectRoot();

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: "utf8",
      });
      for (const line of output.split("\n")) {
        const pid = line.trim().split(/\s+/).at(-1);
        if (pid && pid !== "0") {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        }
      }
    }
  } catch {
    // Port free.
  }
}

function clearNextCache() {
  const nextDir = path.join(root, ".next");
  if (!fs.existsSync(nextDir)) return;

  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch (error) {
    console.warn("Could not fully clear .next cache:", error.message);
  }
}

killPort(3000);
clearNextCache();

console.log("Building production bundle...\n");
execSync(`"${process.execPath}" "${getNextBin()}" build`, {
  cwd: root,
  stdio: "inherit",
});

console.log("\nStarting production server on http://localhost:3000 ...\n");
const child = spawn(process.execPath, [getNextBin(), "start", "-p", "3000"], {
  cwd: root,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
