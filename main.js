import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const groundSegments = [];
const leftWallSegments = [];
const rightWallSegments = [];
const numSegments = 5;
const segmentLength = 50;
const groundWidth = 10;
const xBoundary = groundWidth / 2 - 1;

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

const textureLoader = new THREE.TextureLoader();
const robotTexture = textureLoader.load('textures/metal.jpg')
const containerTexture = textureLoader.load('textures/containerside.png')

let jumpStrength = 0.25;
let gameStarted = false;

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
    const wallHeight = 10;
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

const powerUps = [];
const numPowerUps = 10;
const powerUpHeight = 1.5; // Floating height

class PowerUp {
    constructor(type, color, effectFunction) {
        this.type = type;
        if (type == "Shield") {
            const shape = new THREE.Shape();
            shape.moveTo(0, 1);
            shape.quadraticCurveTo(0.5, 1.5, 1, 1); 
            shape.lineTo(1.2, 0.5);
            shape.lineTo(0.6, -1);
            shape.lineTo(-0.6, -1);
            shape.lineTo(-1.2, 0.5);
            shape.lineTo(-1, 1);
            shape.quadraticCurveTo(-0.5, 1.5, 0, 1); 
            
            const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03 };
            this.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            this.material = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
        } else if (type == "Jump Boost") {
            // const shape = new THREE.Shape();
            // shape.moveTo(0, 1.25);
            // shape.lineTo(0.5, 1.25);
            // shape.lineTo(0.5, 0.5);
            // shape.quadraticCurveTo(2.5, -0.5, 0.5, -1);
            // shape.lineTo(-0.5, -1);
            // shape.lineTo(-0.5, 1.25);
            // shape.lineTo(0, 1.25);
            // const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03 };
            // this.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // this.material = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
            this.geometry = new THREE.BoxGeometry(0.7, 1.2, 0.6); 
            this.material = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.8 });

            this.mesh = new THREE.Group();

            const bootMesh = new THREE.Mesh(this.geometry, this.material);
            this.mesh.add(bootMesh);

            const toeGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.7);
            const toeMesh = new THREE.Mesh(toeGeometry, this.material);
            toeMesh.position.set(0, -0.4, 0.4);
            this.mesh.add(toeMesh);

            this.mesh.rotation.x = -0.1;
        } 
        // else if (type === "Speed Boost") {
        //     const shape = new THREE.Shape();
        //     shape.moveTo(0, 1);
        //     shape.lineTo(0.6, 1);
        //     shape.lineTo(0.6, 0.2);
        //     shape.lineTo(1.2, 0.2);
        //     shape.lineTo(0, -1.25); 
        //     shape.lineTo(-1.2, 0.2);
        //     shape.lineTo(-0.6, 0.2);
        //     shape.lineTo(-0.6, 1);
        //     shape.lineTo(0, 1); 
        //     const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03 };
        //     this.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        //     this.material = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
        // } 
        else {
            this.geometry = new THREE.SphereGeometry(0.3, 16, 16);
            this.material = new THREE.MeshStandardMaterial({
                emissive: color,
                emissiveIntensity: 0.8,
                color: color,
                transparent: true,
                opacity: 0.8,
            });
        }
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(
            (Math.random() - 0.5) * (groundWidth - 2), 
            powerUpHeight, 
            -Math.random() * numSegments * segmentLength - 20
        );
        scene.add(this.mesh);
        this.effectFunction = effectFunction; 
    }

    update() {
        this.mesh.rotation.y += 0.05; 
        this.mesh.position.y = powerUpHeight + Math.sin(Date.now() * 0.002) * 0.2; 

        if (this.mesh.position.z > runner.position.z + 10) {
            this.mesh.position.z -= numSegments * segmentLength;
            this.mesh.position.x = (Math.random() - 0.5) * (groundWidth - 2);
        }
    }

    checkCollision() {
        const distance = runner.position.distanceTo(this.mesh.position);
        if (distance < 1.2) {
            this.effectFunction(); // Apply power-up effect
            scene.remove(this.mesh);
            return true; // Mark for removal
        }
        return false;
    }
}

function createPowerUp() {
    const powerUpTypes = [
        { type: "Speed Boost", color: 0x00ff00, effect: speedBoost },
        { type: "Jump Boost", color: 0xff0000, effect: jumpBoost },
        { type: "Shield", color: 0xffaa00, effect: shieldEffect },
    ];

    if (Math.random() > 0.2) return; // 20% chance to spawn

    const chosenPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const newPowerUp = new PowerUp(chosenPowerUp.type, chosenPowerUp.color, chosenPowerUp.effect);
    powerUps.push(newPowerUp);
}

