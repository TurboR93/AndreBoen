import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';

// ISO 3166-1 numeric codes for market countries
const ACTIVE_IDS = new Set([
  '840', // USA
  '276', // Germany
  '392', // Japan
  '124', // Canada
  '156', // China
  '784', // UAE
  '756', // Switzerland
]);
const DEV_IDS = new Set([
  '826', // UK
  '076', // Brazil
  '410', // South Korea
]);
const MARKET_IDS = new Set([...ACTIVE_IDS, ...DEV_IDS]);

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* ── Point-in-polygon (ray casting) ── */
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInGeometry(lng, lat, geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const rings of polys) {
    if (pointInRing(lng, lat, rings[0])) {
      let inHole = false;
      for (let h = 1; h < rings.length; h++) {
        if (pointInRing(lng, lat, rings[h])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/* ── Antimeridian detection ── */
function ringCrossesAM(ring) {
  for (let i = 1; i < ring.length; i++) {
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 170) return true;
  }
  return false;
}

/* ── Canvas texture drawing ── */
const CW = 4096, CH = 2048;

function drawTexture(ctx, countries, highlightId) {
  const toX = lng => (lng + 180) / 360 * CW;
  const toY = lat => (90 - lat) / 180 * CH;

  // Ocean
  ctx.fillStyle = '#1a1218';
  ctx.fillRect(0, 0, CW, CH);

  // Fill all countries
  countries.features.forEach(feat => {
    const isActive = ACTIVE_IDS.has(feat.id);
    const isDev = DEV_IDS.has(feat.id);
    ctx.fillStyle = isActive ? '#C5A572' : isDev ? '#7a6347' : '#2d1e1a';
    fillGeometry(ctx, feat.geometry, toX, toY);
  });

  // Italy tricolore overlay (vertical green-white-red)
  const italyFeat = countries.features.find(f => f.id === '380');
  if (italyFeat) {
    // Get Italy's bounding box for the gradient
    let minX = CW, maxX = 0;
    const polys = italyFeat.geometry.type === 'Polygon'
      ? [italyFeat.geometry.coordinates] : italyFeat.geometry.coordinates;
    polys.forEach(rings => rings[0].forEach(([lng]) => {
      const x = toX(lng);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }));
    const tricolore = ctx.createLinearGradient(minX, 0, maxX, 0);
    tricolore.addColorStop(0, '#009246');    // verde
    tricolore.addColorStop(0.33, '#009246');
    tricolore.addColorStop(0.33, '#F1F2F1');  // bianco
    tricolore.addColorStop(0.66, '#F1F2F1');
    tricolore.addColorStop(0.66, '#CE2B37');  // rosso
    tricolore.addColorStop(1, '#CE2B37');
    ctx.fillStyle = tricolore;
    fillGeometry(ctx, italyFeat.geometry, toX, toY);
    // Semi-transparent overlay to blend with the map style
    ctx.fillStyle = 'rgba(26, 18, 24, 0.35)';
    fillGeometry(ctx, italyFeat.geometry, toX, toY);
  }

  // Borders (separate pass so fills don't cover them)
  ctx.strokeStyle = '#4a3228';
  ctx.lineWidth = 0.8;
  countries.features.forEach(feat => {
    strokeGeometry(ctx, feat.geometry, toX, toY);
  });

  // Draw highlighted country on top
  if (highlightId) {
    const feat = countries.features.find(f => f.id === highlightId);
    if (feat) {
      const isActiveMkt = ACTIVE_IDS.has(highlightId);
      ctx.fillStyle = isActiveMkt ? '#e8d5b0' : '#a89070';
      fillGeometry(ctx, feat.geometry, toX, toY);
      ctx.strokeStyle = isActiveMkt ? '#FFF8F0' : '#c8b898';
      ctx.lineWidth = 3;
      strokeGeometry(ctx, feat.geometry, toX, toY);
    }
  }

  // Polar fade — blend distorted polar regions into ocean
  const polarH = CH * 0.12;
  const topGrad = ctx.createLinearGradient(0, 0, 0, polarH);
  topGrad.addColorStop(0, '#1a1218');
  topGrad.addColorStop(1, 'rgba(26, 18, 24, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CW, polarH);

  const botGrad = ctx.createLinearGradient(0, CH - polarH, 0, CH);
  botGrad.addColorStop(0, 'rgba(26, 18, 24, 0)');
  botGrad.addColorStop(1, '#1a1218');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, CH - polarH, CW, polarH);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(197, 165, 114, 0.04)';
  ctx.lineWidth = 0.5;
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    ctx.moveTo(0, toY(lat));
    ctx.lineTo(CW, toY(lat));
    ctx.stroke();
  }
  for (let lng = -150; lng <= 180; lng += 30) {
    ctx.beginPath();
    ctx.moveTo(toX(lng), 0);
    ctx.lineTo(toX(lng), CH);
    ctx.stroke();
  }
}

function fillGeometry(ctx, geometry, toX, toY) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  polys.forEach(rings => {
    const crosses = rings.some(ringCrossesAM);
    if (!crosses) {
      ctx.beginPath();
      rings.forEach(ring => {
        ring.forEach(([lng, lat], i) => {
          if (i === 0) ctx.moveTo(toX(lng), toY(lat));
          else ctx.lineTo(toX(lng), toY(lat));
        });
        ctx.closePath();
      });
      ctx.fill('evenodd');
    } else {
      // East half — shift negative lngs eastward
      ctx.save();
      ctx.beginPath();
      ctx.rect(CW * 0.47, 0, CW * 0.55, CH);
      ctx.clip();
      ctx.beginPath();
      rings.forEach(ring => {
        ring.forEach(([lng, lat], i) => {
          const x = toX(lng < 0 ? lng + 360 : lng);
          if (i === 0) ctx.moveTo(x, toY(lat));
          else ctx.lineTo(x, toY(lat));
        });
        ctx.closePath();
      });
      ctx.fill('evenodd');
      ctx.restore();
      // West half — shift positive lngs westward
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, CW * 0.53, CH);
      ctx.clip();
      ctx.beginPath();
      rings.forEach(ring => {
        ring.forEach(([lng, lat], i) => {
          const x = toX(lng > 0 ? lng - 360 : lng);
          if (i === 0) ctx.moveTo(x, toY(lat));
          else ctx.lineTo(x, toY(lat));
        });
        ctx.closePath();
      });
      ctx.fill('evenodd');
      ctx.restore();
    }
  });
}

