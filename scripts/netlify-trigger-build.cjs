const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const payload = JSON.stringify({ site_id: siteId });
const escaped = payload.replace(/"/g, '\\"');

try {
  const build = JSON.parse(
    execSync(`netlify api createSiteBuild --data "${escaped}"`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    })
  );
  console.log("Build triggered:", build.id, build.state, build.deploy_id);
} catch (err) {
  console.error(err.stderr?.toString() || err.message || err);
  process.exit(1);
}
