const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const payload = JSON.stringify({ site_id: siteId, per_page: 20, page: 1 });
const escaped = payload.replace(/"/g, '\\"');

try {
  const logs = JSON.parse(
    execSync(`netlify api listSiteFunctionLogs --data "${escaped}"`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    })
  );
  console.log(JSON.stringify(logs, null, 2).slice(0, 4000));
} catch (err) {
  console.error("listSiteFunctionLogs failed:", err.message);
  // try alternate endpoint
  try {
    const alt = JSON.parse(
      execSync(`netlify api --list`, { encoding: "utf8" }).slice(0, 500)
    );
  } catch {}
}
