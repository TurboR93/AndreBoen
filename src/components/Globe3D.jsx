import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Converts lat/lng to 3D sphere position
function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function Globe3D({ markers = [], onMarkerClick, activeCategory }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 2.8;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Globe
    const RADIUS = 1;
    const globeGeo = new THREE.SphereGeometry(RADIUS, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x1a2332,
      emissive: 0x0a1020,
      specular: 0xc8a96e,
      shininess: 30,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Grid lines (latitude/longitude)
    const gridMat = new THREE.LineBasicMaterial({ color: 0x2a3a52, transparent: true, opacity: 0.5 });
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lng = 0; lng <= 360; lng += 2) {
        points.push(latLngToVec3(lat, lng, RADIUS + 0.002));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        points.push(latLngToVec3(lat, lng, RADIUS + 0.002));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(RADIUS + 0.05, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0xc8a96e,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Markers
    const markerMeshes = [];
    markers.forEach(country => {
      const pos = latLngToVec3(country.lat, country.lng, RADIUS + 0.02);
      const isActive = country.status === 'active';
      const geo = new THREE.SphereGeometry(0.025, 16, 16);
      const mat = new THREE.MeshPhongMaterial({
        color: isActive ? 0xc8a96e : 0xf0c040,
        emissive: isActive ? 0x8a6a2e : 0xa08020,
        shininess: 80,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.userData = country;
      scene.add(mesh);
      markerMeshes.push(mesh);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.03, 0.045, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isActive ? 0xc8a96e : 0xf0c040,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { pulse: true, baseOpacity: 0.4 };
      scene.add(ring);
      markerMeshes.push(ring);
    });

    sceneRef.current = { scene, camera, renderer, globe, markerMeshes };

    // Mouse interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = e => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      rotationVelocity = { x: 0, y: 0 };
    };
    const onMouseMove = e => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      globe.rotation.y += dx * 0.005;
      globe.rotation.x += dy * 0.005;
      markerMeshes.forEach(m => {
        m.rotation.y += dx * 0.005;
        m.rotation.x += dy * 0.005;
      });
      rotationVelocity = { x: dy * 0.005, y: dx * 0.005 };
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = e => {
      if (!isDragging) {
        // check click on marker
        const rect = mount.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(
          markerMeshes.filter(m => !m.userData.pulse)
        );
        if (hits.length > 0 && onMarkerClick) {
          onMarkerClick(hits[0].object.userData);
        }
      }
      isDragging = false;
    };

    // Touch support
    let prevTouch = null;
    const onTouchStart = e => {
      prevTouch = e.touches[0];
      rotationVelocity = { x: 0, y: 0 };
    };
    const onTouchMove = e => {
      if (!prevTouch) return;
      const dx = e.touches[0].clientX - prevTouch.clientX;
      const dy = e.touches[0].clientY - prevTouch.clientY;
      globe.rotation.y += dx * 0.005;
      globe.rotation.x += dy * 0.005;
      markerMeshes.forEach(m => {
        m.rotation.y += dx * 0.005;
        m.rotation.x += dy * 0.005;
      });
      rotationVelocity = { x: dy * 0.003, y: dx * 0.003 };
      prevTouch = e.touches[0];
    };
    const onTouchEnd = () => { prevTouch = null; };

    mount.addEventListener('mousedown', onMouseDown);
    mount.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('touchstart', onTouchStart);
    mount.addEventListener('touchmove', onTouchMove);
    mount.addEventListener('touchend', onTouchEnd);

    // Resize
    const onResize = () => {
      const W2 = mount.clientWidth;
      const H2 = mount.clientHeight;
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

      if (!isDragging) {
        globe.rotation.y += 0.0015 + rotationVelocity.y;
        globe.rotation.x += rotationVelocity.x;
        markerMeshes.forEach(m => {
          m.rotation.y += 0.0015 + rotationVelocity.y;
          m.rotation.x += rotationVelocity.x;
        });
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
      }

      // Pulse rings
      markerMeshes.forEach(m => {
        if (m.userData.pulse) {
          m.material.opacity = m.userData.baseOpacity * (0.5 + 0.5 * Math.sin(time * 2));
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      mount.removeEventListener('mousedown', onMouseDown);
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('touchstart', onTouchStart);
      mount.removeEventListener('touchmove', onTouchMove);
      mount.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [markers]);

  return <div ref={mountRef} className="globe3d" />;
}
