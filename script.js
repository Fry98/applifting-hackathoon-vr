const WALL_WIDTH = 40;
const WALL_HEIGHT = 5;
const VEC_UP = new THREE.Vector3(0.0, 1.0, 0.0);
const VEC_FWD = new THREE.Vector3(0.0, 0.0, -1.0);
const CLOUDS = true;

import * as THREE from 'https://cdn.skypack.dev/three@latest';
import { VRButton } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@latest/examples/jsm/loaders/GLTFLoader.js';

let spraying = false;
let moving = false;
let gamepad = null;

const spraySfx = new Audio("/assets/spray.ogg");
spraySfx.loop = true;

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

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('/assets/spray.ogg', function (buffer) {
  sound.setVolume(0.7);
  sound.setLoop(true);
  sound.setBuffer(buffer);
});

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
  const floorTex = textureLoader.load('/assets/asphalt.jpg');
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

const controller = renderer.xr.getController(1);
controller.addEventListener('squeezestart', () => (moving = true));
controller.addEventListener('squeezeend', () => (moving = false));
controller.addEventListener('selectstart', () => {
  sound.play();
  spraying = true;
});
controller.addEventListener('selectend', () => {
  sound.stop();
  spraying = false;
});

controllerGripCan.addEventListener('connected', e => {
  if (!e.data.gamepad) return;
  gamepad = e.data.gamepad;
});

const fog = new THREE.Fog('#c2bbac', 5, 25);
scene.fog = fog;

// spray particles
const sprayParticleTex = textureLoader.load('/assets/cloud.png');

const sprayParticles = [];
function createSprayParticle() {
  const sprayMaterial = new THREE.SpriteMaterial({map: sprayParticleTex, transparent: true, opacity: 1});
  const sprayParticle = new THREE.Sprite(sprayMaterial);
  sprayParticle.position.x = dolly.position.x + controller.position.x;
  sprayParticle.position.y = dolly.position.y + controller.position.y;
  sprayParticle.position.z = dolly.position.z + controller.position.z;
  const initScale = 0.01;
  sprayParticle.scale.x = initScale;
  sprayParticle.scale.y = initScale;
  sprayParticle.scale.x = initScale;
  sprayParticle.material.rotation = Math.PI * Math.random();
  scene.add(sprayParticle);

  const target = new THREE.Vector3();
  controller.getWorldDirection(target);
  target.multiplyScalar(-1);

  const upVec = new THREE.Vector3(0, 1, 0);
  upVec.applyQuaternion(controller.quaternion);
  target.addScaledVector(upVec, -0.8);

  sprayParticle.position.x += upVec.x * 0.1;
  sprayParticle.position.y += upVec.y * 0.1;
  sprayParticle.position.z += upVec.z * 0.1;

  return {object: sprayParticle, live: 1, moveVector: target }
}

// add cloud
const cloudGeometry = new THREE.PlaneGeometry(1, 1);
const cloudTex = textureLoader.load('/assets/cloud.png');
cloudTex.repeat.set(1, 1);
const cloudMaterial = new THREE.MeshBasicMaterial({
  map: cloudTex, transparent: true, depthWrite: false
});

function initCloud(y) {
  const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloud.position.y = 40 + y * 1.5;
  cloud.rotation.y = Math.random() * Math.PI;
  const spread = 200;
  cloud.position.x = Math.random() * spread - Math.random() * spread;
  cloud.position.z = Math.random() * spread - Math.random() * spread;
  cloud.rotateX(Math.PI / 2);
  cloud.scale.x = 30 + y * 1.5;
  cloud.scale.y = 30 + y * 1.5;
  const rotationDelta = Math.random();
  return {cloud, y, rotationDelta};
}

function initClouds(numberOfClouds) {
  // init number of clouds
  const clouds = [];
  for(let i = 0; i < numberOfClouds; i++) {
    clouds.push(initCloud(i));
    scene.add(clouds[i].cloud);
  }
  return clouds;
}

let clouds = [];
if(CLOUDS) {
  clouds = initClouds(30);
}

renderer.setAnimationLoop(() => {
  if (moving) {
    const target = new THREE.Vector3();
    controller.getWorldDirection(target);
    target.y = 0;
    target.normalize();

    const moveVec = VEC_FWD.clone();
    moveVec.multiplyScalar(target.z);
    moveVec.addScaledVector(new THREE.Vector3(-VEC_FWD.z, 0, VEC_FWD.x), -target.x);
    moveVec.normalize();

    dolly.position.x += 0.02 * moveVec.x;
    dolly.position.z += 0.02 * moveVec.z;
  }

  if (gamepad) {
    const angle = -gamepad.axes[2] * 0.02;
    dolly.rotateY(angle);
    VEC_FWD.applyAxisAngle(VEC_UP, angle);
  }

  camera.rotation.y += 0.004;

  // the boundary after which clouds should respawn
  const spawnDistance = 200;

  // move clouds
  for(const cloud of clouds) {
    if(cloud.cloud.position.x < spawnDistance) {
      cloud.cloud.position.x += 0.002 * (cloud.y);
      // seamlessly transition from opacity 0 to opacity 1 and back to 0 when clouds are moving from spawnpoint to despawnpoint
      cloud.cloud.material.opacity = Math.cos(Math.PI * (1/(spawnDistance*2/cloud.cloud.position.x)));
      cloud.cloud.rotation.z += 0.0003 * cloud.rotationDelta;
    } else {
      cloud.cloud.position.x -= spawnDistance * 2;
    }
  }

  if(spraying) {
    sprayParticles.push(createSprayParticle());
  }

  for(const sprayParticle of sprayParticles) {
    sprayParticle.object.position.x += (0.03 * sprayParticle.moveVector.x);
    sprayParticle.object.position.y += (0.03 * sprayParticle.moveVector.y);
    sprayParticle.object.position.z += (0.03 * sprayParticle.moveVector.z);
    sprayParticle.object.scale.x += 0.006;
    sprayParticle.object.scale.y += 0.006;
    sprayParticle.object.scale.z += 0.006;
    sprayParticle.live -= 0.03;
    sprayParticle.object.material.opacity = Math.min(1, Math.max(0, sprayParticle.live * sprayParticle.live));

    if(sprayParticle.live <= 0) { scene.remove(sprayParticle.object); };
  }

  renderer.render(scene, camera);
});

