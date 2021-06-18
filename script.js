const WALL_POSITION = 15;

import * as THREE from 'https://cdn.skypack.dev/three@latest';
import { VRButton } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/XRControllerModelFactory.js';

let moving = false;

const canvas = document.getElementById('canv');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y += 3;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip1 = renderer.xr.getControllerGrip(0);
const controllerGrip2 = renderer.xr.getControllerGrip(1);

const model1 = controllerModelFactory.createControllerModel( controllerGrip1 );
controllerGrip1.add(model1);
scene.add(controllerGrip1);

const model2 = controllerModelFactory.createControllerModel( controllerGrip2 );
controllerGrip2.add(model2);
scene.add(controllerGrip2);

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

const light = new THREE.AmbientLight(0x404040);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.z = 1;
scene.add(directionalLight);

const dolly = new THREE.Object3D();
dolly.add(camera);
scene.add(dolly);

// prison walls
const textureLoader = new THREE.TextureLoader();
const roomGeometry = new THREE.PlaneGeometry(WALL_POSITION, WALL_POSITION);

{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/asphalt.jpg') });
  const floor = new THREE.Mesh(roomGeometry, material);
  floor.rotateX(-Math.PI / 2);
  scene.add(floor);
}

{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallLeft = new THREE.Mesh(roomGeometry, material);
  wallLeft.rotateY(-Math.PI / 2);
  wallLeft.position.x = -WALL_POSITION / 2;
  wallLeft.position.y = WALL_POSITION / 2;
  scene.add(wallLeft);
}

{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallRight = new THREE.Mesh(roomGeometry, material);
  wallRight.rotateY(-Math.PI / 2);
  wallRight.position.x = WALL_POSITION / 2;
  wallRight.position.y = WALL_POSITION / 2;
  scene.add(wallRight);
}

{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallFront = new THREE.Mesh(roomGeometry, material);
  wallFront.rotateY(-Math.PI);
  wallFront.position.z = WALL_POSITION / 2;
  wallFront.position.y = WALL_POSITION / 2;
  scene.add(wallFront);
}

{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallBack = new THREE.Mesh(roomGeometry, material);
  wallBack.rotateY(-Math.PI);
  wallBack.position.z = -WALL_POSITION / 2;
  wallBack.position.y = WALL_POSITION / 2;
  scene.add(wallBack);
}

renderer.xr.getController(0).addEventListener('squeezestart', () => moving = true);
renderer.xr.getController(0).addEventListener('squeezeend', () => moving = false);

renderer.setAnimationLoop(() => {
  camera.rotation.y += 0.01;
	renderer.render(scene, camera);
});
