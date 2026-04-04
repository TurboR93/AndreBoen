import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-50m.json';

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

function drawTexture(ctx, countries, highlightId, neutralMode = false) {
  const toX = lng => (lng + 180) / 360 * CW;
  const toY = lat => (90 - lat) / 180 * CH;

  // Ocean
  ctx.fillStyle = '#1a1218';
  ctx.fillRect(0, 0, CW, CH);

  // Fill all countries
  countries.features.forEach(feat => {
    if (neutralMode) {
      ctx.fillStyle = '#2d1e1a';
    } else {
      const isActive = ACTIVE_IDS.has(feat.id);
      const isDev = DEV_IDS.has(feat.id);
      ctx.fillStyle = isActive ? '#C5A572' : isDev ? '#7a6347' : '#2d1e1a';
    }
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

  // Highlighted country fill on top (borders handled in 3D)
  if (highlightId) {
    const feat = countries.features.find(f => f.id === highlightId);
    if (feat) {
      const isActiveMkt = ACTIVE_IDS.has(highlightId);
      ctx.fillStyle = isActiveMkt ? '#e8d5b0' : '#a89070';
      fillGeometry(ctx, feat.geometry, toX, toY);
    }
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

export default function Globe3D({ markers = [], onMarkerClick, dotSize = 0.025, rotationSpeed = 0.0015, flyTo = null, showSectors = false, passive = false, satelliteTexture = false, zoomIn = false, onZoomComplete = null }) {
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
    if (satelliteTexture) {
      scene.background = new THREE.Color(0x000000);
      // Starfield — thousands of tiny points in deep space
      const starCount = 3000;
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        // Random positions on a large sphere around the scene
        const r = 80 + Math.random() * 120;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[i * 3 + 2] = r * Math.cos(phi);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.15, sizeAttenuation: true,
      })));
    }
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    const BASE_Z = 2.8;
    const MIN_Z = BASE_Z * 0.7;   // 30% zoom in
    const MAX_Z = BASE_Z * 2.5;   // 150% zoom out
    camera.position.z = BASE_Z;

    // Lights
    if (satelliteTexture) {
      // Realistic space illumination — very low ambient (space is dark),
      // strong directional sun creates visible day/night terminator
      scene.add(new THREE.AmbientLight(0x111122, 0.4));
      const sun = new THREE.DirectionalLight(0xfffaf0, 2.2);
      sun.position.set(5, 1, 3);
      scene.add(sun);
    } else {
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
      sun.position.set(5, 3, 5);
      scene.add(sun);
    }

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

    // Globe texture
    const RADIUS = 1;
    let globeMaterial;
    let texCanvas, texCtx, canvasTexture;

    if (satelliteTexture) {
      // Load NASA Blue Marble satellite texture
      const loader = new THREE.TextureLoader();
      const earthTex = loader.load(
        `${import.meta.env.BASE_URL}textures/earth-blue-marble.jpg`
      );
      earthTex.colorSpace = THREE.SRGBColorSpace;
      globeMaterial = new THREE.MeshPhongMaterial({
        map: earthTex,
        color: new THREE.Color(0xffffff),    // no tint — natural satellite colors
        specular: new THREE.Color(0x333333),
        shininess: 15,
      });
    } else {
      // Canvas-drawn flat texture (admin / Mercati pages)
      texCanvas = document.createElement('canvas');
      texCanvas.width = CW;
      texCanvas.height = CH;
      texCtx = texCanvas.getContext('2d');
      drawTexture(texCtx, countries, null, passive);
      canvasTexture = new THREE.CanvasTexture(texCanvas);
      globeMaterial = new THREE.MeshPhongMaterial({
        map: canvasTexture,
        specular: new THREE.Color(0x1a1010),
        shininess: 8,
      });
    }

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      globeMaterial
    );
    group.add(globe);

    // Overlay canvas for satellite mode — Italy tricolore + market highlights
    let overlayCtx, overlayTexture;
    const toX = lng => (lng + 180) / 360 * CW;
    const toY = lat => (90 - lat) / 180 * CH;

    if (satelliteTexture) {
      const oCanvas = document.createElement('canvas');
      oCanvas.width = CW;
      oCanvas.height = CH;
      overlayCtx = oCanvas.getContext('2d');

      function drawOverlay(highlightId) {
        overlayCtx.clearRect(0, 0, CW, CH);
        // Italy tricolore
        const italyFeat = countries.features.find(f => f.id === '380');
        if (italyFeat) {
          let minX = CW, maxX = 0;
          const polys = italyFeat.geometry.type === 'Polygon'
            ? [italyFeat.geometry.coordinates] : italyFeat.geometry.coordinates;
          polys.forEach(rings => rings[0].forEach(([lng]) => {
            const x = toX(lng);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }));
          const tricolore = overlayCtx.createLinearGradient(minX, 0, maxX, 0);
          tricolore.addColorStop(0, '#009246');
          tricolore.addColorStop(0.33, '#009246');
          tricolore.addColorStop(0.33, '#F1F2F1');
          tricolore.addColorStop(0.66, '#F1F2F1');
          tricolore.addColorStop(0.66, '#CE2B37');
          tricolore.addColorStop(1, '#CE2B37');
          overlayCtx.fillStyle = tricolore;
          fillGeometry(overlayCtx, italyFeat.geometry, toX, toY);
          overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          fillGeometry(overlayCtx, italyFeat.geometry, toX, toY);
        }
        // Market country highlights (interactive mode)
        if (!passive) {
          countries.features.forEach(feat => {
            const isActive = ACTIVE_IDS.has(feat.id);
            const isDev = DEV_IDS.has(feat.id);
            if (!isActive && !isDev) return;
            const isHL = feat.id === highlightId;
            overlayCtx.fillStyle = isHL
              ? 'rgba(232, 213, 176, 0.45)'
              : isActive ? 'rgba(200, 169, 110, 0.25)' : 'rgba(122, 99, 71, 0.2)';
            fillGeometry(overlayCtx, feat.geometry, toX, toY);
          });
        }
      }
      drawOverlay(null);
      overlayTexture = new THREE.CanvasTexture(oCanvas);
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS + 0.001, 64, 64),
        new THREE.MeshBasicMaterial({ map: overlayTexture, transparent: true, depthWrite: false })
      ));
    }

    let currentHighlight = null;
    function updateHighlight(id) {
      if (passive || id === currentHighlight) return;
      currentHighlight = id;
      if (satelliteTexture && overlayCtx && overlayTexture) {
        // Redraw overlay with new highlight
        overlayCtx.clearRect(0, 0, CW, CH);
        // Italy tricolore
        const italyFeat = countries.features.find(f => f.id === '380');
        if (italyFeat) {
          let minX = CW, maxX = 0;
          const polys = italyFeat.geometry.type === 'Polygon'
            ? [italyFeat.geometry.coordinates] : italyFeat.geometry.coordinates;
          polys.forEach(rings => rings[0].forEach(([lng]) => {
            const x = toX(lng);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }));
          const tricolore = overlayCtx.createLinearGradient(minX, 0, maxX, 0);
          tricolore.addColorStop(0, '#009246');
          tricolore.addColorStop(0.33, '#009246');
          tricolore.addColorStop(0.33, '#F1F2F1');
          tricolore.addColorStop(0.66, '#F1F2F1');
          tricolore.addColorStop(0.66, '#CE2B37');
          tricolore.addColorStop(1, '#CE2B37');
          overlayCtx.fillStyle = tricolore;
          fillGeometry(overlayCtx, italyFeat.geometry, toX, toY);
          overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          fillGeometry(overlayCtx, italyFeat.geometry, toX, toY);
        }
        countries.features.forEach(feat => {
          const isActive = ACTIVE_IDS.has(feat.id);
          const isDev = DEV_IDS.has(feat.id);
          if (!isActive && !isDev) return;
          const isHL = feat.id === id;
          overlayCtx.fillStyle = isHL
            ? 'rgba(232, 213, 176, 0.45)'
            : isActive ? 'rgba(200, 169, 110, 0.25)' : 'rgba(122, 99, 71, 0.2)';
          fillGeometry(overlayCtx, feat.geometry, toX, toY);
        });
        overlayTexture.needsUpdate = true;
      } else if (texCtx && canvasTexture) {
        drawTexture(texCtx, countries, id);
        canvasTexture.needsUpdate = true;
      }
    }

    // 3D country borders — drawn directly on sphere, no projection distortion
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x4a3228, transparent: true, opacity: 0.6
    });
    const highlightBorderMat = new THREE.LineBasicMaterial({
      color: 0xfff8f0, transparent: true, opacity: 0.9, linewidth: 2
    });
    const borderLines = [];

    countries.features.forEach(feat => {
      const polys = feat.geometry.type === 'Polygon'
        ? [feat.geometry.coordinates] : feat.geometry.coordinates;
      polys.forEach(rings => {
        rings.forEach(ring => {
          const pts = [];
          let prevLng = null;
          ring.forEach(([lng, lat]) => {
            // Break line at antimeridian crossings
            if (prevLng !== null && Math.abs(lng - prevLng) > 170) {
              if (pts.length > 1) {
                const geo = new THREE.BufferGeometry().setFromPoints(pts);
                const line = new THREE.Line(geo, borderMat);
                line.userData = { countryId: feat.id };
                group.add(line);
                borderLines.push(line);
              }
              pts.length = 0;
            }
            pts.push(latLngToVec3(lat, lng, RADIUS + 0.003));
            prevLng = lng;
          });
          if (pts.length > 1) {
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, borderMat);
            line.userData = { countryId: feat.id };
            group.add(line);
            borderLines.push(line);
          }
        });
      });
    });

    // Update border highlight when country changes
    const origUpdateHighlight = updateHighlight;
    updateHighlight = function(id) {
      origUpdateHighlight(id);
      borderLines.forEach(line => {
        const isHL = line.userData.countryId === id;
        line.material = isHL ? highlightBorderMat : borderMat;
      });
    };

    // Atmosphere (satellite mode only)
    if (satelliteTexture) {
      // Thin bright atmospheric edge — like Google Earth from space
      // Just a subtle bright line at the very limb, not a thick blue haze
      const atmosVert = `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * vec4(vPos, 1.0);
        }
      `;
      // Outer thin glow — the bright atmospheric line visible from space
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS + 0.04, 64, 64),
        new THREE.ShaderMaterial({
          vertexShader: atmosVert,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPos;
            void main() {
              float rim = 1.0 - max(dot(normalize(-vPos), vNormal), 0.0);
              // Very concentrated at the edge — pow 6 keeps it thin
              float glow = pow(rim, 6.0);
              // Bright white-blue like real atmospheric scattering
              vec3 col = mix(vec3(0.5, 0.7, 1.0), vec3(0.8, 0.9, 1.0), rim);
              gl_FragColor = vec4(col, glow * 0.8);
            }
          `,
          transparent: true, side: THREE.BackSide, depthWrite: false,
        })
      ));
      // Inner limb haze — very subtle blue tinge at edges of globe surface
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS + 0.002, 64, 64),
        new THREE.ShaderMaterial({
          vertexShader: atmosVert,
          fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPos;
            void main() {
              float rim = 1.0 - max(dot(normalize(-vPos), vNormal), 0.0);
              float haze = pow(rim, 4.0) * 0.4;
              gl_FragColor = vec4(0.5, 0.7, 1.0, haze);
            }
          `,
          transparent: true, side: THREE.FrontSide, depthWrite: false,
        })
      ));
    } else {
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS + 0.05, 64, 64),
        new THREE.MeshPhongMaterial({ color: 0xc8a96e, transparent: true, opacity: 0.06, side: THREE.BackSide })
      ));
    }

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
      const pos = latLngToVec3(country.lat, country.lng, RADIUS + 0.03);
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
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -1,
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
    let targetZ = camera.position.z;

    if (passive) {
      // Desktop: cursor position shifts camera
      const onPassiveMove = e => {
        const rect = mount.getBoundingClientRect();
        const rawX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const rawY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        const nx = Math.max(-1, Math.min(1, rawX));
        const ny = Math.max(-1, Math.min(1, rawY));
        camTarget.x = nx * 0.35;
        camTarget.y = -ny * 0.25;
      };
      window.addEventListener('mousemove', onPassiveMove);

      // Mobile: scroll position shifts camera vertically
      const onPassiveScroll = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const t = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
        camTarget.y = -t * 0.4 + 0.1; // shift up as user scrolls down
      };
      window.addEventListener('scroll', onPassiveScroll, { passive: true });

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
        targetZ = Math.min(MAX_Z, Math.max(MIN_Z, targetZ + e.deltaY * 0.002));
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

    // Zoom-in animation setup — start far out like a space view
    const ZOOM_START_Z = 14.0;
    const ZOOM_DURATION = 4.0; // seconds
    let zoomElapsed = 0;
    let zoomDone = false;
    if (zoomIn) camera.position.z = ZOOM_START_Z;
    let lastTime = performance.now();

    // Animation loop
    let frameId;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      time += 0.016; // keep fixed step for ripple/breathe animations

      // Zoom-in: slow start, accelerates, then very gentle landing
      if (zoomIn && zoomElapsed < ZOOM_DURATION) {
        zoomElapsed += dt;
        const t = Math.min(zoomElapsed / ZOOM_DURATION, 1);
        const eased = t < 0.4
          ? 2 * Math.pow(t / 0.4, 2) * 0.4
          : 1 - Math.pow(1 - t, 4);
        camera.position.z = ZOOM_START_Z + (BASE_Z - ZOOM_START_Z) * eased;
        if (t >= 1 && !zoomDone) { zoomDone = true; if (onZoomComplete) onZoomComplete(); }
      }

      if (passive) {
        // Passive: globe stays on Italy, camera shifts with cursor
        camCurrent.x += (camTarget.x - camCurrent.x) * 0.02;
        camCurrent.y += (camTarget.y - camCurrent.y) * 0.02;
        camera.position.x = camCurrent.x;
        camera.position.y = camCurrent.y;
        camera.lookAt(0, 0, 0);
      } else {
        // Smooth zoom easing
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        if (!isDragging) {
          // Slow/stop rotation when zoomed in, full speed when zoomed out
          const zoomFactor = Math.min(1, Math.max(0, (camera.position.z - MIN_Z) / (BASE_Z - MIN_Z)));
          const MAX_VEL = 0.005;
          velocity.x = Math.max(-MAX_VEL, Math.min(MAX_VEL, velocity.x));
          velocity.y = Math.max(-MAX_VEL, Math.min(MAX_VEL, velocity.y));
          group.rotation.y += rotationSpeed * zoomFactor + velocity.y;
          group.rotation.x += velocity.x;
          velocity.x *= 0.93;
          velocity.y *= 0.93;
        }
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
