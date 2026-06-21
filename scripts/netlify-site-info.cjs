const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const payload = JSON.stringify({ site_id: siteId });
const escaped = payload.replace(/"/g, '\\"');

const site = JSON.parse(
  execSync(`netlify api getSite --data "${escaped}"`, { encoding: "utf8" })
);
console.log("site:", site.name);
console.log("repo:", site.build_settings?.repo_url || "none");
console.log("provider:", site.build_settings?.provider || "none");
console.log("cmd:", site.build_settings?.cmd);
console.log("branch:", site.build_settings?.repo_branch);
