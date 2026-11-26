#!/usr/bin/env node
/**
 * Wake the free Render API. It sleeps when nobody has called it.
 * Retries GET {API_URL}/health for up to 2 minutes.
 */
const deadlineMs = 2 * 60 * 1000;
const pauseMs = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const api = String(process.env.API_URL || "").replace(/\/$/, "");
  if (!api) {
    console.error("Set API_URL, for example https://expalapp-1.onrender.com");
    process.exit(1);
  }

  const deadline = Date.now() + deadlineMs;
  let last = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${api}/health`);
      if (response.ok) {
        console.log("API is awake.");
        return;
      }
      last = `HTTP ${response.status}`;
    } catch (err) {
      last = err.message || String(err);
    }
    console.log(`Waiting for the API (${last}).`);
    await sleep(pauseMs);
  }
  console.error(`API did not wake up in 2 minutes (${last}).`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
