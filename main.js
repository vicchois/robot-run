import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xadd8e6);
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
const leftWallSegments = [];
const rightWallSegments = [];
const numSegments = 5;
const segmentLength = 50;
const groundWidth = 10;
const xBoundary = groundWidth / 2 - 1;

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

const textureLoader = new THREE.TextureLoader();
const robotTexture = textureLoader.load('textures/metal.jpg')
const containerTexture = textureLoader.load('textures/containerside.png')

function createGround() {
    for (let i = 0; i < numSegments; i++) {
        const groundGeometry = new THREE.PlaneGeometry(groundWidth, segmentLength);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, 0, -i * segmentLength);
        scene.add(ground);
        groundSegments.push(ground);
    }
}

createGround()

function createWalls() {
    const wallHeight = 5;
    const wallThickness = 0.5;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
    
    for (let i = 0; i < numSegments; i++) {
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, segmentLength);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-groundWidth / 2, wallHeight / 2, -i * segmentLength);
        scene.add(leftWall);
        leftWallSegments.push(leftWall);
        
        const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, segmentLength);
        const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
        rightWall.position.set(groundWidth / 2, wallHeight / 2, -i * segmentLength);
        scene.add(rightWall);
        rightWallSegments.push(rightWall);
    }
}

createWalls()


function createRobotRunner() {
    // body
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5); 
    const bodyMaterial = new THREE.MeshStandardMaterial({ map: robotTexture }); 
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // head
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ map: robotTexture }); 
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.5, 0); 

    // arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1); 
    const armMaterial = new THREE.MeshStandardMaterial({ map: robotTexture });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    
    leftArm.position.set(-0.6, 0.5, 0); 
    rightArm.position.set(0.6, 0.5, 0); 
    
    // legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const legMaterial = new THREE.MeshStandardMaterial({ map: robotTexture });
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
let canMove = true;

let horizontalSpeed = 0.15;

let isJumping = false;
let velocityY = 0;
const gravity = 0.01;
const jumpStrength = 0.25;

// obstacles
const obstacles = [];
const skyObstacles = [];
const numObstacles = 15;

function createGroundObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ map: containerTexture });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    
    const randomX = (Math.random() - 0.5) * (groundWidth - 2);
    const randomZ = Math.random() * numSegments * segmentLength + 20;
    
    obstacle.position.set(randomX, 0.75, -randomZ);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createSkyObstacle() {
    const skyGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const skyMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow for visibility
    const skyObstacle = new THREE.Mesh(skyGeometry, skyMaterial);
    
    const randomX = (Math.random() - 0.5) * (groundWidth - 2);
    const randomY = 3.15; 
    const randomZ = Math.random() * numSegments * segmentLength + 20;
    
    skyObstacle.position.set(randomX, randomY, -randomZ);
    scene.add(skyObstacle);
    skyObstacles.push(skyObstacle);
}

function createAllObstacles() {
    for (let i = 0; i < numObstacles; i++) {
        createGroundObstacle();
        createSkyObstacle();
    }
}

createAllObstacles()


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
        isJumping = false;
        runner.position.y = 0.75;
        runner.scale.y = 0.5;  
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
    canMove = false;
    stopGame();
    document.getElementById('game-over-popup').style.display = 'flex';
}

document.getElementById('restart-button').addEventListener('click', () => {
    //rest from beginning
    speed = 0.2;
    horizontalSpeed = 0.15;
    canMove = true;
    runner.position.set(0, 1.15, 0);
    camera.position.set(0, 6, 10);

    //reset score
    score = 0;
    document.getElementById("game-score").textContent = score;
    document.getElementById("high-score").textContent = highScore;
    //hide popup
    document.getElementById('game-over-popup').style.display = 'none';
    //reset obstacles
    resetObstacles();
});

function resetObstacles() {
    //remove all obstacles
    obstacles.forEach(obstacle => {
        scene.remove(obstacle);
    });
    skyObstacles.forEach(skyObstacle => {
        scene.remove(skyObstacle);
    });

    //clear
    obstacles.length = 0;
    skyObstacles.length = 0;

    // Recreate obstacles from scratch
    createAllObstacles();
    createGround();
    createWalls();
    startGame();
}

let score = 0;
let highScore = 0;
let intervalId = null;

function updateScore() {
    score++;
    document.getElementById("game-score").textContent = score;
}

function startGame() {
    if (!intervalId) {
        intervalId = setInterval(updateScore, 50); // 0.05 sec
    }
}

function stopGame() {
    clearInterval(intervalId);
    intervalId = null; // reset
    document.getElementById("popup-game-score").textContent = score;
    if (score > highScore) {
        highScore = score;
        document.getElementById("popup-high-score").textContent = highScore;
    }
}

function animate() {
    requestAnimationFrame(animate);

    runner.position.z -= speed;
    if (speed < 0.8) {
        speed += 0.0005;
        horizontalSpeed += 0.00005;
    }
    
    if (moveLeft && canMove) runner.position.x -= horizontalSpeed;
    if (moveRight && canMove) runner.position.x += horizontalSpeed;

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

    // left walls
    leftWallSegments.forEach(segment => {
        if (segment.position.z > camera.position.z + segmentLength) {
            segment.position.z -= numSegments * segmentLength;
        }
    });

    // left walls
    rightWallSegments.forEach(segment => {
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

window.onload = startGame;
