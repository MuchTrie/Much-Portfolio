/* ============================================================
   3D NETWORK GLOBE – HERO SECTION
   Renders an interactive wireframe globe with glowing nodes
   and connection lines. Replaces the profile photo.
   ============================================================ */

'use strict';

function initGlobe3D() {
  const canvas = document.getElementById('globe-3d-canvas');
  if (!canvas) return;

  // Skip on very small screens
  if (window.innerWidth < 768) {
    canvas.style.display = 'none';
    return;
  }

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  const size = Math.min(canvas.clientWidth, canvas.clientHeight);
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.z = 280;

  /* ── Globe wireframe ────────────────────────────────────── */
  const GLOBE_RADIUS = 100;
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Wireframe sphere
  const sphereGeo = new THREE.IcosahedronGeometry(GLOBE_RADIUS, 2);
  const wireframe = new THREE.WireframeGeometry(sphereGeo);
  const wireMat   = new THREE.LineBasicMaterial({
    color: 0xe63946,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const wireLines = new THREE.LineSegments(wireframe, wireMat);
  globeGroup.add(wireLines);

  // Second inner wireframe for depth
  const innerGeo      = new THREE.IcosahedronGeometry(GLOBE_RADIUS * 0.75, 1);
  const innerWire     = new THREE.WireframeGeometry(innerGeo);
  const innerWireMat  = new THREE.LineBasicMaterial({
    color: 0xe63946,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
  });
  const innerWireLines = new THREE.LineSegments(innerWire, innerWireMat);
  globeGroup.add(innerWireLines);

  /* ── Nodes (points at vertices) ─────────────────────────── */
  const vertexPositions = sphereGeo.attributes.position;
  const nodeCount = vertexPositions.count;

  // Remove duplicate vertices (icosahedron has shared vertices)
  const uniqueNodes = [];
  const seen = new Set();
  for (let i = 0; i < nodeCount; i++) {
    const x = Math.round(vertexPositions.getX(i) * 10) / 10;
    const y = Math.round(vertexPositions.getY(i) * 10) / 10;
    const z = Math.round(vertexPositions.getZ(i) * 10) / 10;
    const key = `${x},${y},${z}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNodes.push(new THREE.Vector3(x, y, z));
    }
  }

  // Create node points
  const nodePositions = new Float32Array(uniqueNodes.length * 3);
  const nodeColors    = new Float32Array(uniqueNodes.length * 3);
  const nodeSizes     = new Float32Array(uniqueNodes.length);

  for (let i = 0; i < uniqueNodes.length; i++) {
    const i3 = i * 3;
    nodePositions[i3]     = uniqueNodes[i].x;
    nodePositions[i3 + 1] = uniqueNodes[i].y;
    nodePositions[i3 + 2] = uniqueNodes[i].z;

    // Mix of bright red nodes and dim white nodes
    const isHighlight = Math.random() < 0.3;
    if (isHighlight) {
      nodeColors[i3]     = 230 / 255;
      nodeColors[i3 + 1] = 57 / 255;
      nodeColors[i3 + 2] = 70 / 255;
      nodeSizes[i] = 3.5;
    } else {
      const b = 0.4 + Math.random() * 0.3;
      nodeColors[i3]     = b;
      nodeColors[i3 + 1] = b * 0.9;
      nodeColors[i3 + 2] = b * 0.9;
      nodeSizes[i] = 2.0;
    }
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

  const nodeMat = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const nodeSystem = new THREE.Points(nodeGeo, nodeMat);
  globeGroup.add(nodeSystem);

  /* ── Connection arcs (random connections between nearby nodes) ── */
  const arcMaterial = new THREE.LineBasicMaterial({
    color: 0xe63946,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const CONNECTION_THRESHOLD = GLOBE_RADIUS * 0.7;
  const maxArcs = 40;
  let arcCount = 0;

  for (let i = 0; i < uniqueNodes.length && arcCount < maxArcs; i++) {
    for (let j = i + 1; j < uniqueNodes.length && arcCount < maxArcs; j++) {
      const dist = uniqueNodes[i].distanceTo(uniqueNodes[j]);
      if (dist < CONNECTION_THRESHOLD && Math.random() < 0.15) {
        // Create a curved arc on the surface
        const mid = new THREE.Vector3()
          .addVectors(uniqueNodes[i], uniqueNodes[j])
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(GLOBE_RADIUS * 1.08);

        const curve = new THREE.QuadraticBezierCurve3(
          uniqueNodes[i], mid, uniqueNodes[j]
        );
        const points = curve.getPoints(12);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
        const arc    = new THREE.Line(arcGeo, arcMaterial);
        globeGroup.add(arc);
        arcCount++;
      }
    }
  }

  /* ── Pulse rings (orbiting rings) ───────────────────────── */
  const ringGeo1 = new THREE.RingGeometry(GLOBE_RADIUS * 1.15, GLOBE_RADIUS * 1.17, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0xe63946,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI * 0.5;
  globeGroup.add(ring1);

  const ringGeo2 = new THREE.RingGeometry(GLOBE_RADIUS * 1.25, GLOBE_RADIUS * 1.27, 64);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0xe63946,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.x = Math.PI * 0.35;
  ring2.rotation.z = Math.PI * 0.2;
  globeGroup.add(ring2);

  /* ── Floating data points (orbiting particles) ──────────── */
  const orbitCount = 8;
  const orbitParticles = [];
  for (let i = 0; i < orbitCount; i++) {
    const dotGeo = new THREE.SphereGeometry(1.5, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xe63946,
      transparent: true,
      opacity: 0.8,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    const angle  = (i / orbitCount) * Math.PI * 2;
    const radius = GLOBE_RADIUS * (1.15 + Math.random() * 0.15);
    const tilt   = (Math.random() - 0.5) * Math.PI * 0.4;
    orbitParticles.push({ mesh: dot, angle, radius, speed: 0.003 + Math.random() * 0.004, tilt });
    globeGroup.add(dot);
  }

  /* ── Mouse interaction ──────────────────────────────────── */
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const container = canvas.closest('.hero-globe') || canvas.parentElement;
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  container.addEventListener('mouseleave', () => {
    mouse.targetX = 0;
    mouse.targetY = 0;
  }, { passive: true });

  /* ── Pulsing node animation ─────────────────────────────── */
  let pulseTime = 0;

  /* ── Animation loop ─────────────────────────────────────── */
  let animationId;

  function animate() {
    animationId = requestAnimationFrame(animate);
    pulseTime += 0.02;

    // Smooth mouse follow
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Auto rotation + mouse influence
    globeGroup.rotation.y += 0.003;
    globeGroup.rotation.x += 0.001;

    // Mouse tilt
    globeGroup.rotation.y += mouse.x * 0.008;
    globeGroup.rotation.x += mouse.y * 0.005;

    // Animate orbit particles
    orbitParticles.forEach(p => {
      p.angle += p.speed;
      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.y = Math.sin(p.angle + p.tilt) * p.radius * 0.3;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;
    });

    // Pulse ring opacity
    ring1.material.opacity = 0.08 + Math.sin(pulseTime) * 0.04;
    ring2.material.opacity = 0.04 + Math.sin(pulseTime * 0.7) * 0.03;

    // Pulse node brightness
    nodeMat.opacity = 0.7 + Math.sin(pulseTime * 1.5) * 0.2;

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize handler ─────────────────────────────────────── */
  function onResize() {
    if (window.innerWidth < 768) {
      canvas.style.display = 'none';
      cancelAnimationFrame(animationId);
      return;
    }
    canvas.style.display = '';
    const s = Math.min(canvas.clientWidth, canvas.clientHeight);
    renderer.setSize(s, s);
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', onResize, { passive: true });
}
