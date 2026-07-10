import { readFile } from "node:fs/promises";
import { glob } from "glob";

const PAGE_PATTERNS = ["app/**/page.ts", "app/**/page.tsx", "app/**/page.js", "app/**/page.jsx"];
const DEFAULT_EXPORT_REGEX = /\bexport\s+default\b/;

async function findPageFiles() {
  const files = await glob(PAGE_PATTERNS, {
    ignore: ["**/node_modules/**", "**/.next/**"],
    windowsPathsNoEscape: true,
  });

  return files.sort();
}

async function hasDefaultExport(filePath) {
  const source = await readFile(filePath, "utf8");
  return DEFAULT_EXPORT_REGEX.test(source);
}

async function main() {
  const pages = await findPageFiles();
  const missingDefaultExport = [];

  for (const page of pages) {
    const valid = await hasDefaultExport(page);
    if (!valid) {
      missingDefaultExport.push(page);
    }
  }

  if (missingDefaultExport.length > 0) {
    console.error("\n[check:app-pages] Missing default export in App Router page files:\n");
    for (const file of missingDefaultExport) {
      console.error(` - ${file}`);
    }
    console.error("\nFix each file by adding an `export default` page component.\n");
    process.exit(1);
  }

  console.log(`[check:app-pages] OK (${pages.length} page files validated).`);
}

main().catch((error) => {
  console.error("\n[check:app-pages] Failed to run check.");
  console.error(error);
  process.exit(1);
});