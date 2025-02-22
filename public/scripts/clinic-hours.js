function waitUntilReady(callback) {
  if (ready === true) {
    callback();
  } else {
    setTimeout(() => waitUntilReady(callback), 100);
  }
}

document.addEventListener("DOMContentLoaded", async function() {
  function isReady() {
    
  }
  waitUntilReady(isReady)
})
