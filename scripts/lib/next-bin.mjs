import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function getProjectRoot() {
  return root;
}

export function getNextBin() {
  return path.join(root, "node_modules", "next", "dist", "bin", "next");
}

export function getNextCommand(args) {
  return `"${process.execPath}" "${getNextBin()}" ${args.join(" ")}`;
}
