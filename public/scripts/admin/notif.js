(function(){
  const container = document.getElementById("notif-container");

  function notify(message, options = {}) {
    const duration = options.duration || 4000;
    const type = options.type || "info";

    // create elements
    const n = document.createElement("div");
    n.className = `notif ${type}`;
    n.innerHTML = `
      <button class="close-btn">&times;</button>
      <div class="message">${message}</div>
      <div class="progress"></div>
    `;
    container.appendChild(n);

    const progress = n.querySelector(".progress");
    const closeBtn = n.querySelector(".close-btn");

    // animate progress-bar
    requestAnimationFrame(() => {
      progress.style.transition = `transform ${duration}ms linear`;
      progress.style.transform = "scaleX(0)";
    });

    // auto-remove after duration
    const timeoutId = setTimeout(() => removeNotif(n), duration);

    // manual close
    closeBtn.addEventListener("click", () => {
      clearTimeout(timeoutId);
      removeNotif(n);
    });
  }

  function removeNotif(elem) {
    elem.style.transition = "opacity 0.3s, height 0.3s, margin 0.3s";
    elem.style.opacity = 0;
    elem.style.height = 0;
    elem.style.margin = 0;
    setTimeout(() => {
      if (elem.parentNode) elem.parentNode.removeChild(elem);
    }, 300);
  }

  // expose globally
  window.notify = notify;
})();