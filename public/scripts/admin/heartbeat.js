let counter = 0 
async function heartBeat() {
  setInterval(function() {
    counter++
    console.log("heartbeat "+counter)
  }, 30000)
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(heartBeat);
});
