const { execSync } = require("child_process");

const siteId = "f3a2ce01-8f8c-4bf5-9c4d-1126509a682a";

function netlifyApi(method, data) {
  const payload = data ? JSON.stringify(data).replace(/"/g, '\\"') : "";
  const cmd = payload
    ? `netlify api ${method} --data "${payload}"`
    : `netlify api ${method}`;
  return JSON.parse(execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }));
}

try {
  const builds = netlifyApi("listSiteDeploys", { site_id: siteId, per_page: 5, page: 1 });
  for (const d of builds) {
    console.log(
      d.id,
      d.state,
      d.context,
      d.branch || "-",
      d.commit_ref?.slice(0, 7) || "-",
      d.created_at
    );
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
