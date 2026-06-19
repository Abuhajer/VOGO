import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: "utf8",
      });
      const pids = new Set();

      for (const line of output.split("\n")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts.at(-1);
        if (pid && pid !== "0") {
          pids.add(pid);
        }
      }

      for (const pid of pids) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    }
  } catch {
    // Nothing listening on this port.
  }
}

for (const port of [3000, 3001]) {
  killPort(port);
}

fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
console.log("Cleared .next cache");
console.log("Starting dev server on http://localhost:3000 ...\n");

const child = spawn("next", ["dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
