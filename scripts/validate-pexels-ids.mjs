/** Validate Pexels CDN URLs return 200. Usage: node scripts/validate-pexels-ids.mjs id1 id2 ... */
const ids = process.argv.slice(2).map(Number).filter(Boolean);

async function check(id) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop`;
  const res = await fetch(url, { method: "HEAD", redirect: "follow" });
  return { id, ok: res.ok, status: res.status, len: res.headers.get("content-length") };
}

const results = await Promise.all(ids.map(check));
const ok = results.filter((r) => r.ok);
const bad = results.filter((r) => !r.ok);
console.log(`OK: ${ok.length}/${ids.length}, BAD: ${bad.length}`);
if (bad.length) console.log("Failed:", bad.map((r) => `${r.id}(${r.status})`).join(", "));
console.log("Valid IDs:", ok.map((r) => r.id).join(", "));
