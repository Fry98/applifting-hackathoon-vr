import * as THREE from 'https://cdn.skypack.dev/three@latest';
import { VRButton } from 'https://cdn.skypack.dev/three@latest/examples/jsm/webxr/VRButton.js';

const canvas = document.getElementById('canv');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

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

// cube
let cube;
{
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  cube.position.z = -10;
  scene.add(cube);
}

// prison walls
const textureLoader = new THREE.TextureLoader();
const wallPosition = 5;
const roomGeometry = new THREE.PlaneGeometry(wallPosition, wallPosition);
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
  wallLeft.position.x = -wallPosition / 2;
  wallLeft.position.y = wallPosition / 2;
  scene.add(wallLeft);
}
{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallRight = new THREE.Mesh(roomGeometry, material);
  wallRight.rotateY(-Math.PI / 2);
  wallRight.position.x = wallPosition / 2;
  wallRight.position.y = wallPosition / 2;
  scene.add(wallRight);
}
{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallFront = new THREE.Mesh(roomGeometry, material);
  wallFront.rotateY(-Math.PI);
  wallFront.position.z = wallPosition / 2;
  wallFront.position.y = wallPosition / 2;
  scene.add(wallFront);
}
{
  const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/assets/wall.jpeg'), side: THREE.DoubleSide });
  const wallBack = new THREE.Mesh(roomGeometry, material);
  wallBack.rotateY(-Math.PI);
  wallBack.position.z = -wallPosition / 2;
  wallBack.position.y = wallPosition / 2;
  scene.add(wallBack);
}

renderer.setAnimationLoop(() => {
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
});
