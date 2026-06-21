const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";

function api(method, data) {
  const payload = JSON.stringify(data).replace(/"/g, '\\"');
  return JSON.parse(
    execSync(`netlify api ${method} --data "${payload}"`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    })
  );
}

const site = api("getSite", { site_id: siteId });
console.log("build_settings:", JSON.stringify(site.build_settings, null, 2));

// Clear publish directory — Next.js plugin manages output.
const updated = api("updateSite", {
  site_id: siteId,
  build_settings: {
    cmd: "node scripts/netlify-build.mjs",
    dir: "/",
    base_rel_dir: "",
    provider: site.build_settings?.provider ?? null,
    repo_url: site.build_settings?.repo_url ?? null,
    repo_branch: site.build_settings?.repo_branch ?? null,
  },
});

console.log("updated build_settings:", JSON.stringify(updated.build_settings, null, 2));
