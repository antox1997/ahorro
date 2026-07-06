import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(".output/public");
const target = resolve("dist");

if (!existsSync(source)) {
  throw new Error("Build output not found at .output/public");
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

console.log("Static deploy folder ready: dist");
