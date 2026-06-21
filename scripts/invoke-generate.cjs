process.env.NETLIFY = "true";
process.env.IMAGE_PROVIDER = process.env.IMAGE_PROVIDER || "gemini";

const { POST } = require("../.next/server/app/api/fitting-room/generate/route.js");

const body = JSON.stringify({
  personImageUrl:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  productSlug: "royal-navy-wedding-tuxedo",
});

async function main() {
  const req = new Request("http://localhost/api/fitting-room/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const res = await POST(req);
  console.log("status", res.status);
  console.log(await res.text());
}

main().catch((err) => {
  console.error("HANDLER CRASH", err);
  process.exit(1);
});
