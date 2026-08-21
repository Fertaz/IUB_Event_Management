import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

const backend = spawn(node, [path.join(root, "server", "index.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const vite = spawn(node, [path.join(root, "node_modules", "vite", "bin", "vite.js")], {
  cwd: root,
  stdio: "inherit",
});

function shutdown(code) {
  if (!backend.killed) backend.kill();
  if (!vite.killed) vite.kill();
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

backend.on("exit", (code) => {
  if (code && code !== 0) {
    shutdown(code);
  }
});

vite.on("exit", (code) => {
  if (code && code !== 0) {
    shutdown(code);
  }
});
