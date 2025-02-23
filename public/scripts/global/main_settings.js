async function removeSession(sessionId,callback) {
  try {
    const response = await fetch("/removeSession", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (response.ok) {
      console.log("Session removed successfully");
      // Refresh
      callback();
    } else {
      console.error("Failed to remove session");
    }
  } catch (error) {
    console.error("Error removing session:", error);
  }
}
async function removeOtherSessions(accountId, type, callback) {
  try {
    const response = await fetch("/removeOtherSessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, type }),
    });
    if (response.ok) {
      console.log("All sessions removed successfully");
      callback();
    } else {
      console.error("Failed to remove other sessions");
    }
  } catch (error) {
    console.error("Error removing other sessions:", error);
  }
}