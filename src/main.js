// Void Runner - boot (I06: ship + mouse aim + follow camera)
import * as THREE from 'three';
import { createStarfield } from './render/starfield.js';
import { createShipMesh } from './render/shipMesh.js';
import { createInput } from './render/input.js';
import { createBulletPool } from './render/bulletPool.js';
import { Weapons } from './core/weapons.js';
import { Ship } from './core/ship.js';
import { damp } from './core/math.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060f);
scene.fog = new THREE.Fog(0x04060f, 60, 240);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

scene.add(new THREE.HemisphereLight(0x33437a, 0x04060f, 0.55));
scene.add(new THREE.AmbientLight(0x8899ff, 0.35));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(6, 12, 4);
scene.add(dir);

const grid = new THREE.PolarGridHelper(26, 12, 8, 64, 0x1b2a55, 0x101a38);
scene.add(grid);

const stars = createStarfield(1337);
scene.add(stars);

// --- gameplay entities (I08: ship + weapons) ---
const ship = new Ship(0, 0);
const weapons = new Weapons();
const shipMesh = createShipMesh();
scene.add(shipMesh.group);

const bullets = createBulletPool(scene);

const input = createInput();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aimWorld = new THREE.Vector3();

// follow-camera state
const camPos = { x: 0, y: 9, z: 13 };
const camLook = { x: 0, y: 0, z: 0 };

window.__vr = { ship, weapons }; // debug/test handle (expanded in I080)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);

  let aimPoint = null;
  if (input.pointer.active) {
    raycaster.setFromCamera(input.pointer.ndc, camera);
    if (raycaster.ray.intersectPlane(groundPlane, aimWorld)) {
      aimPoint = { x: aimWorld.x, y: aimWorld.z };
    }
  }

  ship.step(dt, input.state.thrust, aimPoint);
  if (input.state.firing) weapons.fire(ship.pos, ship.aim);
  weapons.step(dt);
  bullets.sync(weapons);
  shipMesh.sync(ship);

  const f = ship.forward();
  camPos.x = damp(camPos.x, ship.pos.x, 5, dt);
  camPos.y = damp(camPos.y, 9, 5, dt);
  camPos.z = damp(camPos.z, ship.pos.y + 13, 5, dt);
  camLook.x = damp(camLook.x, ship.pos.x + f.x * 4, 6, dt);
  camLook.y = damp(camLook.y, 0, 6, dt);
  camLook.z = damp(camLook.z, ship.pos.y + f.y * 4, 6, dt);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camLook.x, camLook.y, camLook.z);

  stars.rotation.y += dt * 0.004;
  renderer.render(scene, camera);
}
frame();

