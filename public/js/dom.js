let hamburgerOpen = document.getElementById('hamburgerOpen');
let hamburgerClose = document.getElementById('hamburgerClose');
let nav = document.querySelector('nav');

hamburgerOpen.addEventListener('click', () => {
  nav.style.display = 'block';
});

hamburgerClose.addEventListener('click', () => {
  nav.style.display = 'none';
});
