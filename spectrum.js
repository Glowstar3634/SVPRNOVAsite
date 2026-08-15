(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const palette = ['#5267E8', '#94B1FF', '#FFFAEC', '#5A0A86'];
  const burstPalette = ['#ff4d5e', '#71ff90', '#67b6ff', '#ffd54a'];

  const hexToRgb = (hex) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const value = parseInt(full, 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  };

  const mixHex = (from, to, amount) => {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const m = clamp(amount, 0, 1);
    const c = {
      r: Math.round(a.r + (b.r - a.r) * m),
      g: Math.round(a.g + (b.g - a.g) * m),
      b: Math.round(a.b + (b.b - a.b) * m),
    };
    return `rgb(${c.r}, ${c.g}, ${c.b})`;
  };

  const rotate3D = ([x, y, z], ax, ay, az) => {
    let c = Math.cos(ax), s = Math.sin(ax);
    let ny = y * c - z * s;
    let nz = y * s + z * c;
    y = ny; z = nz;
    c = Math.cos(ay); s = Math.sin(ay);
    let nx = x * c + z * s;
    nz = -x * s + z * c;
    x = nx; z = nz;
    c = Math.cos(az); s = Math.sin(az);
    nx = x * c - y * s;
    ny = x * s + y * c;
    return [nx, ny, z];
  };

  const projectPoint = ([x, y, z], center, scale) => {
    const perspective = 2.4 / (2.4 - z);
    return { x: center.x + x * scale * perspective, y: center.y + y * scale * perspective, z };
  };

  const lineDistance = (px, py, ax, ay, bx, by) => {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const len2 = abx * abx + aby * aby || 1;
    const t = clamp((apx * abx + apy * aby) / len2, 0, 1);
    const x = ax + abx * t;
    const y = ay + aby * t;
    return { x, y, d: Math.hypot(px - x, py - y) };
  };

  const mount = (canvas) => {
    if (!canvas || canvas.dataset.spectrumMounted === 'true') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.dataset.spectrumMounted = 'true';

    let nodes = [];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let lastTime = 0;
    const pointer = { x: 0, y: 0, active: false };

    const makeNode = (index) => {
      const angle = Math.random() * Math.PI * 2;
      const ring = 0.13 + Math.pow(Math.random(), .82) * .38;
      return {
        x: .5 + Math.cos(angle) * ring,
        y: .5 + Math.sin(angle) * ring,
        vx: (Math.random() - .5) * .00017,
        vy: (Math.random() - .5) * .00017,
        r: 1.35 + Math.random() * 2.5,
        group: index % palette.length,
        phase: Math.random() * Math.PI * 2,
        tintColor: palette[index % palette.length],
        tintStrength: 0,
      };
    };

    const prism = {
      rotX: .48,
      rotY: .18,
      rotZ: .05,
      speedX: .0024,
      speedY: .0043,
      speedZ: .0016,
      boost: 0,
      active: false,
      burstStart: -10000,
      incomingDuration: 255,
      outgoingDuration: 330,
      nextBurst: 2400,
      incomingStart: null,
      rays: [],
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!nodes.length) nodes = Array.from({ length: 58 }, (_, i) => makeNode(i));
    };

    const randomEdgePoint = () => {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) return { x: Math.random() * width, y: 0 };
      if (side === 1) return { x: width, y: Math.random() * height };
      if (side === 2) return { x: Math.random() * width, y: height };
      return { x: 0, y: Math.random() * height };
    };

    const triggerBurst = (time) => {
      prism.active = true;
      prism.burstStart = time;
      prism.incomingStart = randomEdgePoint();
      prism.boost = 0; // acceleration starts only after the white beam arrives.
      prism.nextBurst = time + 4000; // start-to-start cadence: one incoming beam every 4s.
      prism.rays = Array.from({ length: 4 }, (_, index) => ({
        angle: Math.random() * Math.PI * 2,
        color: burstPalette[index],
        length: Math.max(width, height) * (0.42 + Math.random() * .32),
      }));
    };

    const scheduleBurst = (now) => { prism.nextBurst = now + 4000; };

    const draw = (time = 0) => {
      const dt = clamp(time - lastTime || 16.67, 8, 34);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      if (!reduceMotion && time >= prism.nextBurst && !prism.active) triggerBurst(time);
      const elapsed = time - prism.burstStart;
      const outgoingStart = prism.incomingDuration;
      const outgoingEnd = prism.incomingDuration + prism.outgoingDuration;
      if (prism.active && elapsed > outgoingEnd + 220) {
        prism.active = false;
      }

      const inIncoming = prism.active && elapsed >= 0 && elapsed < prism.incomingDuration;
      const inOutgoing = prism.active && elapsed >= outgoingStart && elapsed < outgoingEnd;
      const prismEnergy = inIncoming ? clamp(elapsed / prism.incomingDuration, 0, 1) * .35
        : inOutgoing ? 1 - (elapsed - outgoingStart) / prism.outgoingDuration * .12 : 0;
      const boostTarget = inOutgoing ? 1 : 0;
      prism.boost += (boostTarget - prism.boost) * .18;

      if (!reduceMotion) {
        prism.rotX += prism.speedX * (1 + prism.boost * 3.2);
        prism.rotY += prism.speedY * (1 + prism.boost * 3.6);
        prism.rotZ += prism.speedZ * (1 + prism.boost * 2.2);
      }

      const center = { x: width * .5, y: height * .5 };

      nodes.forEach((node) => {
        if (reduceMotion) return;

        // Outside a burst, points simply drift from wherever the previous burst
        // left them. There is deliberately NO stored home position to return to.
        if (!inOutgoing) {
          const frameScale = dt / 16.67;
          node.x += node.vx * frameScale;
          node.y += node.vy * frameScale;
          if (node.x < .06 || node.x > .94) node.vx *= -1;
          if (node.y < .06 || node.y > .94) node.vy *= -1;
          node.x = clamp(node.x, .06, .94);
          node.y = clamp(node.y, .06, .94);

          if (pointer.active) {
            const px = pointer.x / width;
            const py = pointer.y / height;
            const dx = px - node.x;
            const dy = py - node.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < .045 && dist2 > .0001) {
              node.x -= dx * .0018;
              node.y -= dy * .0018;
            }
          }
          return;
        }

        // During a color burst EVERY point selects the closest ray, adopts that
        // ray's color, and moves toward it. The capped speed prevents compaction.
        let best = null;
        let bestDistance = Infinity;
        prism.rays.forEach((ray) => {
          const endX = center.x + Math.cos(ray.angle) * ray.length;
          const endY = center.y + Math.sin(ray.angle) * ray.length;
          const closest = lineDistance(node.x * width, node.y * height, center.x, center.y, endX, endY);
          if (closest.d < bestDistance) {
            bestDistance = closest.d;
            best = { ray, closest };
          }
        });

        if (best) {
          node.tintColor = best.ray.color;
          node.tintStrength = 1;
          const targetX = best.closest.x / width;
          const targetY = best.closest.y / height;
          const dx = targetX - node.x;
          const dy = targetY - node.y;
          const distance = Math.hypot(dx, dy) || 1;
          const maxStep = dt * 0.00015;
          const step = Math.min(distance, maxStep);
          node.x += dx / distance * step;
          node.y += dy / distance * step;
          node.x = clamp(node.x, .06, .94);
          node.y = clamp(node.y, .06, .94);
        }
      });

      // Network links.
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const distance = Math.hypot(dx, dy);
          const threshold = Math.min(width, height) * .17;
          if (distance > threshold) continue;
          const alpha = (1 - distance / threshold) * .11;
          ctx.beginPath();
          ctx.moveTo(a.x * width, a.y * height);
          ctx.lineTo(b.x * width, b.y * height);
          ctx.strokeStyle = `rgba(148,177,255,${alpha})`;
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }

      const prismScale = Math.min(width, height) * .12;
      const vertices = [[0,-1.15,0],[-1,.95,-.7],[1,.95,-.7],[0,.95,1.1]]
        .map((v) => rotate3D(v, prism.rotX, prism.rotY, prism.rotZ));
      const projected = vertices.map((v) => projectPoint(v, center, prismScale));
      const faces = [[0,1,2],[0,2,3],[0,3,1],[1,3,2]]
        .map((indices) => ({ indices, depth: indices.reduce((sum, i) => sum + projected[i].z, 0) / 3 }))
        .sort((a,b) => a.depth - b.depth);

      // White input beam stays visible while the color fan is active.
      if ((inIncoming || inOutgoing) && prism.incomingStart) {
        const progress = inIncoming ? clamp(elapsed / prism.incomingDuration, 0, 1) : 1;
        ctx.save();
        ctx.strokeStyle = `rgba(255,255,255,${inOutgoing ? .92 : (.5 + progress * .5)})`;
        ctx.lineWidth = 6.6;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 34;
        ctx.shadowColor = 'white';
        ctx.beginPath();
        ctx.moveTo(prism.incomingStart.x, prism.incomingStart.y);
        ctx.lineTo(
          prism.incomingStart.x + (center.x - prism.incomingStart.x) * progress,
          prism.incomingStart.y + (center.y - prism.incomingStart.y) * progress,
        );
        ctx.stroke();
        ctx.restore();
      }

      // Four expanding triangular beams.
      if (inOutgoing) {
        const progress = clamp((elapsed - outgoingStart) / prism.outgoingDuration, 0, 1);
        prism.rays.forEach((ray) => {
          const endX = center.x + Math.cos(ray.angle) * ray.length * progress;
          const endY = center.y + Math.sin(ray.angle) * ray.length * progress;
          const nx = Math.cos(ray.angle + Math.PI / 2);
          const ny = Math.sin(ray.angle + Math.PI / 2);
          const baseHalf = 12 + 56 * progress;
          ctx.save();
          ctx.fillStyle = ray.color;
          ctx.globalAlpha = .92 - progress * .34;
          ctx.shadowBlur = 40;
          ctx.shadowColor = ray.color;
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(endX + nx * baseHalf, endY + ny * baseHalf);
          ctx.lineTo(endX - nx * baseHalf, endY - ny * baseHalf);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      faces.forEach((face) => {
        ctx.beginPath();
        const first = projected[face.indices[0]];
        ctx.moveTo(first.x, first.y);
        face.indices.slice(1).forEach((idx) => ctx.lineTo(projected[idx].x, projected[idx].y));
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${.05 + prismEnergy * .08})`;
        ctx.strokeStyle = `rgba(210,235,255,${.28 + prismEnergy * .32})`;
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      });

      // Prism glow rises as the incoming white beam reaches the prism, then ends.
      const prismGlow = inIncoming ? (.18 + Math.pow(clamp(elapsed / prism.incomingDuration, 0, 1), 2.35) * 1.95) : 0;
      if (prismGlow > 0) {
        ctx.save();
        const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, prismScale * 2.4);
        glow.addColorStop(0, `rgba(255,255,255,${.22 * prismGlow})`);
        glow.addColorStop(.25, `rgba(148,177,255,${.16 * prismGlow})`);
        glow.addColorStop(.55, `rgba(82,103,232,${.09 * prismGlow})`);
        glow.addColorStop(1, 'rgba(82,103,232,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(center.x, center.y, prismScale * 2.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const edges = [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
      ctx.save();
      ctx.strokeStyle = `rgba(255,250,236,${.72 + prismEnergy * .18})`;
      ctx.lineWidth = 1.15;
      ctx.shadowBlur = 12 + prismEnergy * 20;
      ctx.shadowColor = 'rgba(148,177,255,.7)';
      edges.forEach(([a,b]) => {
        ctx.beginPath();
        ctx.moveTo(projected[a].x, projected[a].y);
        ctx.lineTo(projected[b].x, projected[b].y);
        ctx.stroke();
      });
      ctx.restore();

      nodes.forEach((node) => {
        const pulse = reduceMotion ? 1 : .88 + Math.sin(time * .0018 + node.phase) * .12;
        const baseColor = palette[node.group];
        const color = node.tintStrength > .01 ? mixHex(baseColor, node.tintColor, node.tintStrength) : baseColor;
        ctx.beginPath();
        ctx.arc(node.x * width, node.y * height, node.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = node.r > 2.6 ? 16 : 8;
        ctx.shadowColor = color;
        ctx.globalAlpha = .92;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.shadowBlur = 0;

      if (!reduceMotion) requestAnimationFrame(draw);
    };

    resize();
    prism.nextBurst = 1800;
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });
    canvas.addEventListener('pointerleave', () => { pointer.active = false; });
    if (reduceMotion) draw(0); else requestAnimationFrame(draw);
  };

  window.SVPRSpectrum = { mount };
})();
