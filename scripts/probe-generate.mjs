const body = JSON.stringify({
  personImageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  productSlug: "royal-navy-wedding-tuxedo",
});

const url = process.argv[2] ?? "http://localhost:3000/api/fitting-room/generate";

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
});

const text = await res.text();
console.log("status", res.status);
console.log("content-type", res.headers.get("content-type"));
console.log(text.slice(0, 1200));
