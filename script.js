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

const planeTex = THREE.ImageUtils.loadTexture( "/assets/asphalt.jpg" );
const planeGeo = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshLambertMaterial({ map: planeTex });
const plane = new THREE.Mesh( planeGeo, planeMaterial );
plane.rotation.x = Math.PI / 2;
plane.material.side = THREE.DoubleSide;
scene.add( plane );

renderer.xr.getController(0).addEventListener('squeezestart', () => moving = true);
renderer.xr.getController(0).addEventListener('squeezeend', () => moving = false);

renderer.setAnimationLoop(() => {
  camera.rotation.y += 0.01;
	renderer.render(scene, camera);
});
