(() => {
  const cloud = document.querySelector('.about-question-cloud');
  if (!cloud) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  const pills = [...cloud.querySelectorAll('.about-question-pill')];
  let tx = 0, ty = 0, px = 0, py = 0;
  cloud.addEventListener('pointermove', (event) => {
    const rect = cloud.getBoundingClientRect();
    tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });
  cloud.addEventListener('pointerleave', () => { tx = 0; ty = 0; }, { passive: true });
  const tick = () => {
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;
    pills.forEach((pill, index) => {
      const depth = 0.5 + index * 0.12;
      pill.style.setProperty('--qx', `${-px * 12 * depth}px`);
      pill.style.setProperty('--qy', `${-py * 9 * depth}px`);
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