const activePowerupsContainer = document.getElementById("active-powerups");
const powerupList = document.getElementById("powerup-list");

let speedDecreaseStacks = 0;
let jumpBoostOn = false;

function addPowerup(name, duration) {
    const powerupId = `powerup-${name}`;
    
    let existingPowerup = document.getElementById(powerupId);
    if (existingPowerup) {
        clearInterval(existingPowerup.dataset.timer);
        existingPowerup.remove();
    }

    const powerupElement = document.createElement("li");
    powerupElement.id = powerupId;
    if (name === "Speed Decrease") {
        powerupElement.innerHTML = `${name}: x${speedDecreaseStacks + 1}`;
        speedDecreaseStacks++;
    } else if (name === "Jump Boost") {
        powerupElement.innerHTML = `${name}: <span class="countdown">${duration}</span>s`;
        jumpBoostOn = true;
    } else {
        powerupElement.innerHTML = `${name}: <span class="countdown">${duration}</span>s`;
    }
    powerupList.appendChild(powerupElement);

    activePowerupsContainer.style.display = "block";

    let timeLeft = duration;
    const countdownTimer = setInterval(() => {
        timeLeft--;
        if (powerupElement.querySelector(".countdown") !== null){
            powerupElement.querySelector(".countdown").textContent = timeLeft;
        }
    
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            powerupElement.remove();
            if (name === "Speed Decrease") {
                speedDecreaseStacks = 0;
            }
            if (name === "Jump Boost") {
                jumpBoostOn = false;
            }
        }
    }, 1000);
    powerupElement.dataset.timer = countdownTimer;
}

function speedBoost() {
    addPowerup("Speed Decrease", 4.5);
    speed *= 0.8;
}

function jumpBoost() {
    if (jumpBoostOn) return; // Prevent multiple boosts
    addPowerup("Jump Boost", 3);
    jumpStrength += 0.1;
    setTimeout(() => { jumpStrength -= 0.1; }, 3000);
}

function shieldEffect() {
    addPowerup("Shield", 3);
    canMove = false; // Prevent damage for a short duration
    shielded = true;
    setTimeout(() => { shieldOff(); }, 3000);
}

function shieldOff() {
    canMove = true;
    shielded = false;
}

const runnerBoundingBox = new THREE.Box3();

function createRobotRunner() {
    // body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5); 
    const bodyMaterial = new THREE.MeshStandardMaterial({ map: robotTexture }); 
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.25, 0);
    body.name = "body";
    
    // head
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ map: robotTexture }); 
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.5, 0); 
    head.name = "head";

    // arms
    const leftArmPivot = new THREE.Group();
    const rightArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.6, 0.5, 0);
    rightArmPivot.position.set(0.6, 0.5, 0);
    leftArmPivot.name = "leftArmPivot";
    rightArmPivot.name = "rightArmPivot";

    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1); 
    const armMaterial = new THREE.MeshStandardMaterial({ map: robotTexture });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0, 0, 0); 
    rightArm.position.set(0, 0, 0); 
    leftArm.name = "leftArm";
    rightArm.name = "rightArm";
    leftArmPivot.add(leftArm);
    rightArmPivot.add(rightArm);
    
    // legs
    const leftLegPivot = new THREE.Group();
    const rightLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.3, -0.5, -0.25);
    rightLegPivot.position.set(0.3, -0.5, 0);
    leftLegPivot.name = "leftLegPivot";
    rightLegPivot.name = "rightLegPivot";
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const legMaterial = new THREE.MeshStandardMaterial({ map: robotTexture });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0, 0, 0); 
    rightLeg.position.set(0, 0, 0); 
    leftLeg.name = "leftLeg";
    rightLeg.name = "rightLeg";
    leftLegPivot.add(leftLeg);
    rightLegPivot.add(rightLeg);
    
    // group robot
    const robot = new THREE.Group();
    robot.add(body);
    robot.add(head);
    robot.add(leftArmPivot);
    robot.add(rightArmPivot);
    robot.add(leftLegPivot);
    robot.add(rightLegPivot);
    
    return robot;
}
const runner = createRobotRunner();
runner.position.set(0, 1.15, 0);
scene.add(runner);
runnerBoundingBox.setFromObject(runner);
runnerBoundingBox.expandByScalar(-0.1);

