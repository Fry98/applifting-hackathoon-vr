const WALL_WIDTH = 40;
const WALL_HEIGHT = 5;
const VEC_UP = new THREE.Vector3(0, 1, 0);

import * as THREE from 'https://cdn.skypack.dev/three@latest';
import { VRButton } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@latest/examples/jsm/loaders/GLTFLoader.js';

let moving = false;
let gamepad = null;

const canvas = document.getElementById('canv');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y += 3;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

const controllerModelFactory = new XRControllerModelFactory();
const controllerGripWheel = renderer.xr.getControllerGrip(0);
const controllerGripCan = renderer.xr.getControllerGrip(1);

const oculusModel = controllerModelFactory.createControllerModel(controllerGripWheel);
controllerGripWheel.add(oculusModel);
scene.add(controllerGripWheel);

const gltfLoader = new GLTFLoader().setPath('/assets/can/');
gltfLoader.load('scene.gltf', (gltf) => {
  const model = gltf.scene;
  const size = 0.04;
  model.rotateX(-Math.PI / 2);
  model.rotateY(Math.PI / 2);
  model.translateY(-0.1);
  model.scale.set(size, size, size);
  controllerGripCan.add(model);
});

scene.add(controllerGripCan);

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
  '/assets/skybox/skybox_px.png',
  '/assets/skybox/skybox_nx.png',
  '/assets/skybox/skybox_py.png',
  '/assets/skybox/skybox_ny.png',
  '/assets/skybox/skybox_pz.png',
  '/assets/skybox/skybox_nz.png',
]);
scene.background = texture;

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

const dolly = new THREE.Object3D();
dolly.add(controllerGripWheel);
dolly.add(controllerGripCan);
dolly.add(camera);
scene.add(dolly);

// prison walls
const textureLoader = new THREE.TextureLoader();
const wallGeometry = new THREE.PlaneGeometry(WALL_WIDTH, WALL_HEIGHT);
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const wallTex = textureLoader.load('/assets/wall.jpeg');

wallTex.repeat.set(32, 4);
wallTex.wrapS = THREE.RepeatWrapping;
wallTex.wrapT = THREE.RepeatWrapping;

{
  const floorTex = textureLoader.load('/assets/asphalt2.jpg');
  floorTex.repeat.set(15, 15);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshBasicMaterial({ map: floorTex });
  const floor = new THREE.Mesh(floorGeometry, material);
  floor.rotateX(-Math.PI / 2);
  scene.add(floor);
}

{
  const material = new THREE.MeshBasicMaterial({ map: wallTex });
  const wallBack = new THREE.Mesh(wallGeometry, material);
  wallBack.position.z = -5;
  wallBack.position.y = WALL_HEIGHT / 2;
  scene.add(wallBack);
}

// const listener = new THREE.AudioListener();
// camera.add(listener);
// const sound = new THREE.Audio(listener);
// const audioLoader = new THREE.AudioLoader();
// audioLoader.load('/assets/sounds/spray.mp3', function (buffer) {
//   sound.setBuffer(buffer);
// });
//
// const controllerCan = renderer.xr.getController(1);
// controllerCan.addEventListener('squeezestart', () => (moving = true));
// controllerCan.addEventListener('squeezeend', () => (moving = false));
// controllerCan.addEventListener('selectstart', () => {
//   sound.setLoop(true);
//   sound.setVolume(0.5);
//   sound.play();
// });
// controllerCan.addEventListener('selectend', () => {
//   sound.setLoop(false);
// });

const controller = renderer.xr.getController(1);
controller.addEventListener('squeezestart', () => (moving = true));
controller.addEventListener('squeezeend', () => (moving = false));

controllerGripCan.addEventListener('connected', e => {
  if (!e.data.gamepad) return;
  gamepad = e.data.gamepad;
});

const fog = new THREE.Fog('#c2bbac', 5, 25);
scene.fog = fog;

renderer.setAnimationLoop(() => {
  if (moving) {
    const dirVec = new THREE.Vector3(0.0, 0.0, -1.0);
    dirVec.applyQuaternion(controller.quaternion);
    dirVec.applyAxisAngle(VEC_UP, dolly.rotation.y);

    const mvVec = new THREE.Vector2(dirVec.x, dirVec.z);
    mvVec.normalize();
    dolly.position.x += mvVec.x * 0.03;
    dolly.position.z += mvVec.y * 0.03;
  }

  if (gamepad) {
    dolly.rotateY(-gamepad.axes[2] * 0.02);
  }

  camera.rotation.y += 0.004;
  renderer.render(scene, camera);
});
