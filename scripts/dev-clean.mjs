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

function clearBuildCaches() {
  for (const dir of [".next", path.join("node_modules", ".cache")]) {
    const target = path.join(root, dir);

    if (!fs.existsSync(target)) {
      continue;
    }

    try {
      fs.rmSync(target, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 300,
      });
      console.log(`Cleared ${dir}`);
    } catch (error) {
      console.warn(`Could not fully clear ${dir} (continuing anyway):`, error.message);
    }
  }
}

for (const port of [3000, 3001]) {
  killPort(port);
}

clearBuildCaches();

console.log("Starting dev server on http://localhost:3000 ...\n");

const child = spawn(process.execPath, [getNextBin(), "dev", "-p", "3000"], {
  cwd: root,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