const size = new THREE.Vector3();
runnerBoundingBox.getSize(size);
console.log("Width:", size.x, "Height:", size.y, "Depth:", size.z);

// Get the center of the bounding box
const center = new THREE.Vector3();
runnerBoundingBox.getCenter(center);
console.log("Center:", center.x, center.y, center.z);

let speed = 0.2;
let moveLeft = false;
let moveRight = false;
let canMove = true;
let shielded = false;

let horizontalSpeed = 0.15;

let isJumping = false;
let velocityY = 0;
const gravity = 0.01;


// obstacles
const obstacles = [];
const skyObstacles = [];
const obstaclesBounding = [];
const skyObstaclesBounding = [];
const numObstacles = 15;

function createGroundObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ map: containerTexture });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);

    let validPosition = false;
    let randomX, randomZ;
    
    // dont overlap obstacles
    while (!validPosition) {
        randomX = (Math.random() - 0.5) * (groundWidth - 2);
        randomZ = Math.random() * numSegments * segmentLength + 20;
        
        validPosition = obstacles.every(existingObstacle => {
            return existingObstacle.position.distanceTo(new THREE.Vector3(randomX, 0.75, -randomZ)) > 4.5;
        });
    }

    obstacle.position.set(randomX, 0.75, -randomZ);
    scene.add(obstacle);

    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(obstacle);

    obstacles.push(obstacle);
    obstaclesBounding.push(boundingBox);
}

function createSkyObstacle() {
    const skyGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const skyMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xffffaa,
        emissiveIntensity: 0.1, 
        color: 0xffff00,
        transparent: true,
        opacity: 0.8,
    });

    const skyObstacle = new THREE.Mesh(skyGeometry, skyMaterial);
    let validPosition = false;
    let randomX, randomZ;
    
    // dont overlap obstacles
    while (!validPosition) {
        randomX = (Math.random() - 0.5) * (groundWidth - 2.5);
        randomZ = Math.random() * numSegments * segmentLength + 20;
        
        validPosition = skyObstacles.every(existingObstacleTuple => {
            let [existingObstacle, _] = existingObstacleTuple;
            return existingObstacle.position.distanceTo(new THREE.Vector3(randomX, 3.15, -randomZ)) > 4.5;
        });
    }

    skyObstacle.position.set(randomX, 3.15, -randomZ);

    // add lamp light
    const light = new THREE.PointLight(0xffcc88, 10, 0);
    light.position.set(randomX, 3.15, -randomZ);
    light.castShadow = true;

    scene.add(light);
    scene.add(skyObstacle);

    const boundingSphere = new THREE.Sphere();
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(skyObstacle);

    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) / 2;

    boundingSphere.set(center, radius);

    skyObstaclesBounding.push(boundingSphere);
    skyObstacles.push([skyObstacle, light]);
}

function createAllObstacles() {
    for (let i = 0; i < numObstacles; i++) {
        createGroundObstacle();
        createSkyObstacle();
    }
    for (let i = 0; i < numPowerUps; i++) {
        createPowerUp();
    }
}

createAllObstacles()

const mixer = new THREE.AnimationMixer(runner);
const clock = new THREE.Clock();

const leftArm = runner.getObjectByName("leftArm");
const rightArm = runner.getObjectByName("rightArm");
const leftLeg = runner.getObjectByName("leftLeg");
const rightLeg = runner.getObjectByName("rightLeg");

const leftArmTrack = new THREE.KeyframeTrack(
    `${leftArm.uuid}.rotation[x]`,
    [0, 0.5, 1],
    [0, -Math.PI/2, 0]
);

const rightArmTrack = new THREE.KeyframeTrack(
    `${rightArm.uuid}.rotation[x]`,
    [0, 0.5, 1],
    [0, Math.PI/2, 0]
);

const leftLegTrack = new THREE.KeyframeTrack(
    `${leftLeg.uuid}.rotation[x]`,
    [0, 0.5, 1],
    [0, Math.PI/2, 0]
);

const rightLegTrack = new THREE.KeyframeTrack(
    `${rightLeg.uuid}.rotation[x]`,
    [0, 0.5, 1],
    [0, -Math.PI/2, 0]
);

// Create the animation clip
const runningAnimation = new THREE.AnimationClip('running', 1, [
    leftArmTrack, rightArmTrack, leftLegTrack, rightLegTrack
]);

// Add the animation to the mixer and get the action
const runAction = mixer.clipAction(runningAnimation);
runAction.play();
let isPaused = false;

