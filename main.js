import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const groundGeometry = new THREE.PlaneGeometry(50, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const runnerGeometry = new THREE.BoxGeometry(1, 2, 1);
const runnerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const runner = new THREE.Mesh(runnerGeometry, runnerMaterial);
runner.position.set(0, 1, 0);
scene.add(runner);

let speed = 0.2;
let moveLeft = false;
let moveRight = false;
const horizontalSpeed = 0.15; 

window.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'A') moveLeft = true;
    if (event.key === 'd' || event.key === 'D') moveRight = true;
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'a' || event.key === 'A') moveLeft = false;
    if (event.key === 'd' || event.key === 'D') moveRight = false;
});

function animate() {
    requestAnimationFrame(animate);
    
    runner.position.z -= speed;
    
    if (moveLeft) runner.position.x -= horizontalSpeed;
    if (moveRight) runner.position.x += horizontalSpeed;

    camera.position.z -= speed;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