function strokeGeometry(ctx, geometry, toX, toY) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  polys.forEach(rings => {
    rings.forEach(ring => {
      ctx.beginPath();
      ring.forEach(([lng, lat], i) => {
        if (i === 0 || Math.abs(lng - ring[i - 1][0]) > 170) {
          ctx.moveTo(toX(lng), toY(lat));
        } else {
          ctx.lineTo(toX(lng), toY(lat));
        }
      });
      ctx.stroke();
    });
  });
}

/* ── Component ── */
const SECTOR_COLORS = {
  wine:       { color: 0xc8a96e, emissive: 0x8a6a2e },
  food:       { color: 0xd45454, emissive: 0x8a2a2a },
  spirits:    { color: 0x7a9ec7, emissive: 0x3a5a7a },
  'olive oil': { color: 0x7ab56a, emissive: 0x3a6a2e },
};

export default function Globe3D({ markers = [], onMarkerClick, dotSize = 0.025, rotationSpeed = 0.0015, flyTo = null, showSectors = false, passive = false }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null); // { group, camera, MIN_Z, BASE_Z }

  // FlyTo: rotate globe so the contact faces the camera (upright)
  useEffect(() => {
    if (!flyTo || !sceneRef.current) return;
    const { group, camera, MIN_Z, BASE_Z } = sceneRef.current;
    const tPos = latLngToVec3(flyTo.lat, flyTo.lng, 1);

    // Y rotation: center longitude (rotate around world Y)
    const targetY = Math.atan2(-tPos.x, tPos.z);
    // X rotation: center latitude (tilt around world X after Y rotation)
    const targetX = Math.atan2(tPos.y, Math.sqrt(tPos.x * tPos.x + tPos.z * tPos.z));

    // Compose: extrinsic Y-then-X = qX * qY
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetY);
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetX);
    group.quaternion.copy(qX.multiply(qY));
    camera.position.z = MIN_Z + (BASE_Z - MIN_Z) * 0.15;
  }, [flyTo]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600;
    const H = mount.clientHeight || 400;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    const BASE_Z = 2.8;
    const MIN_Z = BASE_Z * 0.7;   // 30% zoom in
    const MAX_Z = BASE_Z * 1.1;   // 10% zoom out
    camera.position.z = BASE_Z;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Group: everything that rotates together
    const group = new THREE.Group();
    scene.add(group);

    // Start with Italy facing the camera (lat≈43, lng≈12)
    const italyPos = latLngToVec3(43, 12, 1);
    const initY = Math.atan2(-italyPos.x, italyPos.z);
    const initX = Math.atan2(italyPos.y, Math.sqrt(italyPos.x * italyPos.x + italyPos.z * italyPos.z));
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), initY);
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), initX);
    group.quaternion.copy(qX.multiply(qY));

    // Expose to flyTo useEffect
    sceneRef.current = { group, camera, MIN_Z, BASE_Z };

    // Build countries GeoJSON
    const countries = feature(countriesTopo, countriesTopo.objects.countries);
    const marketFeatures = countries.features.filter(f => MARKET_IDS.has(f.id));

    // Globe texture (reusable canvas)
    const RADIUS = 1;
    const texCanvas = document.createElement('canvas');
    texCanvas.width = CW;
    texCanvas.height = CH;
    const texCtx = texCanvas.getContext('2d');

    drawTexture(texCtx, countries, null);
    const canvasTexture = new THREE.CanvasTexture(texCanvas);

    let currentHighlight = null;
    function updateHighlight(id) {
      if (id === currentHighlight) return;
      currentHighlight = id;
      drawTexture(texCtx, countries, id);
      canvasTexture.needsUpdate = true;
    }

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshPhongMaterial({
        map: canvasTexture,
        specular: new THREE.Color(0x1a1010),
        shininess: 8,
      })
    );
    group.add(globe);

    // Atmosphere glow
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.05, 128, 128),
      new THREE.MeshPhongMaterial({ color: 0xc8a96e, transparent: true, opacity: 0.06, side: THREE.BackSide })
    ));

    // Compute per-marker size based on neighbor density
    const NEIGHBOR_RADIUS = 5; // degrees
    const markerSizes = markers.map((m, i) => {
      let neighbors = 0;
      for (let j = 0; j < markers.length; j++) {
        if (i === j) continue;
        const dLat = m.lat - markers[j].lat;
        const dLng = m.lng - markers[j].lng;
        if (Math.sqrt(dLat * dLat + dLng * dLng) < NEIGHBOR_RADIUS) neighbors++;
      }
      // Scale: 0 neighbors → full dotSize, many neighbors → much smaller
      const scale = 1 / (1 + neighbors * 0.5);
      return dotSize * Math.max(scale, 0.2);
    });

    // Markers
    const RIPPLE_COUNT = 3;
    const RIPPLE_DURATION = 2.0;
    const activeRipples = [];
    const devDots = [];

    markers.forEach((country, idx) => {
      const pos = latLngToVec3(country.lat, country.lng, RADIUS + 0.02);
      const normal = pos.clone().normalize();
      const isActive = country.status === 'active';
      const size = markerSizes[idx];

      // Center dot — use sector color in admin mode
      const sectorStyle = showSectors && country.sector && SECTOR_COLORS[country.sector];
      const dotColor = sectorStyle ? sectorStyle.color : (isActive ? 0xc8a96e : 0xf0c040);
      const dotEmissive = sectorStyle ? sectorStyle.emissive : (isActive ? 0x8a6a2e : 0xa08020);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(size, 16, 16),
        new THREE.MeshPhongMaterial({
          color: dotColor,
          emissive: dotEmissive,
          shininess: 80,
        })
      );
      dot.position.copy(pos);
      dot.userData = country;
      group.add(dot);

      if (isActive) {
        const ripples = [];
        for (let r = 0; r < RIPPLE_COUNT; r++) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(size * 0.04, size * 0.16, 48),
            new THREE.MeshBasicMaterial({
              color: dotColor,
              transparent: true,
              opacity: 0,
              side: THREE.DoubleSide,
            })
          );
          ring.position.copy(pos);
          ring.lookAt(pos.clone().add(normal));
          group.add(ring);
          ripples.push(ring);
        }
        activeRipples.push({ meshes: ripples, pos, normal, offset: Math.random() * RIPPLE_DURATION });
      } else {
        dot.scale.set(0, 0, 0);
        devDots.push({ mesh: dot, offset: Math.random() * 6 });
      }
    });

    // Collect dot meshes for click raycasting
    const dotMeshes = markers.map((_, i) => group.children.find(
      c => c.userData === markers[i]
    )).filter(Boolean);

    // ── Interaction ──
    let isDragging = false;
    let didDrag = false;
    let prevMouse = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Passive mode: camera shifts slightly with cursor, globe stays on Italy
    let camTarget = { x: 0, y: 0 }; // target camera offset
    let camCurrent = { x: 0, y: 0 }; // smoothed current offset

    if (passive) {
      const onPassiveMove = e => {
        const rect = mount.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1 to 1
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        camTarget.x = nx * 0.3;   // horizontal camera shift
        camTarget.y = -ny * 0.2;  // vertical camera shift (inverted)
      };
      const onPassiveLeave = () => {
        camTarget.x = 0;
        camTarget.y = 0;
      };
      mount.addEventListener('mousemove', onPassiveMove);
      mount.addEventListener('mouseleave', onPassiveLeave);
      mount.style.cursor = 'default';
    } else {
      // Interactive mode: drag, click, hover, zoom
      const onMouseDown = e => {
        isDragging = true;
        didDrag = false;
        prevMouse = { x: e.clientX, y: e.clientY };
        velocity = { x: 0, y: 0 };
      };

      const onMouseMove = e => {
        if (isDragging) {
          const dx = e.clientX - prevMouse.x;
          const dy = e.clientY - prevMouse.y;
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
          group.rotation.y -= dx * 0.005;
          group.rotation.x += dy * 0.005;
          velocity = { x: dy * 0.005, y: -dx * 0.005 };
          prevMouse = { x: e.clientX, y: e.clientY };
          return;
        }

        // Hover → highlight market countries
        const rect = mount.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(globe);

        if (hits.length > 0 && hits[0].uv) {
          const uv = hits[0].uv;
          const lng = uv.x * 360 - 180;
          const lat = 90 - uv.y * 180;

          let foundId = null;
          for (const feat of marketFeatures) {
            if (pointInGeometry(lng, lat, feat.geometry)) {
              foundId = feat.id;
              break;
            }
          }
          updateHighlight(foundId);
          mount.style.cursor = foundId ? 'pointer' : 'grab';
        } else {
          updateHighlight(null);
          mount.style.cursor = 'default';
        }
      };

      const onMouseUp = e => {
        if (!didDrag && onMarkerClick) {
          const rect = mount.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(dotMeshes);
          if (hits.length > 0) onMarkerClick(hits[0].object.userData);
        }
        isDragging = false;
      };

      const onMouseLeave = () => {
        updateHighlight(null);
        mount.style.cursor = 'default';
      };

      // Touch
      const onTouchStart = e => {
        prevTouch = e.touches[0];
        velocity = { x: 0, y: 0 };
      };
      const onTouchMove = e => {
        if (!prevTouch) return;
        const dx = e.touches[0].clientX - prevTouch.clientX;
        const dy = e.touches[0].clientY - prevTouch.clientY;
        group.rotation.y -= dx * 0.005;
        group.rotation.x += dy * 0.005;
        velocity = { x: dy * 0.003, y: -dx * 0.003 };
        prevTouch = e.touches[0];
      };
      const onTouchEnd = () => { prevTouch = null; };

      const onWheel = e => {
        e.preventDefault();
        camera.position.z = Math.min(MAX_Z, Math.max(MIN_Z, camera.position.z + e.deltaY * 0.002));
      };

      mount.addEventListener('mousedown', onMouseDown);
      mount.addEventListener('mousemove', onMouseMove);
      mount.addEventListener('mouseup', onMouseUp);
      mount.addEventListener('mouseleave', onMouseLeave);
      mount.addEventListener('wheel', onWheel, { passive: false });
      mount.addEventListener('touchstart', onTouchStart);
      mount.addEventListener('touchmove', onTouchMove);
      mount.addEventListener('touchend', onTouchEnd);
    }

    let prevTouch = null;

    const onResize = () => {
      const W2 = mount.clientWidth;
      const H2 = mount.clientHeight;
      if (!W2 || !H2) return;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let frameId;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.016;

      if (passive) {
        // Passive: globe stays on Italy, camera shifts with cursor
        camCurrent.x += (camTarget.x - camCurrent.x) * 0.06;
        camCurrent.y += (camTarget.y - camCurrent.y) * 0.06;
        camera.position.x = camCurrent.x;
        camera.position.y = camCurrent.y;
        camera.lookAt(0, 0, 0);
      } else if (!isDragging) {
        // Slow/stop rotation when zoomed in, full speed when zoomed out
        const zoomFactor = Math.max(0, (camera.position.z - MIN_Z) / (BASE_Z - MIN_Z));
        group.rotation.y += rotationSpeed * zoomFactor + velocity.y;
        group.rotation.x += velocity.x;
        velocity.x *= 0.95;
        velocity.y *= 0.95;
      }

      // Active markers: expanding ripple rings
      const MAX_SCALE = 18;
      activeRipples.forEach(({ meshes, pos, normal, offset }) => {
        meshes.forEach((ring, i) => {
          const phase = ((time + offset + i * (RIPPLE_DURATION / RIPPLE_COUNT)) % RIPPLE_DURATION) / RIPPLE_DURATION;
          const scale = 1 + phase * MAX_SCALE;
          ring.scale.set(scale, scale, 1);
          ring.position.copy(pos);
          ring.lookAt(pos.clone().add(normal));
          ring.material.opacity = 0.6 * (1 - phase);
        });
      });

      // Developing markers: slow breathe from 0 to full size (6s cycle)
      devDots.forEach(({ mesh, offset }) => {
        const phase = ((time + offset) % 6) / 6; // 0→1 over 6 seconds
        const s = Math.sin(phase * Math.PI); // 0→1→0 smoothly
        mesh.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} className="globe3d" />;
}