document.getElementById('start-game-btn').addEventListener('click', () => {
    document.getElementById('initial-screen').style.display = 'none';

    document.getElementById('gameScore').style.display = 'block';
    document.getElementById('highScore').style.display = 'block';
    document.getElementById('active-powerups').style.display = 'block';
    gameStarted = true;
    startGame();
});

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
    if (event.key === 'Escape') {
        isPaused = !isPaused;
        if (isPaused) {
            pauseOverlay.style.display = 'flex'; 
        } else {
            pauseOverlay.style.display = 'none'; 
        }
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
    obstaclesBounding.forEach(box => {
        if (runnerBoundingBox.intersectsBox(box)) {
            handleCollision();
        }
    });

    skyObstaclesBounding.forEach(sphere => {
        if (runnerBoundingBox.intersectsSphere(sphere)) { 
            handleCollision();
        }
    });
}

function handleCollision() {
    speed = 0; 
    canMove = false;
    stopGame();
    document.getElementById('active-powerups').style.display = 'none';
    document.getElementById('game-over-popup').style.display = 'flex';
}

document.getElementById('resume-button').addEventListener('click', () => {
    //resume game
    isPaused = false;
    pauseOverlay.style.display = 'none';
});

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
    //show powerups
    document.getElementById('active-powerups').style.display = 'block';
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
    skyObstacles.forEach(skyObstacleTuple => {
        let [skyObstacle, light] = skyObstacleTuple;
        scene.remove(skyObstacle);
        scene.remove(light);
    });
    // Remove all power-ups
     powerUps.forEach(powerUp => {
        scene.remove(powerUp.mesh);
    });

    //clear
    obstacles.length = 0;
    skyObstacles.length = 0;
    obstaclesBounding.length = 0;
    skyObstaclesBounding.length = 0;
    powerUps.length = 0;

    // Recreate obstacles from scratch
    createAllObstacles();
    createGround();
    createWalls();
    shieldOff();
    startGame();
}

let score = 0;
let highScore = 0;
let intervalId = null;


function updateScore() {
    if (!isPaused){
        score++;
    }
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

let powerUpSpawnTimer = 0;
let powerUpSpawnInterval = 100;

// const runnerHelper = new THREE.Box3Helper(runnerBoundingBox, 0xff0000); // HERE* (used for bounding box frame)
// scene.add(runnerHelper); // HERE* (used for bounding box frame)

function animate() {
    requestAnimationFrame(animate);

    if (!gameStarted || isPaused) {
        return;
    }
    runner.position.z -= speed;
    if (speed < 0.5) {
        speed += 0.0002;
        horizontalSpeed += 0.00002;
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

    runnerBoundingBox.setFromObject(runner);
    runnerBoundingBox.expandByScalar(-0.1);

    const delta = clock.getDelta();
    mixer.update(delta);

    //power ups
    // Power-up spawning logic
    powerUpSpawnTimer++;
    if (powerUpSpawnTimer >= powerUpSpawnInterval) {
        createPowerUp();
        powerUpSpawnTimer = 0;
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update();
        if (powerUps[i].checkCollision()) {
            powerUps.splice(i, 1); // Remove collected power-up
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
    obstacles.forEach((obstacle, index) => {
        if (obstacle.position.z > runner.position.z + 10) {
            obstacle.position.z -= numSegments * segmentLength;
            obstacle.position.x = (Math.random() - 0.5) * (groundWidth - 2);
        }

        obstaclesBounding[index].setFromObject(obstacle);
    });

    // sky obstacles
    skyObstacles.forEach((skyObstacleTuple, index) => {
        let [skyObstacle, light] = skyObstacleTuple;
        if (skyObstacle.position.z > runner.position.z + 10) {
            skyObstacle.position.z -= numSegments * segmentLength;
            light.position.z = skyObstacle.position.z;
            skyObstacle.position.x = (Math.random() - 0.5) * (groundWidth - 2);
            light.position.x = skyObstacle.position.x;
            skyObstacle.position.y = 3.15;
            light.position.y = 2.15;
        }

        const boundingBox = new THREE.Box3().setFromObject(skyObstacle);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const radius = Math.max(size.x, size.y, size.z) / 2;
        skyObstaclesBounding[index].set(center, radius);
    });

    // runnerHelper.box.copy(runnerBoundingBox); // HERE* (used for bounding box frame)

    if (!shielded) {
        checkCollision();
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// window.onload = startGame;
