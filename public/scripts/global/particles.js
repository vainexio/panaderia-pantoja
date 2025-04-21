document.addEventListener("DOMContentLoaded", function () {
  particlesJS('particles-js', {
    particles: {
      number: {
        value: 70,
        density: { enable: true, value_area: 900 }
      },

      // use your bread image instead of circles
      shape: {
        type: 'image',
        image: {
          src: 'https://pics.clipartpng.com/Bread_PNG_Clip_Art-2218.png',  // ← point this at your bread image
          width: 5,                  // ← adjust to your image’s natural size
          height: 5
        }
      },

      opacity: {
        value: 0.5,
        random: true,
        anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
      },

      size: {
        value: 32,      // match roughly the image size if you want uniform breads
        random: false,  // or true if you want variety
        anim: { enable: false }
      },

      // disable the connecting lines
      line_linked: {
        enable: false
      },

      move: {
        enable: true,
        speed: 1,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false
      }
    },

    interactivity: {
      events: {
        onhover: { enable: true, mode: 'repulse' }
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push:   { particles_nb: 1 }
      }
    },

    retina_detect: true
  });
});
