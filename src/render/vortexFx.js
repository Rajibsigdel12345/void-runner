// ST-059: gravity vortex FX - telegraph pulses + rotating spiral disk. No
// assets: the spiral is a generated canvas texture. Mirrors the core phase
// machine (telegraph -> active -> fade) but is presentation-only.
import * as THREE from 'three';

function makeSpiralTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  const grad = g.createRadialGradient(0, 0, 4, 0, 0, S / 2);
  grad.addColorStop(0, 'rgba(190,160,255,0.95)');
  grad.addColorStop(0.55, 'rgba(140,100,255,0.5)');
  grad.addColorStop(1, 'rgba(90,60,200,0)');
  g.strokeStyle = grad;
  g.lineCap = 'round';
  g.lineWidth = 8;
  for (let arm = 0; arm < 3; arm++) {
    g.beginPath();
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const a = t * Math.PI * 2.6 + (arm * Math.PI * 2) / 3;
      const r = 4 + t * (S / 2 - 8);
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createVortexFx(scene, cfg) {
  const R = cfg.radius;
  const telDur = cfg.telegraph;
  const tex = makeSpiralTexture();
  const group = new THREE.Group();
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  disk.rotation.x = -Math.PI / 2;
  disk.scale.setScalar(R);
  disk.position.y = 0.15;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.985, 1, 64),
    new THREE.MeshBasicMaterial({ color: 0x9d7bff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.scale.setScalar(R);
  ring.position.y = 0.12;
  group.add(disk, ring);
  group.visible = false;
  scene.add(group);

  let phase = 'idle'; // idle | telegraph | active | fade
  let t = 0;

  function place(pos) { group.position.set(pos.x, 0, pos.y); }
  function onTelegraph(pos) { place(pos); phase = 'telegraph'; t = 0; group.visible = true; }
  function onStart(pos) { place(pos); phase = 'active'; t = 0; group.visible = true; }
  function onEnd() { phase = 'fade'; t = 0; }
  function hide() {
    phase = 'idle'; t = 0; group.visible = false;
    disk.material.opacity = 0; ring.material.opacity = 0;
  }
  function update(dt) {
    if (phase === 'idle') return;
    t += dt;
    if (phase === 'telegraph') {
      const u = Math.min(1, t / telDur);
      disk.material.opacity = 0.55 * u;
      const pulse = (t * 2 / telDur) % 1; // two warning pulses
      ring.scale.setScalar(R * (0.35 + 0.65 * pulse));
      ring.material.opacity = 0.7 * (1 - pulse);
    } else if (phase === 'active') {
      disk.material.opacity = 0.55;
      disk.rotation.z += dt * 1.6; // swirl
      ring.scale.setScalar(R * (1 + 0.02 * Math.sin(t * 5)));
      ring.material.opacity = 0.55;
    } else if (phase === 'fade') {
      const u = Math.max(0, 1 - t / 0.5);
      disk.material.opacity = 0.55 * u;
      ring.material.opacity = 0.55 * u;
      if (t >= 0.5) { phase = 'idle'; group.visible = false; }
    }
  }
  return { group, onTelegraph, onStart, onEnd, hide, update };
}
