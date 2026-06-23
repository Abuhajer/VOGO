const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const payload = {
  site_id: siteId,
  repo: {
    provider: "github",
    repo: "Abuhajer/VOGO",
    repo_branch: "master",
    cmd: "node scripts/netlify-build.mjs",
    dir: "/",
  },
  build_settings: {
    provider: "github",
    repo_url: "https://github.com/Abuhajer/VOGO",
    repo_branch: "master",
    cmd: "node scripts/netlify-build.mjs",
  },
};

try {
  const out = execSync(`netlify api updateSite --data "${JSON.stringify(payload).replace(/"/g, '\\"')}"`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const site = JSON.parse(out);
  console.log("repo:", site.build_settings?.repo_url || site.repo?.url || "none");
  console.log("branch:", site.build_settings?.repo_branch || site.repo?.branch || "-");
  console.log("cmd:", site.build_settings?.cmd || site.repo?.cmd || "-");
} catch (err) {
  console.error(err.stderr?.toString() || err.stdout?.toString() || err.message || err);
  process.exit(1);
}
