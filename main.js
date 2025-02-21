import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 10);

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

const groundSegments = [];
const numSegments = 5;
const segmentLength = 50;
const groundWidth = 10;
const xBoundary = groundWidth / 2 - 1;

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

for (let i = 0; i < numSegments; i++) {
    const groundGeometry = new THREE.PlaneGeometry(groundWidth, segmentLength);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -i * segmentLength);
    scene.add(ground);
    groundSegments.push(ground);
}


function createRobotRunner() {
    // body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5); 
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 }); 
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // head
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 }); 
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.5, 0); 

    // arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1); 
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    
    leftArm.position.set(-0.6, 0.5, 0); 
    rightArm.position.set(0.6, 0.5, 0); 
    
    // legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    
    leftLeg.position.set(-0.3, -0.75, 0); 
    rightLeg.position.set(0.3, -0.75, 0); 
    
    // group robot
    const robot = new THREE.Group();
    robot.add(body);
    robot.add(head);
    robot.add(leftArm);
    robot.add(rightArm);
    robot.add(leftLeg);
    robot.add(rightLeg);
    
    return robot;
}
const runner = createRobotRunner();
runner.position.set(0, 1.15, 0);
scene.add(runner);

let speed = 0.2;
let moveLeft = false;
let moveRight = false;
const horizontalSpeed = 0.15;

let isJumping = false;
let velocityY = 0;
const gravity = 0.01;
const jumpStrength = 0.3;

// obstacles
const obstacles = [];
const skyObstacles = [];
const numObstacles = 10;

function createGroundObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    
    const randomX = (Math.random() - 0.5) * (groundWidth - 2);
    const randomZ = Math.random() * numSegments * segmentLength + 20;
    
    obstacle.position.set(randomX, 0.75, -randomZ);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createSkyObstacle() {
    const skyGeometry = new THREE.SphereGeometry(1, 32, 32);
    const skyMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow for visibility
    const skyObstacle = new THREE.Mesh(skyGeometry, skyMaterial);
    
    const randomX = (Math.random() - 0.5) * (groundWidth - 2);
    const randomY = 3.15; 
    const randomZ = Math.random() * numSegments * segmentLength + 20;
    
    skyObstacle.position.set(randomX, randomY, -randomZ);
    scene.add(skyObstacle);
    skyObstacles.push(skyObstacle);
}

for (let i = 0; i < numObstacles; i++) {
    createGroundObstacle();
    createSkyObstacle();
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'A') moveLeft = true;
    if (event.key === 'd' || event.key === 'D') moveRight = true;
    if (event.key === 'w' || event.key === 'W') {
        if (!isJumping) {
            velocityY = jumpStrength;
            isJumping = true;
        }
    }
    if (event.key === 's' || event.key === 'S') {
        runner.scale.y = 0.5;
        runner.position.y = 0.75;  
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'a' || event.key === 'A') moveLeft = false;
    if (event.key === 'd' || event.key === 'D') moveRight = false;
    if (event.key === 's' || event.key === 'S') {
        runner.scale.y = 1;
        runner.position.y = 1.15;
    }
});

function checkCollision() {
    obstacles.forEach(obstacle => {
        const distance = runner.position.distanceTo(obstacle.position);
        if (distance < 2) { 
            handleCollision();
        }
    });

    skyObstacles.forEach(skyObstacle => {
        const distance = runner.position.distanceTo(skyObstacle.position);
        if ((distance < 2.1) && runner.position.y >= 1.15) { 
            handleCollision();
        }
    });
}

function handleCollision() {
    speed = 0; 
}

function animate() {
    requestAnimationFrame(animate);

    runner.position.z -= speed;
    
    if (moveLeft) runner.position.x -= horizontalSpeed;
    if (moveRight) runner.position.x += horizontalSpeed;

    runner.position.x = Math.max(-xBoundary, Math.min(xBoundary, runner.position.x));
    camera.position.z = runner.position.z + 10;

    if (isJumping) {
        runner.position.y += velocityY;
        velocityY -= gravity;
        if (runner.position.y <= 1.15) {
            runner.position.y = 1.15;
            isJumping = false;
            velocityY = 0;
        }
    }

    // ground
    groundSegments.forEach(segment => {
        if (segment.position.z > camera.position.z + segmentLength) {
            segment.position.z -= numSegments * segmentLength;
        }
    });

    // ground obstacles
    obstacles.forEach(obstacle => {
        if (obstacle.position.z > runner.position.z + 10) {
            obstacle.position.z -= numSegments * segmentLength;
            obstacle.position.x = (Math.random() - 0.5) * (groundWidth - 2);
        }
    });

    // sky obstacles
    skyObstacles.forEach(skyObstacle => {
        if (skyObstacle.position.z > runner.position.z + 10) {
            skyObstacle.position.z -= numSegments * segmentLength;
            skyObstacle.position.x = (Math.random() - 0.5) * (groundWidth - 2);
            skyObstacle.position.y = 3.15;
        }
    });

    checkCollision(); 

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
