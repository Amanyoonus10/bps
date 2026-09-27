/**
 * BPS GLOBAL TRADING LLC — INTERACTIVE CORE
 * Full World Route Canvas, Radar, Filter System, Live Clock & RFQ Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initHeroMiniMap();
  initFullLogisticsMap();
  initProductFilter();
  initProductCarousel();
  initIndustriesCarousel();
  initCargoCalculator();
  initFaqFilters();
  initMobileNav();
  initMobileFloatingBar();
  initModalBackdrops();
});

/* ==========================================================================
   1. LIVE DUBAI GST TIME CLOCK
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('liveClockDisplay');
  const mobileClockEl = document.getElementById('mobileClockDisplay');
  if (!clockEl && !mobileClockEl) return;

  function update() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
    const formatted = `DXB ${timeStr} GST`;
    if (clockEl) clockEl.textContent = formatted;
    if (mobileClockEl) mobileClockEl.textContent = formatted;
  }
  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   2. HERO 3D INTERACTIVE ROTATING GLOBE (DELIVERING ACROSS DUBAI • MENA • CIS)
   ========================================================================== */
function initHeroMiniMap() {
  const canvas = document.getElementById('heroMiniMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let R = 115; // globe radius

  function resize() {
    width = container.clientWidth || 380;
    height = container.clientHeight || 280;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(width, height) * 0.44;
  }
  resize();
  window.addEventListener('resize', resize);

  // Helper: Convert Lat/Lon (degrees) to 3D Cartesian coordinates on unit sphere
  function latLonToVec3(latDeg, lonDeg) {
    const lat = latDeg * Math.PI / 180;
    const lon = lonDeg * Math.PI / 180;
    return {
      x: Math.cos(lat) * Math.sin(lon),
      y: -Math.sin(lat),
      z: Math.cos(lat) * Math.cos(lon)
    };
  }

  // Major Global Logistics Hubs (Exact Geographic Coordinates)
  const DUBAI = { name: 'DUBAI (HQ)', lat: 25.2048, lon: 55.2708 };
  const dubaiVec = latLonToVec3(DUBAI.lat, DUBAI.lon);

  const DESTINATIONS = [
    { name: 'ROTTERDAM', lat: 51.92, lon: 4.48 },
    { name: 'BAKU / CIS', lat: 40.40, lon: 49.86 },
    { name: 'SHANGHAI', lat: 31.23, lon: 121.47 },
    { name: 'SINGAPORE', lat: 1.35, lon: 103.82 },
    { name: 'MUMBAI', lat: 19.07, lon: 72.87 },
    { name: 'MOMBASA', lat: -4.04, lon: 39.66 },
    { name: 'HOUSTON', lat: 29.76, lon: -95.36 },
    { name: 'SANTOS', lat: -23.96, lon: -46.33 }
  ].map(d => ({ ...d, vec: latLonToVec3(d.lat, d.lon) }));

  // Great-circle Spherical Linear Interpolation (slerp)
  function slerp(v0, v1, t) {
    let dot = v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
    dot = Math.max(-1, Math.min(1, dot));
    const omega = Math.acos(dot);
    if (omega < 0.001) return v0;
    const sinOmega = Math.sin(omega);
    const a = Math.sin((1 - t) * omega) / sinOmega;
    const b = Math.sin(t * omega) / sinOmega;
    return {
      x: a * v0.x + b * v1.x,
      y: a * v0.y + b * v1.y,
      z: a * v0.z + b * v1.z
    };
  }

  // Precompute Great-circle 3D arc trajectories
  const arcCurves = DESTINATIONS.map((dest, idx) => {
    const pts = [];
    const segments = 24;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const v = slerp(dubaiVec, dest.vec, t);
      const alt = 1 + 0.18 * Math.sin(t * Math.PI);
      pts.push({
        x: v.x * alt,
        y: v.y * alt,
        z: v.z * alt
      });
    }
    return { dest, pts, idx };
  });

  // 3D Rotation helper
  function rotate3D(p, cosY, sinY, cosP, sinP) {
    // 1. Yaw around Y axis
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;
    // 2. Pitch around X axis
    const y2 = p.y * cosP - z1 * sinP;
    const z2 = p.y * sinP + z1 * cosP;
    return { x: x1, y: y2, z: z2 };
  }

  // Landmass Point Cloud Generator
  let globeDots = [];

  // Generate fallback land dots immediately so globe displays without waiting
  function generateFallbackDots() {
    const dots = [];
    const landCenters = [
      { lat: 48, lon: 15, r: 16 },      // Europe
      { lat: 56, lon: 50, r: 30 },      // CIS / Russia
      { lat: 24, lon: 47, r: 12 },      // Arabian Peninsula
      { lat: 25.2, lon: 55.3, r: 6 },   // UAE / Dubai Central Hub
      { lat: 20, lon: 78, r: 16 },      // South Asia / India
      { lat: 34, lon: 104, r: 24 },     // East Asia / China
      { lat: 4, lon: 108, r: 14 },      // Southeast Asia
      { lat: 5, lon: 20, r: 28 },       // Africa
      { lat: 40, lon: -100, r: 26 },    // North America
      { lat: -15, lon: -55, r: 22 },    // South America
      { lat: -25, lon: 135, r: 18 }     // Australia
    ];

    for (let lat = -80; lat <= 80; lat += 3.5) {
      const cosLat = Math.cos(lat * Math.PI / 180);
      const lonStep = 3.5 / Math.max(cosLat, 0.2);
      for (let lon = -180; lon < 180; lon += lonStep) {
        for (let i = 0; i < landCenters.length; i++) {
          const c = landCenters[i];
          const d = Math.hypot(lat - c.lat, (lon - c.lon) * cosLat);
          if (d < c.r) {
            dots.push(latLonToVec3(lat, lon));
            break;
          }
        }
      }
    }
    return dots;
  }
  globeDots = generateFallbackDots();

  // Load high-resolution authentic continent dot-matrix from hero-world-map.png
  // Calibrated to map projection: Prime Meridian at 578.88px, Equator at 326.92px, 3.1766 px/deg lon, 3.1703 px/deg lat
  const mapImg = new Image();
  mapImg.src = 'assets/img/hero-world-map.png';
  mapImg.onload = () => {
    try {
      const off = document.createElement('canvas');
      off.width = 120;
      off.height = 60;
      const octx = off.getContext('2d');
      octx.drawImage(mapImg, 0, 0, 120, 60);
      const imgData = octx.getImageData(0, 0, 120, 60).data;
      const sampledDots = [];
      for (let y = 0; y < 60; y++) {
        const yOrig = (y + 0.5) * 10;
        const latDeg = (326.92 - yOrig) / 3.1703;
        if (Math.abs(latDeg) > 83) continue;
        const latRad = latDeg * Math.PI / 180;
        const cosLat = Math.cos(latRad);
        const sinLat = Math.sin(latRad);

        for (let x = 0; x < 120; x++) {
          const idx = (y * 120 + x) * 4;
          const a = imgData[idx + 3];
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          if (a > 35 && (r > 30 || g > 30 || b > 30)) {
            const xOrig = (x + 0.5) * 10;
            const lonDeg = (xOrig - 578.88) / 3.1766;
            const lonRad = lonDeg * Math.PI / 180;
            sampledDots.push({
              x: cosLat * Math.sin(lonRad),
              y: -sinLat,
              z: cosLat * Math.cos(lonRad)
            });
          }
        }
      }
      if (sampledDots.length > 500) {
        globeDots = sampledDots;
      }
    } catch (e) {
      // Fallback dots already present
    }
  };

  // Precompute wireframe latitude/longitude rings
  const wireRings = [];
  [-45, 0, 45].forEach(latDeg => {
    const lat = latDeg * Math.PI / 180;
    const ring = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 24) {
      ring.push({
        x: Math.cos(lat) * Math.sin(a),
        y: -Math.sin(lat),
        z: Math.cos(lat) * Math.cos(a)
      });
    }
    wireRings.push(ring);
  });
  [0, Math.PI / 2].forEach(lonAngle => {
    const meridian = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 24) {
      meridian.push({
        x: Math.sin(a) * Math.cos(lonAngle),
        y: Math.cos(a),
        z: Math.sin(a) * Math.sin(lonAngle)
      });
    }
    wireRings.push(meridian);
  });

  // Butter-Smooth Physics & Pointer Damping
  let yaw = -0.965; // centered directly on Dubai / UAE (55.27°E)
  let pitch = 0.30; // elevated angle showcasing Dubai Hub, MENA, and global trade corridors
  let targetPitch = 0.30;
  const baseAutoSpeed = 0.0024;
  let targetYawVel = baseAutoSpeed;
  let yawVel = baseAutoSpeed;

  let dragVelX = 0;
  let dragVelY = 0;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseActive = false;

  // Track Mouse Pointer with Butter-Smooth Damping
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const dist = Math.hypot(dx, dy);
    mouseActive = dist < Math.max(window.innerWidth * 0.55, 600);

    if (isDragging) {
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      yaw += deltaX * 0.007;
      pitch = Math.max(-0.65, Math.min(0.65, pitch - deltaY * 0.007));
      dragVelX = deltaX * 0.004;
      dragVelY = -deltaY * 0.004;
      targetPitch = pitch;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (mouseActive) {
      // Smooth normalized coordinates relative to center
      const normX = Math.max(-1.4, Math.min(1.4, dx / (window.innerWidth * 0.35)));
      const normY = Math.max(-1.4, Math.min(1.4, dy / (window.innerHeight * 0.35)));

      // Pitch smoothly targets pointer vertical position accurately with mouse pointer
      targetPitch = 0.22 - normY * 0.35;

      // Yaw velocity smoothly steered by pointer horizontal offset
      targetYawVel = baseAutoSpeed + normX * 0.010;
    } else {
      targetYawVel = baseAutoSpeed;
      targetPitch = 0.22;
    }
  }, { passive: true });

  // Dragging support on canvas
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    dragVelX = 0;
    dragVelY = 0;
    targetPitch = pitch;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch support for mobile devices
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
      dragVelX = 0;
      dragVelY = 0;
      targetPitch = pitch;
    }
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - lastMouseX;
      const deltaY = e.touches[0].clientY - lastMouseY;
      yaw += deltaX * 0.008;
      pitch = Math.max(-0.65, Math.min(0.65, pitch - deltaY * 0.008));
      dragVelX = deltaX * 0.005;
      dragVelY = -deltaY * 0.005;
      targetPitch = pitch;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  let animTime = 0;

  // Main Render Loop
  function render() {
    animTime += 0.016;

    // Smooth inertia and rotation update
    if (isDragging) {
      // Direct drag manipulation
    } else {
      // Momentum decay after drag release
      dragVelX *= 0.92;
      dragVelY *= 0.92;
      yaw += dragVelX;
      pitch = Math.max(-0.65, Math.min(0.65, pitch + dragVelY));

      // Damped exponential filter for seamless pointer following
      yawVel += (targetYawVel - yawVel) * 0.05;
      yaw += yawVel;
      pitch += (targetPitch - pitch) * 0.05;
    }

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // 1. Atmosphere Glow behind the Globe
    const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R * 1.32);
    atmoGrad.addColorStop(0, 'rgba(0, 136, 255, 0.18)');
    atmoGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
    atmoGrad.addColorStop(1, 'rgba(0, 136, 255, 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.32, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Dark Glass Sphere Body
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    sphereGrad.addColorStop(0, 'rgba(14, 28, 62, 0.55)');
    sphereGrad.addColorStop(0.7, 'rgba(5, 14, 32, 0.85)');
    sphereGrad.addColorStop(1, 'rgba(2, 6, 16, 0.95)');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 3. Globe Edge Rim Ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Subtle Wireframe Latitude/Longitude Rings
    ctx.lineWidth = 0.8;
    wireRings.forEach(ring => {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < ring.length; i++) {
        const rp = rotate3D(ring[i], cosY, sinY, cosP, sinP);
        if (rp.z > -0.15) {
          const sx = cx + rp.x * R;
          const sy = cy + rp.y * R;
          if (first) {
            ctx.moveTo(sx, sy);
            first = false;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.12)';
      ctx.stroke();
    });

    // 5. Continent Dot-Matrix Point Cloud
    const dotCount = globeDots.length;
    for (let i = 0; i < dotCount; i++) {
      const p = rotate3D(globeDots[i], cosY, sinY, cosP, sinP);

      if (p.z > -0.18) {
        const sx = cx + p.x * R;
        const sy = cy + p.y * R;
        const alpha = Math.max(0.08, (p.z + 0.18) / 1.18);
        const dotRadius = p.z > 0 ? (1.15 + p.z * 0.75) : 0.9;

        // Luminous white country dots with depth-faded alpha
        ctx.fillStyle = p.z > 0
          ? `rgba(255, 255, 255, ${alpha * 0.95})`
          : `rgba(215, 230, 255, ${alpha * 0.35})`;

        ctx.beginPath();
        ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Precomputed 3D Trade Arcs
    const rotatedDubai = rotate3D(dubaiVec, cosY, sinY, cosP, sinP);

    arcCurves.forEach(arc => {
      ctx.beginPath();
      let started = false;
      const pts = arc.pts;

      for (let s = 0; s < pts.length; s++) {
        const rp = rotate3D(pts[s], cosY, sinY, cosP, sinP);
        if (rp.z > -0.1) {
          const sx = cx + rp.x * R;
          const sy = cy + rp.y * R;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          started = false;
        }
      }

      ctx.strokeStyle = 'rgba(235, 175, 65, 0.45)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Flowing Pulse Particle on Arc
      const particleT = (animTime * 0.45 + arc.idx * 0.125) % 1;
      const pv = slerp(dubaiVec, arc.dest.vec, particleT);
      const palt = 1 + 0.18 * Math.sin(particleT * Math.PI);
      const pRot = rotate3D({ x: pv.x * palt, y: pv.y * palt, z: pv.z * palt }, cosY, sinY, cosP, sinP);

      if (pRot.z > -0.05) {
        const px = cx + pRot.x * R;
        const py = cy + pRot.y * R;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE082';
        ctx.shadowColor = '#FFD54F';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Destination Node
      const rDest = rotate3D(arc.dest.vec, cosY, sinY, cosP, sinP);
      if (rDest.z > 0.05) {
        const dx = cx + rDest.x * R;
        const dy = cy + rDest.y * R;

        ctx.beginPath();
        ctx.arc(dx, dy, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB300';
        ctx.fill();
      }
    });

    // 7. Dubai Central Hub Pulse & Beacon
    if (rotatedDubai.z > -0.05) {
      const hx = cx + rotatedDubai.x * R;
      const hy = cy + rotatedDubai.y * R;

      // Concentric expanding pulse wave
      const pulseWave = (animTime * 1.5) % 1;
      const waveRadius = 6 + pulseWave * 16;
      const waveAlpha = 1 - pulseWave;

      ctx.beginPath();
      ctx.arc(hx, hy, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 93, 26, ${waveAlpha * 0.85})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Secondary inner pulse wave
      const pulseWave2 = (animTime * 1.5 + 0.5) % 1;
      const waveRadius2 = 6 + pulseWave2 * 16;
      const waveAlpha2 = 1 - pulseWave2;

      ctx.beginPath();
      ctx.arc(hx, hy, waveRadius2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 93, 26, ${waveAlpha2 * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Core Glowing Beacon
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#E85D1A';
      ctx.shadowColor = '#E85D1A';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Golden center point
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF3D4';
      ctx.fill();

      // Dubai Callout Tag Pill
      const tagText = 'DUBAI (HQ)';
      ctx.font = '700 10.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(tagText).width;
      const pillW = tw + 14;
      const pillH = 18;
      const pillY = hy - 18;

      // Pin pointer notch pointing to Dubai beacon
      ctx.beginPath();
      ctx.moveTo(hx, hy - 7);
      ctx.lineTo(hx - 4, pillY + pillH / 2);
      ctx.lineTo(hx + 4, pillY + pillH / 2);
      ctx.closePath();
      ctx.fillStyle = '#E85D1A';
      ctx.fill();

      // Pill container
      ctx.fillStyle = 'rgba(6, 12, 26, 0.92)';
      ctx.beginPath();
      ctx.roundRect(hx - pillW / 2, pillY - pillH / 2, pillW, pillH, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(232, 93, 26, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Pill text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tagText, hx, pillY);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   3. WHERE YOUR CARGO MOVES — FULL GLOBAL MAP CANVAS
   ========================================================================== */
function initFullLogisticsMap() {
  const canvas = document.getElementById('fullLogisticsMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  const hintLabel = document.getElementById('mapHintLabel');

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    width = container.clientWidth || 700;
    height = container.clientHeight || 480;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Dubai Hub location accurately aligned with global-reach-map.png (Dubai, UAE: 25.2°N, 55.3°E)
  const dubai = { 
    name: 'DUBAI (HQ)', 
    x: 0.478, 
    y: 0.413, 
    info: 'Global Hub: Jebel Ali (AEJEA) • 100,000+ Units Ready Stock • 24/7 Operations' 
  };

  const regions = [
    { 
      name: 'EUROPE', 
      x: 0.28, 
      y: 0.24, 
      ports: 'Rotterdam, Antwerp, Valencia, Genoa', 
      transit: '14–18 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'RUSSIA & CIS', 
      x: 0.48, 
      y: 0.21, 
      ports: 'Baku, Tashkent, Almaty, Aktau', 
      transit: '5–8 Days', 
      mode: 'Multimodal Road & Rail' 
    },
    { 
      name: 'MIDDLE EAST', 
      x: 0.42, 
      y: 0.42, 
      ports: 'Jeddah, Dammam, Sohar, Alexandria', 
      transit: '24–48 Hours', 
      mode: 'Direct Overland Trucking' 
    },
    { 
      name: 'AFRICA', 
      x: 0.35, 
      y: 0.54, 
      ports: 'Mombasa, Dar es Salaam, Durban', 
      transit: '7–12 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'CHINA', 
      x: 0.58, 
      y: 0.34, 
      ports: 'Shanghai, Ningbo, Qingdao, Shenzhen', 
      transit: '12–16 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'ASIA PACIFIC', 
      x: 0.56, 
      y: 0.54, 
      ports: 'Singapore, Port Klang, Jakarta', 
      transit: '8–12 Days', 
      mode: 'Express Sea Corridor' 
    },
    { 
      name: 'NORTH AMERICA', 
      x: 0.84, 
      y: 0.30, 
      ports: 'Houston, New Orleans, Savannah', 
      transit: '22–26 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'SOUTH AMERICA', 
      x: 0.88, 
      y: 0.67, 
      ports: 'Santos, Buenos Aires, Callao', 
      transit: '24–28 Days', 
      mode: 'Direct Ocean Freight' 
    }
  ];

  let hoveredRegion = null;
  let hoveredDubai = false;

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = width * dubai.x;
    const dy = height * dubai.y;

    if (Math.hypot(mx - dx, my - dy) < 22) {
      hoveredDubai = true;
      hoveredRegion = null;
      canvas.style.cursor = 'pointer';
      if (hintLabel) {
        hintLabel.innerHTML = `<strong>DUBAI CENTRAL STOCK:</strong> ${dubai.info}`;
      }
      return;
    } else {
      hoveredDubai = false;
    }

    let found = null;
    for (let i = 0; i < regions.length; i++) {
      const rx = width * regions[i].x;
      const ry = height * regions[i].y;
      if (Math.hypot(mx - rx, my - ry) < 24) {
        found = regions[i];
        break;
      }
    }

    hoveredRegion = found;
    canvas.style.cursor = found ? 'pointer' : 'default';

    if (hintLabel) {
      if (found) {
        hintLabel.innerHTML = `<strong>${found.name} CORRIDOR:</strong> ${found.ports} &bull; <span style="color:#38BDF8;">Transit: ${found.transit}</span> (${found.mode})`;
      } else {
        hintLabel.innerText = 'Hover any regional hub to view direct transit corridors & destinations';
      }
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredRegion = null;
    hoveredDubai = false;
    canvas.style.cursor = 'default';
    if (hintLabel) {
      hintLabel.innerText = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
        ? 'Tap any regional hub to view direct transit corridors & destinations'
        : 'Hover any regional hub to view direct transit corridors & destinations';
    }
  });

  // Touch support for Mobile / Tablets on World Logistics Map
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;

      const dx = width * dubai.x;
      const dy = height * dubai.y;

      if (Math.hypot(mx - dx, my - dy) < 28) {
        hoveredDubai = true;
        hoveredRegion = null;
        if (hintLabel) {
          hintLabel.innerHTML = `<strong>DUBAI CENTRAL STOCK:</strong> ${dubai.info}`;
        }
        return;
      } else {
        hoveredDubai = false;
      }

      let found = null;
      for (let i = 0; i < regions.length; i++) {
        const rx = width * regions[i].x;
        const ry = height * regions[i].y;
        if (Math.hypot(mx - rx, my - ry) < 30) {
          found = regions[i];
          break;
        }
      }

      hoveredRegion = found;
      if (hintLabel) {
        if (found) {
          hintLabel.innerHTML = `<strong>${found.name} CORRIDOR:</strong> ${found.ports} &bull; <span style="color:#38BDF8;">Transit: ${found.transit}</span> (${found.mode})`;
        } else {
          hintLabel.innerText = 'Tap any regional hub to view direct transit corridors & destinations';
        }
      }
    }
  }, { passive: true });

  let animOffset = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    animOffset += 0.007;

    const dx = width * dubai.x;
    const dy = height * dubai.y;

    // Curved golden rays radiating from DUBAI
    regions.forEach((r, idx) => {
      const rx = width * r.x;
      const ry = height * r.y;
      const isHovered = (hoveredRegion === r);

      const midX = (dx + rx) / 2;
      const midY = (dy + ry) / 2 - (isHovered ? 44 : 38);

      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.quadraticCurveTo(midX, midY, rx, ry);

      if (isHovered) {
        ctx.strokeStyle = '#FFA726';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = '#FF9800';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = 'rgba(235, 175, 65, 0.42)';
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flowing Pulse particle
      let t = (animOffset * (0.85 + idx * 0.14)) % 1;
      const px = (1 - t) * (1 - t) * dx + 2 * (1 - t) * t * midX + t * t * rx;
      const py = (1 - t) * (1 - t) * dy + 2 * (1 - t) * t * midY + t * t * ry;

      ctx.beginPath();
      ctx.arc(px, py, isHovered ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#FFFFFF' : '#FFD54F';
      ctx.shadowColor = '#FFC107';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Region node
      ctx.beginPath();
      ctx.arc(rx, ry, isHovered ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#FF6636' : '#FFB300';
      ctx.shadowColor = isHovered ? '#FF6636' : '#FFB300';
      ctx.shadowBlur = isHovered ? 14 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(rx, ry, 11, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 102, 54, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Region label pill
      ctx.font = '700 11px "Space Grotesk", sans-serif';
      const textWidth = ctx.measureText(r.name).width;
      ctx.fillStyle = isHovered ? 'rgba(10, 24, 52, 0.95)' : 'rgba(4, 10, 24, 0.82)';
      ctx.beginPath();
      ctx.roundRect(rx - textWidth / 2 - 7, ry - 24, textWidth + 14, 18, 5);
      ctx.fill();

      ctx.strokeStyle = isHovered ? 'rgba(255, 102, 54, 0.7)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isHovered ? '#FF9E66' : '#F1F5F9';
      ctx.textAlign = 'center';
      ctx.fillText(r.name, rx, ry - 11);
    });

    // Central DUBAI Node & Radiant Hub Beacon
    ctx.beginPath();
    ctx.arc(dx, dy, hoveredDubai ? 9 : 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E85D1A';
    ctx.shadowColor = '#E85D1A';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing core
    ctx.beginPath();
    ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE082';
    ctx.fill();

    // Radiating concentric pulse rings
    const ringR = 14 + Math.sin(Date.now() * 0.005) * 5;
    ctx.beginPath();
    ctx.arc(dx, dy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(232, 93, 26, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const ringR2 = 23 + Math.sin(Date.now() * 0.003) * 7;
    ctx.beginPath();
    ctx.arc(dx, dy, ringR2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(232, 93, 26, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Dubai text pill
    ctx.font = '800 12px "Space Grotesk", sans-serif';
    const dubaiWidth = ctx.measureText('DUBAI (HQ)').width;
    ctx.fillStyle = 'rgba(4, 10, 26, 0.92)';
    ctx.beginPath();
    ctx.roundRect(dx - dubaiWidth / 2 - 8, dy + 13, dubaiWidth + 16, 21, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 93, 26, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#FF7A38';
    ctx.textAlign = 'center';
    ctx.fillText('DUBAI (HQ)', dx, dy + 28);

    requestAnimationFrame(draw);
  }
  draw();
}

/* ==========================================================================
   4. PRODUCT CATEGORY FILTER SYSTEM
   ========================================================================== */
function initProductFilter() {
  const filterBtns = document.querySelectorAll('.prod-filter-btn');
  const cards = document.querySelectorAll('.product-ref-card');
  const scrollContainer = document.getElementById('productsSideScroll');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (scrollContainer) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   4B. PRODUCT HORIZONTAL SIDE-SCROLL CAROUSEL
   ========================================================================== */
function initProductCarousel() {
  const scrollContainer = document.getElementById('productsSideScroll');
  const prevBtn = document.getElementById('prodScrollPrev');
  const nextBtn = document.getElementById('prodScrollNext');

  if (!scrollContainer) return;

  const scrollDistance = 354; // card width (330px) + gap (24px)

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    prevBtn.style.opacity = scrollContainer.scrollLeft <= 10 ? '0.35' : '1';
    prevBtn.style.pointerEvents = scrollContainer.scrollLeft <= 10 ? 'none' : 'auto';
    nextBtn.style.opacity = scrollContainer.scrollLeft >= maxScroll - 10 ? '0.35' : '1';
    nextBtn.style.pointerEvents = scrollContainer.scrollLeft >= maxScroll - 10 ? 'none' : 'auto';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    });
  }

  scrollContainer.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  setTimeout(updateButtons, 200);

  // Drag-to-scroll support for desktop
  let isDown = false;
  let startX;
  let scrollStartLeft;
  let hasMoved = false;

  scrollContainer.addEventListener('mousedown', (e) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    isDown = true;
    hasMoved = false;
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollStartLeft = scrollContainer.scrollLeft;
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX);
    if (Math.abs(walk) > 5) {
      hasMoved = true;
    }
    scrollContainer.scrollLeft = scrollStartLeft - walk;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    scrollContainer.style.cursor = '';
    scrollContainer.style.userSelect = '';
  });

  // Prevent card click if dragged
  scrollContainer.querySelectorAll('.product-ref-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  });
}

/* ==========================================================================
   4C. INDUSTRIES SERVED HORIZONTAL SCROLL
   ========================================================================== */
function initIndustriesCarousel() {
  const scrollTrack = document.getElementById('industriesScrollTrack');
  const prevBtn = document.getElementById('indScrollPrev');
  const nextBtn = document.getElementById('indScrollNext');

  if (!scrollTrack) return;

  const scrollDistance = 350;

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = scrollTrack.scrollWidth - scrollTrack.clientWidth;
    prevBtn.style.opacity = scrollTrack.scrollLeft <= 5 ? '0.35' : '1';
    prevBtn.style.pointerEvents = scrollTrack.scrollLeft <= 5 ? 'none' : 'auto';
    nextBtn.style.opacity = scrollTrack.scrollLeft >= maxScroll - 5 ? '0.35' : '1';
    nextBtn.style.pointerEvents = scrollTrack.scrollLeft >= maxScroll - 5 ? 'none' : 'auto';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      scrollTrack.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      scrollTrack.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    });
  }

  scrollTrack.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  setTimeout(updateButtons, 200);

  // Mouse Drag Support
  let isDown = false;
  let startX;
  let scrollStartLeft;

  scrollTrack.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    startX = e.pageX - scrollTrack.offsetLeft;
    scrollStartLeft = scrollTrack.scrollLeft;
    scrollTrack.style.cursor = 'grabbing';
    scrollTrack.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - scrollTrack.offsetLeft;
    const walk = (x - startX);
    scrollTrack.scrollLeft = scrollStartLeft - walk;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    scrollTrack.style.cursor = '';
    scrollTrack.style.userSelect = '';
  });
}

/* ==========================================================================
   5. PRODUCT DETAIL MODAL DIALOGS
   ========================================================================== */
const PRODUCTS_DATA = {
  industrial: {
    title: 'Industrial Flexitanks',
    tagline: 'Multi-layer bags that turn a standard 20ft container into a bulk liquid carrier.',
    capacity: 'Capacity: 16,000 – 26,000 Litres',
    image: 'assets/img/product-industrial.jpg',
    specs: [
      { label: 'Layer Architecture', val: '3x Virgin PE layers (125-150µ) + High-Tensile Tubular Woven PP' },
      { label: 'Discharge Valve', val: '3-inch High-Flow Camlock Ball or Butterfly Valve (Safety Lock)' },
      { label: 'Bulkhead Bracing', val: 'Corrugated steel frame with 5x structural steel square tubes' },
      { label: 'Target Cargoes', val: 'Base Oils, Lubricants, Chemicals, Rubber Latex, Glycerine' },
      { label: 'Max Fill Temp', val: '60°C continuous flow' },
      { label: 'Approvals', val: 'ISO 9001:2015, COA PAS 1008:2016, Lloyds Rail Impact Certified' }
    ]
  },
  foodgrade: {
    title: 'Dairy & Edible Oil Flexitanks',
    tagline: 'Food-quality EU & FDA compliant flexitanks purpose-built for milk, oils and molasses.',
    capacity: 'Capacity: 18,000 – 24,000 Litres',
    image: 'assets/img/product-foodgrade.jpg',
    specs: [
      { label: 'Purity Standard', val: '100% Virgin Food-Contact Polymer, Sterile Cleanroom Extrusion' },
      { label: 'Discharge Valve', val: 'Sanitary Food-Grade 3" Butterfly Valve with Tamper Seal & Dust Cap' },
      { label: 'Approvals', val: 'FDA 21 CFR 177.1520, EU No 10/2011, Kosher, Halal, HACCP' },
      { label: 'Target Cargoes', val: 'Palm Oil, Sunflower, Olive Oil, Liquid Milk, Dairy Blends, Molasses' },
      { label: 'Nitrogen Port', val: 'Optional aseptic nitrogen purge & blanket port' },
      { label: 'Migration Limits', val: 'Zero phthalates, zero heavy metals, zero plasticizer leech' }
    ]
  },
  wine: {
    title: 'Wine Flexitanks',
    tagline: 'Thermally protected, flavour-safe transport engineered specifically for bulk wine voyages.',
    capacity: 'Capacity: Up to 24,000 Litres',
    image: 'assets/img/product-foodgrade.jpg',
    specs: [
      { label: 'Barrier Film', val: '5-Layer EVOH Gas Barrier (<0.1 cm³/m²·24h oxygen transmission rate)' },
      { label: 'Thermal Shield', val: 'Multi-layer bubble foil thermal container blanket included' },
      { label: 'Taste Neutrality', val: 'Zero aroma scalping, zero migration, preserves vintage bouquet' },
      { label: 'Target Cargoes', val: 'Bulk Red & White Wine, Cider, Fruit Juice Concentrates' },
      { label: 'Discharge Valve', val: 'Food-grade stainless steel/composite bottom discharge' },
      { label: 'Approvals', val: 'OIV Compliant, EU Food Grade, FDA Compliant, Japan Food Research Lab' }
    ]
  },
  bitumen: {
    title: 'Bitumen Flexitanks',
    tagline: 'Engineered for the safe bulk transport of hot bitumen and asphalt cargo.',
    capacity: 'Capacity: 20,000 – 22,000 Litres (~20–22 MT)',
    image: 'assets/img/product-bitumen.jpg',
    specs: [
      { label: 'Filling Temp', val: 'High-temperature polymer compound rated up to 130°C–150°C' },
      { label: 'Heating System', val: 'Integrated multi-loop steam or hot water heater pad system' },
      { label: 'Structural Rating', val: 'Heavy-duty steel bulkhead containment preventing expansion' },
      { label: 'Target Cargoes', val: 'Paving Bitumen (60/70, 80/100), Asphalt, Paraffin Wax, Tar' },
      { label: 'Discharge Valve', val: 'High-temperature composite 3-inch ball valve' },
      { label: 'Approvals', val: 'COA Structural Dynamic Stress Approved, High-Temp Material Safety' }
    ]
  },
  reefer: {
    title: 'Reefer Flexitanks',
    tagline: 'Trailer-specific solutions for climate-dependent liquid cargo by road and sea.',
    capacity: 'Capacity: 16,000 – 24,000 Litres',
    image: 'assets/img/product-reefer.jpg',
    specs: [
      { label: 'Airflow Profile', val: 'Low-profile contouring allowing unimpeded cooling circulation' },
      { label: 'Anti-Surge', val: 'Internal wave-damping baffles suppressing road transit sloshing' },
      { label: 'Temperature Scope', val: '-10°C to +25°C chilled or heated continuous flow' },
      { label: 'Target Cargoes', val: 'Chilled Milk, Juices, Liquid Pharmaceuticals, Specialty Resins' },
      { label: 'Container Types', val: 'Refrigerated 40ft/20ft containers and highway chassis trailers' },
      { label: 'Approvals', val: 'ATP Container Compatible, ISO 22000, FDA Compliant' }
    ]
  },
  ibc: {
    title: 'IBC & Container Liners',
    tagline: 'Liners and folding paper IBCs for grains, powders and granular bulk cargo.',
    capacity: 'Capacity: 1,000L Paper IBC & Full 20ft/40ft Liners',
    image: 'assets/img/product-ibc-liners.jpg',
    specs: [
      { label: 'Paper IBC', val: 'Collapsible 1,000L heavy-duty kraft with aseptic liner cassette' },
      { label: 'Dry Bulk Liners', val: 'Full-containment 20ft/40ft liners with pneumatic blow spouts' },
      { label: 'Target Cargoes', val: 'Sugar, Starch, Grains, Polymer Pellets, Animal Feed, Minerals' },
      { label: 'Loading Spouts', val: 'Top pneumatic filling and bottom gravity discharge chutes' },
      { label: 'Approvals', val: 'ISO 9001:2015, FDA Food Grade Liner Compliant' }
    ]
  },
  dunnage: {
    title: 'Dunnage Bags & Heater Pads',
    tagline: 'Cargo protection and heating accessories that safeguard transit integrity.',
    capacity: 'Transit Protection & Heating Suite',
    image: 'assets/img/product-dunnage.jpg',
    specs: [
      { label: 'Air Dunnage Bags', val: 'Level 1 to Level 4 AAR Approved Polywoven Kraft air cushions' },
      { label: 'Heater Pads', val: 'Up to 3.5 m² surface area, steam/hot water rapid viscosity reduction' },
      { label: 'Discharge Benefit', val: 'Prevents load shifting and cuts cold-climate discharge time by 75%' },
      { label: 'Approvals', val: 'Association of American Railroads (AAR) Certified, High-Pressure Tested' }
    ]
  }
};

window.openProductModal = function(id) {
  const data = PRODUCTS_DATA[id];
  if (!data) return;

  const modal = document.getElementById('productDetailModal');
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalTagline').textContent = data.tagline;
  document.getElementById('modalCapacity').textContent = data.capacity;
  document.getElementById('modalImg').src = data.image;

  const specsBody = document.getElementById('modalSpecsBody');
  specsBody.innerHTML = '';
  data.specs.forEach(s => {
    const item = document.createElement('div');
    item.style.background = '#070E20';
    item.style.padding = '12px 16px';
    item.style.borderRadius = '6px';
    item.style.border = '1px solid rgba(255,255,255,0.08)';
    item.innerHTML = `<span style="color:var(--text-gray-muted); display:block; font-size:0.75rem; text-transform:uppercase; font-weight:600;">${s.label}</span><strong style="color:#fff; font-size:0.875rem;">${s.val}</strong>`;
    specsBody.appendChild(item);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeProductModal = function() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

/* ==========================================================================
   6. CERTIFICATION MODALS
   ========================================================================== */
const CERTS_DATA = {
  iso9001: { name: 'ISO 9001:2015', auth: 'Quality Management Systems', scope: 'Manufacturing consistency, defect prevention, and rigorous quality audit tracking from virgin resin to valve sealing.' },
  iso14001: { name: 'ISO 14001:2015', auth: 'Environmental Management Systems', scope: 'Sustainable manufacturing practices, waste reduction, and carbon efficiency across all operations.' },
  iso22000: { name: 'ISO 22000:2018', auth: 'Food Safety Management Systems', scope: 'Certified food supply chain hygiene, cleanroom fabrication, and contamination safeguards for bulk liquids.' },
  haccp: { name: 'HACCP Certified', auth: 'Hazard Analysis Critical Control Point', scope: 'Systematic preventive approach to food safety across biological and chemical hazards.' },
  fda: { name: 'FDA 21 CFR 177.1520', auth: 'US Food & Drug Administration', scope: 'Certified direct food contact compliant for olefin polymers and bulk consumable liquids.' },
  eufood: { name: 'EU Food Grade (10/2011)', auth: 'European Commission Migration Standard', scope: 'Verified specific migration limits (SML) for virgin food-contact flexitank liners.' },
  sgs: { name: 'SGS Approval', auth: 'Société Générale de Surveillance', scope: 'Independent third-party laboratory verification of physical and chemical integrity.' },
  kosher: { name: 'Kosher Certificate', auth: 'Rabbinical Council Audit', scope: 'Approved for kosher liquid transportation under strict rabbinical cleanliness supervision.' },
  halal: { name: 'Halal Certificate', auth: 'Islamic Chamber of Commerce & Halal Services', scope: 'Strict compliance with Islamic dietary packaging guidelines.' },
  heavymetal: { name: 'Heavy-Metal-Free', auth: 'RoHS / European Standard Verified', scope: 'Zero lead, cadmium, mercury, or hexavalent chromium in polymer formulation.' },
  phthalate: { name: 'Phthalate-Free Certificate', auth: 'REACH Compliance Certification', scope: 'Zero toxic plasticizers, guaranteeing non-leaching transport for sensitive cargoes.' },
  coa: { name: 'COA Rail Impact Test', auth: 'Container Owners Association / Lloyds Register', scope: 'Subjected to brutal dynamic rail impact testing exceeding international transport shocks.' },
  pas1008: { name: 'PAS 1008:2016 Compliant', auth: 'British Standards Institution (BSI)', scope: 'Governs design, material qualification, and performance tests for single-use flexitanks.' },
  wca: { name: 'World Cargo Alliance (WCA)', auth: 'WCAworld Global Membership', scope: 'Active member of world leading independent freight and logistics network.' }
};

window.openCertModal = function(code) {
  const data = CERTS_DATA[code];
  if (!data) return;

  const modal = document.getElementById('certDetailModal');
  document.getElementById('certTitle').textContent = data.name;
  document.getElementById('certAuth').textContent = data.auth;
  document.getElementById('certScope').textContent = data.scope;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeCertModal = function() {
  const modal = document.getElementById('certDetailModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeCertModal();
  }
});

function initModalBackdrops() {
  const prodModal = document.getElementById('productDetailModal');
  if (prodModal) {
    prodModal.addEventListener('click', (e) => {
      if (e.target === prodModal) closeProductModal();
    });
  }
  const certModal = document.getElementById('certDetailModal');
  if (certModal) {
    certModal.addEventListener('click', (e) => {
      if (e.target === certModal) closeCertModal();
    });
  }
}

/* ==========================================================================
   7. CARGO CALCULATOR ENGINE
   ========================================================================== */
function initCargoCalculator() {
  const cargoSelect = document.getElementById('calcCargoSelect');
  const volumeSlider = document.getElementById('calcVolumeSlider');
  const volumeDisplay = document.getElementById('calcVolumeDisplay');
  const volumeSub = document.getElementById('calcVolumeSub');
  const routeSelect = document.getElementById('calcRouteSelect');
  const presetBtns = document.querySelectorAll('.calc-preset-btn');

  const resContainers = document.getElementById('resContainers');
  const resFlexitank = document.getElementById('resFlexitank');
  const resValve = document.getElementById('resValve');
  const resHeating = document.getElementById('resHeating');

  const btnWhatsApp = document.getElementById('calcWhatsAppBtn');
  const btnEmail = document.getElementById('calcEmailBtn');

  if (!cargoSelect || !volumeSlider) return;

  function update() {
    const volume = parseInt(volumeSlider.value, 10);
    volumeDisplay.textContent = `${volume.toLocaleString()} L`;

    const cargo = cargoSelect.value;
    const capacityPerTank = cargo === 'bitumen' ? 20000 : 24000;
    const containers = Math.ceil(volume / capacityPerTank);

    if (volumeSub) {
      volumeSub.textContent = `${containers} FCL`;
    }

    resContainers.textContent = `${containers} x 20ft FCL`;

    // Dynamic slider track fill with luxury orange-to-amber gradient
    const min = parseInt(volumeSlider.min, 10) || 20000;
    const max = parseInt(volumeSlider.max, 10) || 480000;
    const pct = ((volume - min) / (max - min)) * 100;
    volumeSlider.style.background = `linear-gradient(to right, #E85D1A 0%, #FF8533 ${pct}%, rgba(255, 255, 255, 0.12) ${pct}%, rgba(255, 255, 255, 0.12) 100%)`;

    // Sync preset buttons active state
    presetBtns.forEach(btn => {
      const btnVol = parseInt(btn.getAttribute('data-vol'), 10);
      if (btnVol === volume) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    let model = 'BPS Industrial Multi-Layer (24K)';
    let valve = '3" Camlock Ball Valve';
    let heating = 'Not Required';

    if (cargo === 'edible' || cargo === 'dairy') {
      model = 'BPS Food-Grade Aseptic EVOH (24K)';
      valve = '3" Sanitary Butterfly Valve';
    } else if (cargo === 'wine') {
      model = 'BPS Wine-Shield EVOH + Thermal Wrap';
      valve = 'Sanitary Stainless Steel Valve';
    } else if (cargo === 'bitumen') {
      model = 'BPS Bitumen High-Heat 130°C Rated (20K)';
      valve = 'High-Temp Composite Valve';
      heating = 'Steam Heater Pad System Required';
    } else if (cargo === 'chemical') {
      model = 'BPS Heavy Chemical Multi-Ply (24K)';
      valve = 'Chemical-Resistant Camlock';
    }

    resFlexitank.textContent = model;
    resValve.textContent = valve;
    resHeating.textContent = heating;

    // WhatsApp formatting
    const waText = encodeURIComponent(
      `Hello BPS Global Trading,\n\nI need a quote:\n• Cargo: ${cargoSelect.options[cargoSelect.selectedIndex].text}\n• Total Volume: ${volume.toLocaleString()} L (~${containers} Containers)\n• Trade Route: ${routeSelect.options[routeSelect.selectedIndex].text}\n• Flexitank Model: ${model}\n• Valve: ${valve}\n• Heating: ${heating}\n\nPlease confirm stock in Dubai.`
    );
    btnWhatsApp.href = `https://wa.me/971506718052?text=${waText}`;

    // Email formatting
    const emailSubject = encodeURIComponent(`BPS Quote Request: ${volume.toLocaleString()}L ${cargoSelect.options[cargoSelect.selectedIndex].text}`);
    const emailBody = encodeURIComponent(
      `Dear BPS Global Trading Sales Team,\n\nPlease provide a quote for the following bulk liquid shipment:\n\nCargo Type: ${cargoSelect.options[cargoSelect.selectedIndex].text}\nEstimated Volume: ${volume.toLocaleString()} Litres\nRequired 20ft Containers: ${containers} FCL\nTrade Route: ${routeSelect.options[routeSelect.selectedIndex].text}\n\nCompany Name:\nContact Person:\nPhone Number:\n\nThank you.`
    );
    btnEmail.href = `mailto:sales@bpsglobaltrading.com?subject=${emailSubject}&body=${emailBody}`;
  }

  // Quick Preset Clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const vol = btn.getAttribute('data-vol');
      if (vol) {
        volumeSlider.value = vol;
        update();
      }
    });
  });

  cargoSelect.addEventListener('change', update);
  volumeSlider.addEventListener('input', update);
  routeSelect.addEventListener('change', update);

  update();
}

/* ==========================================================================
   8. FAQ CATEGORY FILTERING
   ========================================================================== */
function initFaqFilters() {
  const filterBtns = document.querySelectorAll('.faq-filter-btn');
  const faqCards = document.querySelectorAll('.faq-card');

  if (!filterBtns.length || !faqCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      faqCards.forEach(card => {
        const cat = card.getAttribute('data-cat');
        if (filterValue === 'all' || cat === filterValue) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   9. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileNavOverlay');
  const closeBtn = document.getElementById('mobileNavClose');
  const navLinks = drawer.querySelectorAll('.mobile-nav-item, .mobile-drawer-quote-btn, .mobile-wa-btn');

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  navLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ==========================================================================
   10. MOBILE FLOATING ACTION DOCK
   ========================================================================== */
function initMobileFloatingBar() {
  const bar = document.getElementById('mobileFloatingBar');
  if (!bar) return;

  function handleScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    // Show dock once user scrolls past initial hero fold
    if (scrollY > 280) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}


