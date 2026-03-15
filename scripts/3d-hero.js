/* ============================================================
   3D PARTICLE NETWORK – HERO BACKGROUND
   Uses Three.js to render interactive floating particles
   connected by glowing lines, reacting to mouse movement.
   ============================================================ */

'use strict';

function initHero3D() {
  const canvas = document.getElementById('hero-3d-canvas');
  if (!canvas) return;

  // Skip on very small screens for performance
  if (window.innerWidth < 768) {
    canvas.style.display = 'none';
    return;
  }

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.z = 300;

  /* ── Particles ──────────────────────────────────────────── */
  const PARTICLE_COUNT = 120;
  const SPREAD = 500;
  const CONNECTION_DIST = 120;

  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = [];
  const colors     = new Float32Array(PARTICLE_COUNT * 3);

  const redColor   = { r: 230 / 255, g: 57 / 255, b: 70 / 255 };
  const whiteColor = { r: 1, g: 1, b: 1 };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * SPREAD;
    positions[i3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i3 + 2] = (Math.random() - 0.5) * 200;

    velocities.push({
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.3,
      z: (Math.random() - 0.5) * 0.15,
    });

    // 30% red, 70% white (dim)
    const isRed = Math.random() < 0.3;
    const c = isRed ? redColor : whiteColor;
    const brightness = isRed ? 1 : 0.3 + Math.random() * 0.3;
    colors[i3]     = c.r * brightness;
    colors[i3 + 1] = c.g * brightness;
    colors[i3 + 2] = c.b * brightness;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 2.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  /* ── Connection Lines ───────────────────────────────────── */
  const MAX_LINES = 300;
  const linePositions = new Float32Array(MAX_LINES * 6);
  const lineColors    = new Float32Array(MAX_LINES * 6);
  const lineGeometry  = new THREE.BufferGeometry();

  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  lineGeometry.setDrawRange(0, 0);

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineSystem);

  /* ── Mouse tracking ─────────────────────────────────────── */
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const heroSection = canvas.closest('.hero') || canvas.parentElement;
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    mouse.targetX = 0;
    mouse.targetY = 0;
  }, { passive: true });

  /* ── Animation Loop ─────────────────────────────────────── */
  let animationId;

  function animate() {
    animationId = requestAnimationFrame(animate);

    // Smooth mouse follow
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Update particle positions
    const pos = particleGeometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3]     += velocities[i].x;
      pos[i3 + 1] += velocities[i].y;
      pos[i3 + 2] += velocities[i].z;

      // Bounce within bounds
      if (Math.abs(pos[i3])     > SPREAD / 2) velocities[i].x *= -1;
      if (Math.abs(pos[i3 + 1]) > SPREAD / 2) velocities[i].y *= -1;
      if (Math.abs(pos[i3 + 2]) > 100)        velocities[i].z *= -1;
    }

    particleGeometry.attributes.position.needsUpdate = true;

    // Update connection lines
    let lineIndex = 0;
    const lPos = lineGeometry.attributes.position.array;
    const lCol = lineGeometry.attributes.color.array;

    for (let i = 0; i < PARTICLE_COUNT && lineIndex < MAX_LINES; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineIndex < MAX_LINES; j++) {
        const i3 = i * 3;
        const j3 = j * 3;

        const dx = pos[i3]     - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DIST) {
          const li = lineIndex * 6;
          lPos[li]     = pos[i3];
          lPos[li + 1] = pos[i3 + 1];
          lPos[li + 2] = pos[i3 + 2];
          lPos[li + 3] = pos[j3];
          lPos[li + 4] = pos[j3 + 1];
          lPos[li + 5] = pos[j3 + 2];

          const alpha = 1 - dist / CONNECTION_DIST;
          // Red-tinted lines
          lCol[li]     = redColor.r * alpha;
          lCol[li + 1] = redColor.g * alpha * 0.5;
          lCol[li + 2] = redColor.b * alpha * 0.5;
          lCol[li + 3] = redColor.r * alpha;
          lCol[li + 4] = redColor.g * alpha * 0.5;
          lCol[li + 5] = redColor.b * alpha * 0.5;

          lineIndex++;
        }
      }
    }

    lineGeometry.setDrawRange(0, lineIndex * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;

    // Mouse parallax on camera
    camera.position.x += (mouse.x * 40 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.y * 40 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Gentle rotation of the entire particle system
    particleSystem.rotation.y += 0.0003;
    particleSystem.rotation.x += 0.0001;

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize Handler ─────────────────────────────────────── */
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (window.innerWidth < 768) {
      canvas.style.display = 'none';
      cancelAnimationFrame(animationId);
      return;
    }

    canvas.style.display = '';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize, { passive: true });
}
