const WALL_POSITION = 10;
const WALL_HEIGHT = 5;

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

const gltfLoader = new GLTFLoader();
gltfLoader.load('/assets/can.glb', gltf => {
  const model = gltf.scene;
  model.rotateX(-Math.PI / 2);
  model.translateY(-0.1);
  const size = 0.04;
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

const controller = renderer.xr.getController(1);
controller.addEventListener('squeezestart', () => moving = true);
controller.addEventListener('squeezeend', () => moving = false);

const fog = new THREE.Fog('#c2bbac', 8, 16);
scene.fog = fog;

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
  renderer.render(scene, camera);
});
