let hamburgerOpen = document.getElementById('hamburgerOpen');
let hamburgerClose = document.getElementById('hamburgerClose');
let nav = document.querySelector('nav');

hamburgerOpen.addEventListener('click', () => {
  nav.style.opacity = 1;
});

hamburgerClose.addEventListener('click', () => {
  nav.style.opacity = 0;
});
