(() => {
  const view = document.getElementById('join-view');
  if (!view) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  // -------------------------------------------------------------------------
  // Hero route console — one guide star orbits the core, then migrates to and
  // orbits whichever route the visitor is considering.
  // -------------------------------------------------------------------------
  const consoleEl = document.getElementById('join-route-console');
  const consoleCore = document.getElementById('join-console-core');
  const guideStar = document.getElementById('join-guide-star');
  const status = document.getElementById('join-console-status');
  const routeNodes = consoleEl ? [...consoleEl.querySelectorAll('[data-join-route]')] : [];
  const defaultStatus = 'SELECT A PATH / NETWORK READY';
  let guideTarget = consoleCore;

  const setGuideTarget = (target, label) => {
    guideTarget = target || consoleCore;
    if (status) status.textContent = label || defaultStatus;
    consoleEl?.classList.toggle('route-hovered', guideTarget !== consoleCore);
  };

  routeNodes.forEach((node) => {
    node.addEventListener('mouseenter', () => setGuideTarget(node, `${node.dataset.joinRoute} / ROUTE IDENTIFIED`));
    node.addEventListener('mouseleave', () => setGuideTarget(consoleCore, defaultStatus));
    node.addEventListener('focus', () => setGuideTarget(node, `${node.dataset.joinRoute} / ROUTE IDENTIFIED`));
    node.addEventListener('blur', () => setGuideTarget(consoleCore, defaultStatus));
  });

  const guide = { x:0, y:0, rx:76, ry:76, angle:0, initialized:false, lastTime:0 };

  const targetGeometry = (target) => {
    if (!consoleEl || !target) return null;
    const container = consoleEl.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    if (!container.width || !rect.width) return null;
    const isCore = target === consoleCore;
    return {
      x: rect.left + rect.width / 2 - container.left,
      y: rect.top + rect.height / 2 - container.top,
      rx: isCore ? rect.width / 2 + 18 : rect.width / 2 + 15,
      ry: isCore ? rect.height / 2 + 18 : rect.height / 2 + 15,
    };
  };

  // -------------------------------------------------------------------------
  // Personalized pathway — parallax, cycling questions, and traveling traces.
  // -------------------------------------------------------------------------
  const map = document.getElementById('join-pathway-map');
  const depthNodes = map ? [...map.querySelectorAll('[data-path-depth]')] : [];
  const pathwayCore = map?.querySelector('.pathway-core');
  const pathwayQuestion = pathwayCore?.querySelector('strong');
  const pathwayNodes = map ? [...map.querySelectorAll('.pathway-node')] : [];
  const signalLayer = document.getElementById('pathway-signal-layer');
  let pathTx = 0, pathTy = 0, pathPx = 0, pathPy = 0;
  const pathwayParticles = [];
  let lastPathSpawn = 0;

  const questionBank = [
    'Could artificial intelligence discover new mathematics?',
    'What fundamentally limits the maximum lifespan of a human cell?',
    'Can quantum systems be engineered to correct their own errors?',
    'Is there an optimal way to trade material for position in chess?',
    'Which offensive structure maximizes expected points against a given football defense?',
    'Can cities reduce energy demand without reducing quality of life?',
    'How can swarms of simple robots produce complex collective behavior?',
    'What makes misinformation spread faster than its correction?',
    'Can useful new materials be computationally designed before they are synthesized?'
  ];
  let questionIndex = 0;

  if (map && !reduceMotion) {
    map.addEventListener('pointermove', (event) => {
      const rect = map.getBoundingClientRect();
      pathTx = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
      pathTy = ((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
    }, { passive:true });
    map.addEventListener('pointerleave', () => { pathTx = 0; pathTy = 0; }, { passive:true });
  }

  const centerIn = (element, container) => {
    if (!element || !container) return { x:0, y:0 };
    const cr = container.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - cr.left,
      y: rect.top + rect.height / 2 - cr.top,
    };
  };

  const pickDistinctNodes = (count = 3) => {
    const pool = [...pathwayNodes];
    const picked = [];
    while (pool.length && picked.length < count) {
      picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picked;
  };

  const spawnPathwayParticle = (time) => {
    if (!signalLayer || !pathwayCore || pathwayNodes.length < 3 || view.hidden) return;
    const star = document.createElement('span');
    star.className = 'pathway-trace-star';
    signalLayer.appendChild(star);
    const route = [pathwayCore, ...pickDistinctNodes(3), pathwayCore];
    pathwayParticles.push({
      el: star,
      route,
      start: time,
      curve: Array.from({length:4}, () => (Math.random() * 24 + 10) * (Math.random() < .5 ? -1 : 1)),
    });
  };

  const updatePathwayParticles = (time) => {
    if (!map) return;
    if (!view.hidden && !reduceMotion && time - lastPathSpawn >= 1200) {
      lastPathSpawn = time;
      spawnPathwayParticle(time);
    }

    for (let i = pathwayParticles.length - 1; i >= 0; i--) {
      const particle = pathwayParticles[i];
      const elapsed = time - particle.start;
      if (elapsed >= 4000 || view.hidden) {
        particle.el.remove();
        pathwayParticles.splice(i, 1);
        continue;
      }

      const segment = Math.min(3, Math.floor(elapsed / 1000));
      const local = (elapsed - segment * 1000) / 1000;
      const smooth = local * local * (3 - 2 * local);
      const a = centerIn(particle.route[segment], map);
      const b = centerIn(particle.route[segment + 1], map);
      let x = lerp(a.x, b.x, smooth);
      let y = lerp(a.y, b.y, smooth);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const arc = Math.sin(Math.PI * smooth) * particle.curve[segment];
      x += (-dy / length) * arc;
      y += ( dx / length) * arc;

      // Each new discipline contact increases the traveler's luminosity.
      const brightness = 1 + segment * .34 + local * .16;
      const finalFade = segment === 3 ? 1 - clamp((local - .72) / .28, 0, 1) : 1;
      particle.el.style.transform = `translate3d(${x - 3.5}px,${y - 3.5}px,0) scale(${1 + segment * .07})`;
      particle.el.style.opacity = String(finalFade);
      particle.el.style.filter = `brightness(${brightness})`;
      particle.el.style.boxShadow = `0 0 ${12 + segment * 7}px rgba(255,255,255,.95), 0 0 ${24 + segment * 10}px rgba(148,177,255,.7)`;
    }
  };

  const rotateQuestion = () => {
    if (!pathwayQuestion || view.hidden) return;
    pathwayCore?.classList.add('question-changing');
    window.setTimeout(() => {
      questionIndex = (questionIndex + 1) % questionBank.length;
      pathwayQuestion.textContent = questionBank[questionIndex];
      pathwayCore?.classList.remove('question-changing');
    }, 320);
  };
  window.setInterval(rotateQuestion, 6000);

  // -------------------------------------------------------------------------
  // Institutional Access — exact connector geometry and flowing capability
  // icons that travel from the institution into each member node.
  // -------------------------------------------------------------------------
  const institutionMap = view.querySelector('.institutional-map');
  const institutionRoot = institutionMap?.querySelector('.institution-root');
  const institutionPeople = institutionMap ? [...institutionMap.querySelectorAll('.institution-person')] : [];
  const institutionSvg = document.getElementById('institution-lines-svg');
  const institutionFlowLayer = document.getElementById('institution-flow-layer');
  let institutionEdges = [];
  const institutionParticles = [];
  let lastInstitutionSpawn = 0;

  const iconSvgs = [
    '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="5.2"/><path d="M14 14l5 5"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M17.5 4H7l5 8-5 8h10.5"/></svg>',
    '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="3.7"/><ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h3M13 13h3M8 16h3"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="7" r="2.2"/><circle cx="18" cy="17" r="2.2"/><path d="M8 11l7.8-3M8 13l7.8 3"/></svg>'
  ];

  const updateInstitutionGeometry = () => {
    if (!institutionMap || !institutionRoot || !institutionSvg || !institutionPeople.length || view.hidden) return;
    const mapRect = institutionMap.getBoundingClientRect();
    if (!mapRect.width || !mapRect.height) return;
    institutionSvg.setAttribute('viewBox', `0 0 ${mapRect.width} ${mapRect.height}`);
    institutionSvg.innerHTML = '';

    const rootRect = institutionRoot.getBoundingClientRect();
    const source = {
      x: rootRect.left + rootRect.width / 2 - mapRect.left,
      y: rootRect.bottom - mapRect.top,
    };

    institutionEdges = institutionPeople.map((person, index) => {
      const dot = person.querySelector('i');
      const dotRect = dot.getBoundingClientRect();
      const end = {
        x: dotRect.left + dotRect.width / 2 - mapRect.left,
        y: dotRect.top + dotRect.height / 2 - mapRect.top,
      };
      const spread = (index - (institutionPeople.length - 1) / 2) * 12;
      const control = {
        x: (source.x + end.x) / 2 + spread,
        y: source.y + (end.y - source.y) * .42,
      };
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${source.x.toFixed(2)} ${source.y.toFixed(2)} Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`);
      path.classList.add('institution-connector-path');
      institutionSvg.appendChild(path);
      return { source, control, end };
    });
  };

  const quadPoint = (edge, t) => {
    const u = 1 - t;
    return {
      x: u*u*edge.source.x + 2*u*t*edge.control.x + t*t*edge.end.x,
      y: u*u*edge.source.y + 2*u*t*edge.control.y + t*t*edge.end.y,
    };
  };

  const spawnInstitutionParticle = (time) => {
    if (!institutionFlowLayer || !institutionEdges.length || view.hidden) return;
    const el = document.createElement('span');
    el.className = 'institution-flow-icon';
    el.innerHTML = iconSvgs[Math.floor(Math.random() * iconSvgs.length)];
    institutionFlowLayer.appendChild(el);
    institutionParticles.push({
      el,
      edge: institutionEdges[Math.floor(Math.random() * institutionEdges.length)],
      start: time,
      duration: 1900 + Math.random() * 650,
    });
  };

  const updateInstitutionParticles = (time) => {
    if (!view.hidden && !reduceMotion && time - lastInstitutionSpawn >= 720) {
      lastInstitutionSpawn = time;
      spawnInstitutionParticle(time);
    }
    for (let i = institutionParticles.length - 1; i >= 0; i--) {
      const particle = institutionParticles[i];
      const progress = (time - particle.start) / particle.duration;
      if (progress >= 1 || view.hidden) {
        particle.el.remove();
        institutionParticles.splice(i, 1);
        continue;
      }
      const eased = progress * progress * (3 - 2 * progress);
      const p = quadPoint(particle.edge, eased);
      const fadeIn = clamp(progress / .12, 0, 1);
      const fadeOut = 1 - clamp((progress - .82) / .18, 0, 1);
      particle.el.style.transform = `translate3d(${p.x - 9}px,${p.y - 9}px,0) scale(${.86 + progress * .18})`;
      particle.el.style.opacity = String(fadeIn * fadeOut);
    }
  };

  // -------------------------------------------------------------------------
  // Shared animation loop.
  // -------------------------------------------------------------------------
  const tick = (time = 0) => {
    if (!view.hidden) {
      // Hero guide star
      if (guideStar && consoleEl && consoleCore) {
        const desired = targetGeometry(guideTarget || consoleCore);
        if (desired) {
          if (!guide.initialized || reduceMotion) {
            Object.assign(guide, desired, { initialized:true });
          } else {
            guide.x = lerp(guide.x, desired.x, .075);
            guide.y = lerp(guide.y, desired.y, .075);
            guide.rx = lerp(guide.rx, desired.rx, .075);
            guide.ry = lerp(guide.ry, desired.ry, .075);
          }
          const dt = guide.lastTime ? Math.min(40, time - guide.lastTime) : 16;
          guide.lastTime = time;
          if (!reduceMotion) guide.angle += dt * .00135;
          const x = guide.x + Math.cos(guide.angle) * guide.rx;
          const y = guide.y + Math.sin(guide.angle) * guide.ry;
          guideStar.style.transform = `translate3d(${x - 4}px,${y - 4}px,0)`;
        }
      }

      // Pathway parallax
      if (map && !reduceMotion) {
        pathPx += (pathTx - pathPx) * .055;
        pathPy += (pathTy - pathPy) * .055;
        depthNodes.forEach((node) => {
          const depth = Number(node.dataset.pathDepth || .12);
          node.style.setProperty('--path-px', `${-pathPx * 40 * depth}px`);
          node.style.setProperty('--path-py', `${-pathPy * 30 * depth}px`);
        });
      }

      if (!institutionEdges.length) updateInstitutionGeometry();
    }

    updatePathwayParticles(time);
    updateInstitutionParticles(time);
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  window.addEventListener('resize', () => { institutionEdges = []; requestAnimationFrame(updateInstitutionGeometry); }, { passive:true });
  document.fonts?.ready?.then(() => { institutionEdges = []; requestAnimationFrame(updateInstitutionGeometry); });
})();
