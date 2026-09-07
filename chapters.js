(() => {
  const view = document.getElementById('chapters-view');
  const scene = document.querySelector('.chapters-v32-scene');
  const svg = document.getElementById('chapters-v32-lines');
  if (!view || !scene || !svg) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const depthNodes = [...view.querySelectorAll('[data-chapter-depth]')];
  const graphNodes = new Map(
    [...scene.querySelectorAll('[data-node-id]')].map((el) => [el.dataset.nodeId, el])
  );

  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;

  window.addEventListener('pointermove', (event) => {
    tx = (event.clientX / Math.max(1, window.innerWidth) - .5) * 2;
    ty = (event.clientY / Math.max(1, window.innerHeight) - .5) * 2;
  }, { passive: true });

  const edges = [
    // Network ecosystem
    ['C0','C1','major',-.06], ['C0','C2','major',.06], ['C0','C3','major',-.08], ['C0','C4','major',.06], ['C0','C5','major',-.08], ['C0','C6','major',.06],
    ['C2','C3','secondary',.05], ['C2','C4','secondary',.08], ['C3','C4','secondary',-.07], ['C5','C3','secondary',.08],
    ['C4','C9','secondary',.11], ['C6','C7','secondary',-.08], ['C7','C8','secondary',.07], ['C8','C9','secondary',-.08],
    ['C4','C10','secondary',-.06], ['C6','C10','secondary',.05],
    ['C1','C4','major',-.05], ['C1','C6','major',.06], ['C1','C7','major',.08], ['C1','C8','major',-.10],

    // University cluster's direct relationship to the same network
    ['C0','U0','spine',-.13], ['C1','U0','major',.08], ['C4','U0','secondary',.13], ['C2','U0','secondary',-.11],
    ['U0','U1','major',-.04], ['U0','U2','secondary',.06], ['U0','U3','secondary',-.06], ['U0','U4','secondary',.07],
    ['U0','U5','secondary',-.07], ['U0','U6','secondary',.05], ['U0','U7','secondary',-.05], ['U0','U8','major',.07], ['U0','U9','secondary',-.06],
    ['U1','U5','secondary',.05], ['U1','U6','secondary',-.04], ['U1','U8','major',-.09],
    ['U5','U7','secondary',.05], ['U6','U9','secondary',.09], ['U8','U11','secondary',.07], ['U8','U12','major',-.06],
    ['U2','U12','secondary',.06], ['U3','U12','secondary',-.08], ['U4','U12','secondary',.05], ['U10','U8','secondary',-.08], ['U11','U12','secondary',.04],

    // Research hubs connect directly back to the network, not beneath universities
    ['C0','H0','spine',.18], ['C1','H0','major',-.14], ['C2','H0','secondary',.16], ['C6','H0','secondary',-.13],
    ['H0','H1','secondary',.05], ['H0','H2','major',-.05], ['H0','H3','secondary',.06], ['H0','H4','major',-.06],
    ['H0','H5','secondary',.05], ['H0','H6','major',-.05], ['H0','H7','secondary',.07], ['H0','H8','secondary',-.06],
    ['H1','H2','secondary',.05], ['H1','H5','secondary',-.08], ['H2','H7','secondary',.08], ['H3','H6','secondary',-.09],
    ['H3','H7','secondary',.05], ['H4','H5','secondary',.07], ['H4','H8','secondary',-.08], ['H5','H6','secondary',.05], ['H7','H8','secondary',-.05],

    // Sparse bridges show collaboration without organizational hierarchy
    ['U5','H7','cross',.20], ['U8','H4','cross',-.18], ['U12','H0','cross',.14],
  ];

  const edgeObjects = edges.map(([fromId, toId, type, curve]) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add(type, 'drawn');
    svg.appendChild(path);
    return { from: graphNodes.get(fromId), to: graphNodes.get(toId), path, curve };
  }).filter((edge) => edge.from && edge.to);

  const stellarCenter = (el, sceneRect) => {
    const anchor = el.querySelector('.chapter-v32-dot') || el;
    const rect = anchor.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - sceneRect.left,
      y: rect.top + rect.height / 2 - sceneRect.top,
    };
  };

  const updateLines = () => {
    if (view.hidden || scene.offsetParent === null) return;
    const sceneRect = scene.getBoundingClientRect();
    if (!sceneRect.width || !sceneRect.height) return;
    const vb = svg.viewBox.baseVal;
    const sx = vb.width / sceneRect.width;
    const sy = vb.height / sceneRect.height;

    edgeObjects.forEach(({ from, to, path, curve }) => {
      const a = stellarCenter(from, sceneRect);
      const b = stellarCenter(to, sceneRect);
      const x1 = a.x * sx;
      const y1 = a.y * sy;
      const x2 = b.x * sx;
      const y2 = b.y * sy;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const cx = mx - dy * curve;
      const cy = my + dx * curve;
      path.setAttribute('d', `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
    });
  };

  const revealTargets = [...view.querySelectorAll('.chapter-v32-reveal')];
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  const tick = () => {
    if (!reduceMotion) {
      px += (tx - px) * .052;
      py += (ty - py) * .052;
    }

    if (!view.hidden) {
      depthNodes.forEach((node) => {
        const depth = Number(node.dataset.chapterDepth || .12);
        const scale = node.matches('.chapters-v32-copy,.chapter-v32-annotation,.chapters-v32-intro,.chapters-v32-whisper') ? .62 : 1;
        node.style.setProperty('--cp-x', `${-px * 76 * depth * scale}px`);
        node.style.setProperty('--cp-y', `${-py * 54 * depth * scale}px`);
      });
      updateLines();
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  window.addEventListener('resize', () => requestAnimationFrame(updateLines), { passive: true });
  window.addEventListener('scroll', () => requestAnimationFrame(updateLines), { passive: true });
})();
