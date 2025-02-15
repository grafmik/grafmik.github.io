import * as THREE from 'three';

let camera, scene, renderer, player, obstacles = [], score = 0;
let gameActive = true;
let mouseX = 0, mouseY = 0;
let spawnRate = 0.02; // Initial spawn rate
let currentSpeed = 0.3; // Initial obstacle speed
const BASE_SPAWN_RATE = 0.02;
const BASE_SPEED = 0.3;
const SPEED_INCREMENT = 0.0001; // How much speed increases per frame
const SPAWN_INCREMENT = 0.0001; // How much spawn rate increases per frame
const MAX_SPEED = 1.0; // Maximum speed cap
const MAX_SPAWN_RATE = 0.1; // Maximum spawn rate cap
const MOVEMENT_BOUNDS = {x: 8, y: 4}; // Maximum movement bounds

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Player car
    const geometry = new THREE.BoxGeometry(1, 0.5, 2);
    const material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    player = new THREE.Mesh(geometry, material);
    player.position.z = 5;
    scene.add(player);

    // Space background
    createStars();

    // Camera position
    camera.position.y = 2;
    camera.position.z = 8;
    camera.lookAt(player.position);

    // Event listeners
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);

    // Start game loop
    animate();
}

function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({color: 0xFFFFFF, size: 0.1});

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = THREE.MathUtils.randFloatSpread(100);
        const y = THREE.MathUtils.randFloatSpread(100);
        const z = THREE.MathUtils.randFloatSpread(100);
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createObstacle() {
    const geometry = new THREE.BoxGeometry(1, 0.5, 2);
    const material = new THREE.MeshPhongMaterial({color: 0xff0000});
    const obstacle = new THREE.Mesh(geometry, material);

    // Random lane position
    obstacle.position.x = (Math.random() * 2 - 1) * MOVEMENT_BOUNDS.x;
    obstacle.position.y = (Math.random() * 2 - 1) * MOVEMENT_BOUNDS.y;
    obstacle.position.z = -30;

    scene.add(obstacle);
    obstacles.push(obstacle);
}

function onMouseMove(event) {
    if (!gameActive) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(player);

    for (const obstacle of obstacles) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameActive = false;
    document.getElementById('gameOver').style.display = 'block';
}

function updateScore() {
    // Base score increase per frame
    const baseIncrease = 0.1;
    // Bonus multiplier based on current difficulty
    const difficultyMultiplier = (currentSpeed / BASE_SPEED) * (spawnRate / BASE_SPAWN_RATE);

    // Update score with base increase plus difficulty bonus
    score += baseIncrease * difficultyMultiplier;
    // Update display (rounded to whole number)
    document.getElementById('scoreValue').textContent = Math.floor(score);
}

function animate() {
    if (!gameActive) return;

    requestAnimationFrame(animate);

    // Update player position based on mouse
    const targetX = mouseX * MOVEMENT_BOUNDS.x;
    const targetY = mouseY * MOVEMENT_BOUNDS.y;

    // Smooth movement
    player.position.x += (targetX - player.position.x) * 0.1;
    player.position.y += (targetY - player.position.y) * 0.1;

    // Update score continuously
    updateScore();

    // Increase difficulty based on score
    currentSpeed = Math.min(MAX_SPEED, BASE_SPEED + (Math.floor(score) * SPEED_INCREMENT));
    spawnRate = Math.min(MAX_SPAWN_RATE, BASE_SPAWN_RATE + (Math.floor(score) * SPAWN_INCREMENT));

    // Create new obstacles with increasing frequency
    if (Math.random() < spawnRate) {
        createObstacle();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.z += currentSpeed;

        // Remove obstacles that are too far
        if (obstacles[i].position.z > 10) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
        }
    }

    // Check collisions
    if (checkCollisions()) {
        gameOver();
    }

    renderer.render(scene, camera);
}

// Restart game
document.getElementById('restartButton').addEventListener('click', () => {
    // Reset game state
    score = 0;
    document.getElementById('scoreValue').textContent = '0';
    document.getElementById('gameOver').style.display = 'none';

    // Remove all obstacles
    for (const obstacle of obstacles) {
        scene.remove(obstacle);
    }
    obstacles = [];

    // Reset game state
    player.position.x = 0;
    player.position.y = 0;
    currentSpeed = BASE_SPEED;
    spawnRate = BASE_SPAWN_RATE;

    gameActive = true;
    animate();
});

// Start the game
init();
