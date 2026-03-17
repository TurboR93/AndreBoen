import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function Globe3D({ markers = [], onMarkerClick }) {
  const mountRef = useRef(null);

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
    camera.position.z = 2.8;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Group: everything that rotates together
    const group = new THREE.Group();
    scene.add(group);

    // Globe sphere
    const RADIUS = 1;
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x1a2332,
        emissive: 0x0a1020,
        specular: 0xc8a96e,
        shininess: 30,
      })
    );
    group.add(globe);

    // Grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x2a3a52, transparent: true, opacity: 0.5 });
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = [];
      for (let lng = 0; lng <= 360; lng += 2) pts.push(latLngToVec3(lat, lng, RADIUS + 0.002));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 2) pts.push(latLngToVec3(lat, lng, RADIUS + 0.002));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    // Atmosphere glow
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS + 0.05, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0xc8a96e, transparent: true, opacity: 0.06, side: THREE.BackSide })
    ));

    // Markers — added to the group so they rotate with the globe
    const ringMeshes = [];
    markers.forEach(country => {
      const pos = latLngToVec3(country.lat, country.lng, RADIUS + 0.02);
      const isActive = country.status === 'active';

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        new THREE.MeshPhongMaterial({
          color: isActive ? 0xc8a96e : 0xf0c040,
          emissive: isActive ? 0x8a6a2e : 0xa08020,
          shininess: 80,
        })
      );
      dot.position.copy(pos);
      dot.userData = country;
      group.add(dot);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.03, 0.045, 32),
        new THREE.MeshBasicMaterial({
          color: isActive ? 0xc8a96e : 0xf0c040,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        })
      );
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { pulse: true, baseOpacity: 0.4 };
      group.add(ring);
      ringMeshes.push(ring);
    });

    // Collect only dot meshes for raycasting
    const dotMeshes = markers.map((_, i) => group.children.find(
      c => c.userData === markers[i]
    )).filter(Boolean);

    // Mouse drag
    let isDragging = false;
    let didDrag = false;
    let prevMouse = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = e => {
      isDragging = true;
      didDrag = false;
      prevMouse = { x: e.clientX, y: e.clientY };
      velocity = { x: 0, y: 0 };
    };
    const onMouseMove = e => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
      group.rotation.y += dx * 0.005;
      group.rotation.x += dy * 0.005;
      velocity = { x: dy * 0.005, y: dx * 0.005 };
      prevMouse = { x: e.clientX, y: e.clientY };
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

    // Touch
    let prevTouch = null;
    const onTouchStart = e => {
      prevTouch = e.touches[0];
      velocity = { x: 0, y: 0 };
    };
    const onTouchMove = e => {
      if (!prevTouch) return;
      const dx = e.touches[0].clientX - prevTouch.clientX;
      const dy = e.touches[0].clientY - prevTouch.clientY;
      group.rotation.y += dx * 0.005;
      group.rotation.x += dy * 0.005;
      velocity = { x: dy * 0.003, y: dx * 0.003 };
      prevTouch = e.touches[0];
    };
    const onTouchEnd = () => { prevTouch = null; };

    mount.addEventListener('mousedown', onMouseDown);
    mount.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('touchstart', onTouchStart);
    mount.addEventListener('touchmove', onTouchMove);
    mount.addEventListener('touchend', onTouchEnd);

    const onResize = () => {
      const W2 = mount.clientWidth;
      const H2 = mount.clientHeight;
      if (!W2 || !H2) return;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    let frameId;
    let time = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.016;

      if (!isDragging) {
        group.rotation.y += 0.0015 + velocity.y;
        group.rotation.x += velocity.x;
        velocity.x *= 0.95;
        velocity.y *= 0.95;
      }

      ringMeshes.forEach(r => {
        r.material.opacity = r.userData.baseOpacity * (0.5 + 0.5 * Math.sin(time * 2));
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — markers are static

  return <div ref={mountRef} className="globe3d" />;
}
