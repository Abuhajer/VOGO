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

try {
  const meta = api("getSiteMetadata", { site_id: siteId });
  console.log("metadata:", JSON.stringify(meta, null, 2));
} catch (e) {
  console.log("getSiteMetadata error:", e.message);
}

try {
  const updated = api("updateSite", {
    site_id: siteId,
    build_settings: {
      cmd: "node scripts/netlify-build.mjs",
      dir: "/",
      base_rel_dir: "",
      provider: "",
      repo_url: "",
      repo_branch: "",
    },
  });
  console.log("updateSite ok");
} catch (e) {
  console.log("updateSite error:", e.stderr?.toString() || e.message);
}

try {
  const build = api("createSiteBuild", { site_id: siteId, clear_cache: true });
  console.log("createSiteBuild:", build.id, build.state, build.deploy_id);
} catch (e) {
  console.log("createSiteBuild error:", e.stderr?.toString() || e.message);
}
