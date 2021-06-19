const WALL_POSITION = 10;
const WALL_HEIGHT = 5;
const CLOUDS = true;

import * as THREE from 'https://cdn.skypack.dev/three@latest';
import { VRButton } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@latest/examples/jsm/loaders/GLTFLoader.js';

let moving = false;

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
dolly.add(camera);
dolly.add(controllerGripWheel);
dolly.add(controllerGripCan);
scene.add(dolly);

// prison walls
const textureLoader = new THREE.TextureLoader();
const wallGeometry = new THREE.PlaneGeometry(WALL_POSITION, WALL_HEIGHT);
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const wallTex = textureLoader.load('/assets/wall.jpeg');

wallTex.repeat.set(4, 2);
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
  wallBack.position.z = -WALL_POSITION / 2;
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

const fog = new THREE.Fog('#c2bbac', 8, 16);
scene.fog = fog;

// add cloud
function initCloud(y) {
  const cloudGeometry = new THREE.PlaneGeometry(1, 1);

  const cloudTex = textureLoader.load('/assets/cloud.png');
  cloudTex.repeat.set(1, 1);
  const cloudMaterial = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false /* important for overlaying meshes */ });
  const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloud.position.y = 40 + y;
  cloud.rotation.y = Math.random() * Math.PI;
  const spread = 120;
  cloud.position.x = Math.random() * spread - Math.random() * spread;
  cloud.position.z = Math.random() * spread - Math.random() * spread;
  cloud.rotateX(Math.PI / 2);
  cloud.scale.x = 15 + y;
  cloud.scale.y = 15 + y;
  return {cloud, y};
}

function initClouds(numberOfClouds) {
  // init number of clouds 
  const clouds = [];
  for(let i = 0; i < numberOfClouds; i++) {
    clouds.push(initCloud(30 - i));
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
    const dirVec = new THREE.Vector3(0.0, 0.0, -1.0);
    dirVec.applyQuaternion(controller.quaternion);
    const mvVec = new THREE.Vector2(dirVec.x, dirVec.z);
    mvVec.normalize();
    dolly.position.x += mvVec.x * 0.03;
    dolly.position.z += mvVec.y * 0.03;
  }

  camera.rotation.y += 0.004;

  // the boundary after which clouds should respawn
  const spawnDistance = 100; 

  // move clouds
  for(const cloud of clouds) {
    if(cloud.cloud.position.x < spawnDistance) {
      cloud.cloud.position.x += 0.001 * (cloud.y - 10);
      // seamlessly transition from opacity 0 to opacity 1 and back to 0 when clouds are moving from spawnpoint to despawnpoint
      cloud.cloud.material.opacity = Math.cos(Math.PI * (1/(spawnDistance*2/cloud.cloud.position.x))); 
      cloud.cloud.rotation.z += 0.0003;
    } else {
      cloud.cloud.position.x -= spawnDistance * 2;
    }
  } 

  renderer.render(scene, camera);
});
