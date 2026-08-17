(() => {
  const view = document.getElementById('chapters-view');
  if (!view) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const depthNodes = [...view.querySelectorAll('[data-chapter-depth]')];
  let px = 0, py = 0, tx = 0, ty = 0;

  window.addEventListener('pointermove', (event) => {
    tx = (event.clientX / window.innerWidth - .5) * 2;
    ty = (event.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  const heroMap = document.getElementById('chapter-hero-map');
  const heroSvg = document.getElementById('chapter-hero-lines');
  const heroCore = heroMap?.querySelector('.chapter-hero-core');
  const heroStars = heroMap ? [...heroMap.querySelectorAll('.chapter-hero-star')] : [];

  const globalMap = document.getElementById('global-network-map');
  const globalSvg = document.getElementById('global-network-lines');
  const platformCore = globalMap?.querySelector('.platform-core');
  const localClusters = globalMap ? [...globalMap.querySelectorAll('.local-cluster')] : [];

  const makeLine = (svg, secondary = false) => {
    if (!svg) return null;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    if (secondary) line.classList.add('secondary');
    svg.appendChild(line);
    return line;
  };

  const heroLinks = [];
  heroStars.forEach((star) => heroLinks.push({ from: heroCore, to: star, line: makeLine(heroSvg) }));
  [[0,7],[0,6],[1,2],[2,3],[3,4],[4,5],[5,6]].forEach(([a,b]) => {
    if (heroStars[a] && heroStars[b]) heroLinks.push({ from: heroStars[a], to: heroStars[b], line: makeLine(heroSvg, true) });
  });

  const globalLinks = [];
  localClusters.forEach((cluster) => globalLinks.push({ from: platformCore, to: cluster, line: makeLine(globalSvg) }));
  if (localClusters.length >= 3) {
    globalLinks.push({ from: localClusters[0], to: localClusters[1], line: makeLine(globalSvg, true) });
    globalLinks.push({ from: localClusters[0], to: localClusters[2], line: makeLine(globalSvg, true) });
    globalLinks.push({ from: localClusters[1], to: localClusters[2], line: makeLine(globalSvg, true) });
  }

  const anchorRect = (el) => {
    if (!el) return null;
    const anchor = el.querySelector?.('.star-dot') || el.querySelector?.('img') || el.querySelector?.('i') || el;
    return anchor.getBoundingClientRect();
  };

  const updateLines = (map, svg, links) => {
    if (!map || !svg || map.offsetParent === null) return;
    const mapRect = map.getBoundingClientRect();
    if (!mapRect.width || !mapRect.height) return;
    const vb = svg.viewBox.baseVal;
    const sx = vb.width / mapRect.width;
    const sy = vb.height / mapRect.height;
    links.forEach(({ from, to, line }) => {
      if (!from || !to || !line) return;
      const a = anchorRect(from);
      const b = anchorRect(to);
      if (!a || !b) return;
      line.setAttribute('x1', String((a.left + a.width / 2 - mapRect.left) * sx));
      line.setAttribute('y1', String((a.top + a.height / 2 - mapRect.top) * sy));
      line.setAttribute('x2', String((b.left + b.width / 2 - mapRect.left) * sx));
      line.setAttribute('y2', String((b.top + b.height / 2 - mapRect.top) * sy));
    });
  };

  const tick = () => {
    if (!reduceMotion) {
      px += (tx - px) * .052;
      py += (ty - py) * .052;
    }

    if (!view.hidden) {
      depthNodes.forEach((node) => {
        const depth = Number(node.dataset.chapterDepth || .15);
        node.style.setProperty('--cp-x', `${-px * 58 * depth}px`);
        node.style.setProperty('--cp-y', `${-py * 40 * depth}px`);
      });
      updateLines(heroMap, heroSvg, heroLinks);
      updateLines(globalMap, globalSvg, globalLinks);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
      updateLines(heroMap, heroSvg, heroLinks);
      updateLines(globalMap, globalSvg, globalLinks);
    });
  }, { passive: true });
})();
