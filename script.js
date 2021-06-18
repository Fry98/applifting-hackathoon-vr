const WALL_POSITION = 10;

import * as THREE from 'https://cdn.skypack.dev/three@latest';
import { VRButton } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/XRControllerModelFactory.js';

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

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

const dolly = new THREE.Object3D();
dolly.add(camera);
dolly.add(controllerGrip1);
dolly.add(controllerGrip2);
scene.add(dolly);

// prison walls
const textureLoader = new THREE.TextureLoader();
const roomGeometry = new THREE.PlaneGeometry(WALL_POSITION, WALL_POSITION);
const wallTex = textureLoader.load('/assets/wall.jpeg');
wallTex.repeat.set(5, 5);
wallTex.wrapS = THREE.RepeatWrapping;
wallTex.wrapT = THREE.RepeatWrapping;

{
  const floorTex = textureLoader.load('/assets/asphalt.jpg');
  floorTex.repeat.set(3, 3);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshBasicMaterial({ map: floorTex });
  const floor = new THREE.Mesh(roomGeometry, material);
  floor.rotateX(-Math.PI / 2);
  scene.add(floor);
}

{
  const material = new THREE.MeshBasicMaterial({ map: wallTex });
  const wallRight = new THREE.Mesh(roomGeometry, material);
  wallRight.rotateY(-Math.PI / 2);
  wallRight.position.x = WALL_POSITION / 2;
  wallRight.position.y = WALL_POSITION / 2;
  scene.add(wallRight);
}

{
  const material = new THREE.MeshBasicMaterial({ map: wallTex });
  const wallLeft = new THREE.Mesh(roomGeometry, material);
  wallLeft.rotateY(Math.PI / 2);
  wallLeft.position.x = -WALL_POSITION / 2;
  wallLeft.position.y = WALL_POSITION / 2;
  scene.add(wallLeft);
}

{
  const material = new THREE.MeshBasicMaterial({ map: wallTex });
  const wallFront = new THREE.Mesh(roomGeometry, material);
  wallFront.rotateY(-Math.PI);
  wallFront.position.z = WALL_POSITION / 2;
  wallFront.position.y = WALL_POSITION / 2;
  scene.add(wallFront);
}

{
  const material = new THREE.MeshBasicMaterial({ map: wallTex });
  const wallBack = new THREE.Mesh(roomGeometry, material);
  wallBack.position.z = -WALL_POSITION / 2;
  wallBack.position.y = WALL_POSITION / 2;
  scene.add(wallBack);
}

const controller = renderer.xr.getController(1);
controller.addEventListener('squeezestart', () => moving = true);
controller.addEventListener('squeezeend', () => moving = false);

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
