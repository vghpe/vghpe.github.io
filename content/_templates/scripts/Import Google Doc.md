<%*
const { execSync } = require("child_process");
const vaultRoot = app.vault.adapter.basePath;
const repoRoot = vaultRoot.substring(0, vaultRoot.lastIndexOf("/"));
const filePath = tp.file.path(false);
const script = `${repoRoot}/scripts/import-google-doc.py`;
try {
  const out = execSync(`python3 "${script}" "${filePath}"`, { encoding: "utf8" });
  new Notice(out.trim(), 6000);
} catch (e) {
  new Notice("Error: " + (e.stderr || e.message || "unknown error").trim(), 8000);
}
-%>
