// threshold (ms) above which we consider it “slow”
const PING_INTERVAL = 10000; // every 10s
const SLOW_THRESHOLD = 3000;  // 3s

let lastPingSuccess = true;

async function pingServer() {
  const start = performance.now();
  try {
    // abort if it takes too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SLOW_THRESHOLD);

    const res = await fetch("/ping", { signal: controller.signal });
    clearTimeout(timeoutId);

    const duration = performance.now() - start;
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    if (duration > SLOW_THRESHOLD) {
      notify(
        `Warning: slow connection detected (${Math.round(duration)} ms)`,
        { type: "warning", duration: 5000 }
      );
    } else if (!lastPingSuccess || !navigator.onLine) {
      // recovered from failure/offline
      notify("Connection restored", { type: "success", duration: 3000 });
    }

    lastPingSuccess = true;
  } catch (err) {
    // aborted (timeout) or network/server error
    if (lastPingSuccess) {
      notify(
        err.name === "AbortError"
          ? "Ping timed out. Connection seems slow or down."
          : "Unable to reach server. Check your internet.",
        { type: "error", duration: 5000 }
      );
    }
    lastPingSuccess = false;
  }
}

// start polling
setInterval(pingServer, PING_INTERVAL);

// optional: react to browser offline/online events
window.addEventListener("offline", () =>
  notify("You are offline", { type: "error", duration: 10000 })
);
window.addEventListener("online", () =>
  notify("You are back online", { type: "success", duration: 10000 })
);
