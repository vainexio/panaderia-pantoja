const PING_INTERVAL = 10000;
const SLOW_THRESHOLD = 3000;

let lastPingSuccess = true;

async function pingServer() {
  const start = performance.now();
  try {
    // abort if it takes too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SLOW_THRESHOLD);

    const res = await fetch("/ping", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      const error = await res.json();
      notify(error.message || "Session expired", { type: "error" });
      setTimeout(() => {
        window.location.href = error.redirect || "/";
      }, 2000);
      return;
    }

    const duration = performance.now() - start;
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    if (duration > SLOW_THRESHOLD) {
      notify(`Warning: slow connection detected (${Math.round(duration)}ms)`, {
        type: "warn",
        duration: 5000,
      });
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

window.addEventListener("offline", () =>
  notify("You are offline", { type: "warn", duration: 10000 })
);
window.addEventListener("online", () =>
  notify("You are back online", { type: "success", duration: 10000 })
);
//
const socket = io("https://panaderiapantoja.glitch.me");

socket.on("notify", (data) => {
  notify(data.message, { type: data.type, duration: data.duration });
});
socket.on("reload", (data) => {
  let target = data.target;
  if (target == "inventory") loadInventory(false, true);
  else if (target == "product") {
    let product = data.product;
    if (currentProduct.product_id == product.product_id) {
      showProductDetails(product, true);
    }
  }
});
