const { execSync } = require("child_process");
const fs = require("fs");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const payload = JSON.stringify({ site_id: siteId }).replace(/"/g, '\\"');
const site = JSON.parse(
  execSync(`netlify api getSite --data "${payload}"`, { encoding: "utf8" })
);
fs.writeFileSync("netlify-site-dump.json", JSON.stringify(site, null, 2));
console.log("keys:", Object.keys(site).join(", "));
console.log("build_settings:", site.build_settings);
console.log("repo:", site.repo);
