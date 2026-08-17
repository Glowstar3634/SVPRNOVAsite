(() => {
  const view = document.getElementById('join-view');
  if (!view) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const consoleEl = document.getElementById('join-route-console');
  const status = document.getElementById('join-console-status');
  consoleEl?.querySelectorAll('[data-join-route]').forEach((node) => {
    const defaultText = 'SELECT A PATH / NETWORK READY';
    node.addEventListener('mouseenter', () => {
      if (status) status.textContent = `${node.dataset.joinRoute} / ROUTE IDENTIFIED`;
      consoleEl.classList.add('route-hovered');
    });
    node.addEventListener('mouseleave', () => {
      if (status) status.textContent = defaultText;
      consoleEl.classList.remove('route-hovered');
    });
    node.addEventListener('focus', () => {
      if (status) status.textContent = `${node.dataset.joinRoute} / ROUTE IDENTIFIED`;
    });
    node.addEventListener('blur', () => { if (status) status.textContent = defaultText; });
  });

  const map = document.getElementById('join-pathway-map');
  const depthNodes = map ? [...map.querySelectorAll('[data-path-depth]')] : [];
  if (!map || reduceMotion) return;
  let tx = 0, ty = 0, px = 0, py = 0;
  map.addEventListener('pointermove', (event) => {
    const rect = map.getBoundingClientRect();
    tx = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
    ty = ((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
  }, { passive:true });
  map.addEventListener('pointerleave', () => { tx = 0; ty = 0; }, { passive:true });
  const tick = () => {
    px += (tx - px) * .055;
    py += (ty - py) * .055;
    depthNodes.forEach((node) => {
      const depth = Number(node.dataset.pathDepth || .12);
      node.style.setProperty('--path-px', `${-px * 40 * depth}px`);
      node.style.setProperty('--path-py', `${-py * 30 * depth}px`);
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
