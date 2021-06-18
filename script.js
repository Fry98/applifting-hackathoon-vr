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

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.z = -10;
scene.add(cube);

const light = new THREE.AmbientLight(0x404040);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.z = 1;
scene.add(directionalLight);

const dolly = new THREE.Object3D();
dolly.add(camera);
scene.add(dolly);

const planeTex = THREE.ImageUtils.loadTexture( "/assets/asphalt.jpg" );
const planeGeo = new THREE.PlaneGeometry(5, 5);
const planeMaterial = new THREE.MeshLambertMaterial({ map: planeTex });
const plane = new THREE.Mesh( planeGeo, planeMaterial );
plane.rotation.x = Math.PI / 2;
plane.material.side = THREE.DoubleSide;
scene.add( plane );

renderer.setAnimationLoop(() => {
  cube.rotation.y += 0.01;
	renderer.render(scene, camera);
});
