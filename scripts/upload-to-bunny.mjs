/**
 * Upload media to the Bunny.net storage zone.
 *
 * Credentials come from .env.local, which is gitignored — nothing here should
 * ever be hardcoded.
 *
 *   node scripts/upload-to-bunny.mjs <localFile> <remotePath>
 *   node scripts/upload-to-bunny.mjs --list [remotePath]
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

const HOST = env.BUNNY_STORAGE_HOST ?? "storage.bunnycdn.com";
const ZONE = env.BUNNY_STORAGE_ZONE;
const KEY = env.BUNNY_STORAGE_PASSWORD;

if (!ZONE || !KEY) {
  console.error("Missing BUNNY_STORAGE_ZONE or BUNNY_STORAGE_PASSWORD in .env.local");
  process.exit(1);
}

const [first, second] = process.argv.slice(2);

if (first === "--list") {
  const path = second ? `${second.replace(/^\/|\/$/g, "")}/` : "";
  const response = await fetch(`https://${HOST}/${ZONE}/${path}`, {
    headers: { AccessKey: KEY },
  });
  const items = await response.json();
  if (!Array.isArray(items) || items.length === 0) {
    console.log(`(empty) /${path}`);
  } else {
    for (const item of items) {
      const size = item.IsDirectory ? "dir" : `${(item.Length / 1024 / 1024).toFixed(2)} MB`;
      console.log(`${item.ObjectName.padEnd(28)} ${size}`);
    }
  }
  process.exit(0);
}

if (!first) {
  console.error("Usage: node scripts/upload-to-bunny.mjs <localFile> <remotePath>");
  process.exit(1);
}

const remote = (second ?? basename(first)).replace(/^\//, "");
const body = await readFile(first);

const response = await fetch(`https://${HOST}/${ZONE}/${remote}`, {
  method: "PUT",
  headers: { AccessKey: KEY, "Content-Type": "application/octet-stream" },
  body,
});

if (!response.ok) {
  console.error(`Upload failed: ${response.status} ${await response.text()}`);
  process.exit(1);
}

console.log(
  `Uploaded ${first} -> /${remote} (${(body.length / 1024 / 1024).toFixed(2)} MB)`
);
