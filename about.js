(() => {
  const cloud = document.querySelector('.about-question-cloud');
  if (!cloud) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pills = [...cloud.querySelectorAll('.about-question-pill')];

  // Each thought gets its own elliptical trajectory, direction, phase and pace.
  // Their opacity animation is separate in CSS, so they appear/disappear at
  // irregular intervals while continuing to circulate around the central idea.
  const orbits = [
    { rx: .91, ry: .76, speed: .000095, phase: .35,  dir:  1, tilt: -.20 },
    { rx: .82, ry: .94, speed: .000068, phase: 2.25, dir: -1, tilt:  .31 },
    { rx: .98, ry: .70, speed: .000118, phase: 4.10, dir:  1, tilt:  .12 },
    { rx: .78, ry: .96, speed: .000081, phase: 5.20, dir: -1, tilt: -.34 },
    { rx: .94, ry: .82, speed: .000058, phase: 3.10, dir:  1, tilt:  .25 },
  ];

  if (reduceMotion) {
    pills.forEach((pill, i) => {
      const a = orbits[i]?.phase || 0;
      pill.style.setProperty('--thought-x', `${Math.cos(a) * 250}px`);
      pill.style.setProperty('--thought-y', `${Math.sin(a) * 175}px`);
    });
    return;
  }

  let tx = 0, ty = 0, px = 0, py = 0;
  cloud.addEventListener('pointermove', (event) => {
    const rect = cloud.getBoundingClientRect();
    tx = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
    ty = ((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
  }, { passive: true });
  cloud.addEventListener('pointerleave', () => { tx = 0; ty = 0; }, { passive: true });

  const tick = (time = 0) => {
    px += (tx - px) * .045;
    py += (ty - py) * .045;
    const rect = cloud.getBoundingClientRect();
    const usableX = Math.max(240, rect.width * .5 - 118);
    const usableY = Math.max(175, rect.height * .5 - 78);

    pills.forEach((pill, index) => {
      const o = orbits[index] || orbits[0];
      const angle = o.phase + time * o.speed * o.dir;
      const ex = Math.cos(angle) * usableX * o.rx;
      const ey = Math.sin(angle) * usableY * o.ry;
      const x = ex * Math.cos(o.tilt) - ey * Math.sin(o.tilt);
      const y = ex * Math.sin(o.tilt) + ey * Math.cos(o.tilt);
      const depth = .55 + index * .09;
      pill.style.setProperty('--thought-x', `${x - px * 10 * depth}px`);
      pill.style.setProperty('--thought-y', `${y - py * 8 * depth}px`);
    });

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
