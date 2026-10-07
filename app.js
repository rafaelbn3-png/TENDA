import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/webxr/VRButton.js';
import { DeviceOrientationControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/DeviceOrientationControls.js';

const BASE = './APARTAMENTO/';
const environments = [
  { id: 'sala', name: 'Sala', file: 'SALA_A.jpg', links: [
    { label: 'Cozinha', target: 'cozinha', yaw: -34 },
    { label: 'Corredor', target: 'corredor', yaw: 26 }
  ]},
  { id: 'cozinha', name: 'Cozinha', file: 'COZINHA_A.jpg', links: [
    { label: 'Sala', target: 'sala', yaw: 150 },
    { label: 'Corredor', target: 'corredor', yaw: -35 }
  ]},
  { id: 'corredor', name: 'Corredor', file: 'CORREDOR_A.jpg', links: [
    { label: 'Sala', target: 'sala', yaw: 155 },
    { label: 'Banheiro', target: 'banheiro', yaw: -72 },
    { label: 'Quarto casal', target: 'quarto-casal', yaw: 38 },
    { label: 'Quarto solteiro', target: 'quarto-solteiro', yaw: 78 }
  ]},
  { id: 'banheiro', name: 'Banheiro', file: 'BANHEIRO_A.jpg', links: [
    { label: 'Corredor', target: 'corredor', yaw: 175 }
  ]},
  { id: 'quarto-casal', name: 'Quarto casal', file: 'QUARTO_CASAL_A.jpg', links: [
    { label: 'Corredor', target: 'corredor', yaw: 170 }
  ]},
  { id: 'quarto-solteiro', name: 'Quarto solteiro', file: 'QUARTO_SOLTEIRO_A.jpg', links: [
    { label: 'Corredor', target: 'corredor', yaw: 170 }
  ]}
];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const loader = new THREE.TextureLoader();
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(50, 64, 40),
  new THREE.MeshBasicMaterial({ side: THREE.BackSide })
);
scene.add(sphere);
let current = environments[0];
let dragging = false, lastX = 0, lastY = 0;
const buttonWasPressed = new Map();
const orientationControls = new DeviceOrientationControls(camera);
orientationControls.enabled = false;
let orientationActive = false;

const motionButton = document.querySelector('#motion-button');
const motionStatus = document.querySelector('#motion-status');
const isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const supportsDeviceOrientation = 'DeviceOrientationEvent' in globalThis;
motionButton.hidden = !(isMobileBrowser && supportsDeviceOrientation);

async function enableDeviceOrientation() {
  const button = motionButton;
  const status = motionStatus;
  button.disabled = true;

  try {
    // iOS requires these permissions to be requested from a user gesture.
    const permissionRequests = [];
    if (typeof globalThis.DeviceOrientationEvent?.requestPermission === 'function') {
      permissionRequests.push(globalThis.DeviceOrientationEvent.requestPermission());
    }
    if (typeof globalThis.DeviceMotionEvent?.requestPermission === 'function') {
      permissionRequests.push(globalThis.DeviceMotionEvent.requestPermission());
    }
    const permissions = await Promise.all(permissionRequests);
    if (permissions.some((permission) => permission !== 'granted')) {
      throw new Error('Permissão de sensores recusada.');
    }

    orientationControls.connect();
    orientationControls.enabled = true;
    orientationActive = true;
    button.hidden = true;
    status.textContent = 'Movimento ativado';
    status.hidden = false;
  } catch (error) {
    button.disabled = false;
    status.textContent = 'Não foi possível ativar o movimento. Verifique as permissões do navegador e use HTTPS.';
    status.hidden = false;
    console.warn(error);
  }
}

function updateMenu() {
  document.querySelector('#environment-name').textContent = current.name;
  const menu = document.querySelector('#menu');
  menu.replaceChildren();
  for (const env of environments) {
    const button = document.createElement('button');
    button.textContent = env.name;
    button.className = env.id === current.id ? 'active' : '';
    button.onclick = () => loadEnvironment(env.id);
    menu.appendChild(button);
  }
}

function loadEnvironment(id) {
  const next = environments.find((item) => item.id === id);
  if (!next) return;
  document.querySelector('#loading').hidden = false;
  loader.load(BASE + next.file, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    sphere.material.map = texture;
    sphere.material.needsUpdate = true;
    current = next;
    updateMenu();
    document.querySelector('#loading').hidden = true;
  }, undefined, (error) => {
    document.querySelector('#loading').hidden = true;
    const box = document.querySelector('#error');
    box.hidden = false;
    box.textContent = `Não foi possível carregar ${next.file}. Verifique se o servidor está rodando na pasta do projeto.`;
    console.error(error);
  });
}

function changeEnvironment(step) {
  const index = environments.findIndex((item) => item.id === current.id);
  const nextIndex = (index + step + environments.length) % environments.length;
  loadEnvironment(environments[nextIndex].id);
}

function pollQuestButtons() {
  const session = renderer.xr.getSession();
  if (!session) return;

  for (const source of session.inputSources) {
    if (!source.gamepad || !source.handedness) continue;
    const buttons = source.gamepad.buttons;
    // Standard XR mapping: button 4/5 are A-X and B-Y on Quest controllers.
    const mappings = source.handedness === 'right'
      ? [[4, 1], [5, -1]] // A: next, B: previous
      : [[4, -1], [5, 1]]; // X: previous, Y: next

    for (const [buttonIndex, step] of mappings) {
      const key = `${source.handedness}-${buttonIndex}`;
      const pressed = Boolean(buttons[buttonIndex]?.pressed);
      if (pressed && !buttonWasPressed.get(key)) changeEnvironment(step);
      buttonWasPressed.set(key, pressed);
    }
  }
}

renderer.domElement.addEventListener('pointerdown', (event) => { dragging = true; lastX = event.clientX; lastY = event.clientY; });
renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging || renderer.xr.isPresenting || orientationActive) return;
  camera.rotation.y -= (event.clientX - lastX) * .004;
  camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - (event.clientY - lastY) * .004, -Math.PI / 2, Math.PI / 2);
  lastX = event.clientX; lastY = event.clientY;
});

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
updateMenu();
loadEnvironment('sala');
motionButton.addEventListener('click', enableDeviceOrientation);
renderer.setAnimationLoop(() => {
  pollQuestButtons();
  if (orientationActive && !renderer.xr.isPresenting) orientationControls.update();
  renderer.render(scene, camera);
});
