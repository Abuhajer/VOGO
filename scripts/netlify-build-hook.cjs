const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";
const action = process.argv[2] ?? "list";

function api(method, data) {
  const payload = JSON.stringify(data).replace(/"/g, '\\"');
  return JSON.parse(
    execSync(`netlify api ${method} --data "${payload}"`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    })
  );
}

if (action === "create") {
  const hook = api("createSiteBuildHook", {
    site_id: siteId,
    title: "Deploy master",
    branch: "master",
  });
  console.log("hook_url:", hook.url);
  console.log("id:", hook.id);
} else {
  const hooks = api("listSiteBuildHooks", { site_id: siteId });
  for (const h of hooks) {
    console.log(h.id, h.title, h.branch, h.url);
  }
}
