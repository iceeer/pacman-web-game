// Pac-Man Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const messageElement = document.getElementById('gameMessage');

// Game constants
const CELL_SIZE = 20;
const COLS = 22;
const ROWS = 26;

// Game state
let score = 0;
let lives = 3;
let gameRunning = false;
let gamePaused = false;
let pellets = [];
let powerPellets = [];
let gameLoop;

// Map: 0=empty, 1=wall, 2=pellet, 3=power pellet, 4=ghost house
const originalMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,3,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,1,1,2,2,1,1,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1,1],
    [1,1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1,1],
    [1,1,1,1,1,2,1,1,1,0,0,0,0,1,1,1,2,1,1,1,1,1],
    [1,1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1,1],
    [1,1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,2,2,1,2,2,2,2,2,0,0,2,2,2,2,2,1,2,2,3,1],
    [1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1],
    [1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

let map = [];

// Pac-Man
const pacman = {
    x: 10,
    y: 16,
    direction: 'right',
    nextDirection: 'right',
    mouthOpen: 0,
    mouthSpeed: 0.2
};

// Ghosts
const ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
const ghostNames = ['blinky', 'pinky', 'inky', 'clyde'];
let ghosts = [];

function initGhosts() {
    ghosts = [
        { x: 10, y: 11, color: ghostColors[0], direction: 'left', scared: false, eaten: false },
        { x: 9, y: 13, color: ghostColors[1], direction: 'up', scared: false, eaten: false },
        { x: 10, y: 13, color: ghostColors[2], direction: 'up', scared: false, eaten: false },
        { x: 11, y: 13, color: ghostColors[3], direction: 'up', scared: false, eaten: false }
    ];
}

// Initialize game
function initGame() {
    score = 0;
    lives = 3;
    updateScore();
    resetLevel();
    initGhosts();
}

function resetLevel() {
    map = JSON.parse(JSON.stringify(originalMap));
    pellets = [];
    powerPellets = [];
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (map[row][col] === 2) {
                pellets.push({ x: col, y: row });
            } else if (map[row][col] === 3) {
                powerPellets.push({ x: col, y: row });
            }
        }
    }
    
    pacman.x = 10;
    pacman.y = 16;
    pacman.direction = 'right';
    pacman.nextDirection = 'right';
}

function resetPositions() {
    pacman.x = 10;
    pacman.y = 16;
    pacman.direction = 'right';
    pacman.nextDirection = 'right';
    initGhosts();
}

// Draw functions
function drawMap() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (map[row][col] === 1) {
                ctx.fillStyle = '#2121de';
                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    // Draw "PAC-MAN" title when game not running
    if (!gameRunning) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 184, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText('PAC-MAN', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
        
        // Draw "Press Start" hint
        ctx.font = '20px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Press Start to Play', canvas.width / 2, canvas.height / 2 + 50);
    }
}

function drawPellets() {
    ctx.fillStyle = '#ffb8ff';
    pellets.forEach(pellet => {
        ctx.beginPath();
        ctx.arc(
            pellet.x * CELL_SIZE + CELL_SIZE / 2,
            pellet.y * CELL_SIZE + CELL_SIZE / 2,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawPowerPellets() {
    ctx.fillStyle = '#ffb8ff';
    powerPellets.forEach(pellet => {
        ctx.beginPath();
        ctx.arc(
            pellet.x * CELL_SIZE + CELL_SIZE / 2,
            pellet.y * CELL_SIZE + CELL_SIZE / 2,
            7,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawPacman() {
    const x = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const y = pacman.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;
    
    // Animate mouth
    pacman.mouthOpen += pacman.mouthSpeed;
    if (pacman.mouthOpen > 0.25 || pacman.mouthOpen < 0) {
        pacman.mouthSpeed = -pacman.mouthSpeed;
    }
    
    let angle = 0;
    if (pacman.direction === 'right') angle = 0;
    else if (pacman.direction === 'down') angle = Math.PI / 2;
    else if (pacman.direction === 'left') angle = Math.PI;
    else if (pacman.direction === 'up') angle = -Math.PI / 2;
    
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(x, y, radius, angle + pacman.mouthOpen * Math.PI, angle + (2 - pacman.mouthOpen) * Math.PI);
    ctx.lineTo(x, y);
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach(ghost => {
        const x = ghost.x * CELL_SIZE;
        const y = ghost.y * CELL_SIZE;
        
        if (ghost.scared) {
            ctx.fillStyle = '#0000ff';
        } else if (ghost.eaten) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        } else {
            ctx.fillStyle = ghost.color;
        }
        
        // Ghost body
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 2, Math.PI, 0);
        ctx.lineTo(x + CELL_SIZE - 2, y + CELL_SIZE);
        ctx.lineTo(x + 2, y + CELL_SIZE);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 3, y + CELL_SIZE / 2 - 2, 4, 0, Math.PI * 2);
        ctx.arc(x + CELL_SIZE * 2 / 3, y + CELL_SIZE / 2 - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 3, y + CELL_SIZE / 2 - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + CELL_SIZE * 2 / 3, y + CELL_SIZE / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateScore() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

// Movement
function canMove(x, y) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) {
        return false;
    }
    return map[y][x] !== 1;
}

function movePacman() {
    let newX = pacman.x;
    let newY = pacman.y;
    
    // Try next direction first
    if (pacman.nextDirection === 'right') newX++;
    else if (pacman.nextDirection === 'left') newX--;
    else if (pacman.nextDirection === 'up') newY--;
    else if (pacman.nextDirection === 'down') newY++;
    
    if (canMove(newX, newY)) {
        pacman.direction = pacman.nextDirection;
        pacman.x = newX;
        pacman.y = newY;
    } else {
        // Try current direction
        newX = pacman.x;
        newY = pacman.y;
        if (pacman.direction === 'right') newX++;
        else if (pacman.direction === 'left') newX--;
        else if (pacman.direction === 'up') newY--;
        else if (pacman.direction === 'down') newY++;
        
        if (canMove(newX, newY)) {
            pacman.x = newX;
            pacman.y = newY;
        }
    }
    
    // Wrap around
    if (pacman.x < 0) pacman.x = COLS - 1;
    if (pacman.x >= COLS) pacman.x = 0;
    
    // Eat pellets
    for (let i = pellets.length - 1; i >= 0; i--) {
        if (pellets[i].x === pacman.x && pellets[i].y === pacman.y) {
            pellets.splice(i, 1);
            score += 10;
            updateScore();
        }
    }
    
    // Eat power pellets
    for (let i = powerPellets.length - 1; i >= 0; i--) {
        if (powerPellets[i].x === pacman.x && powerPellets[i].y === pacman.y) {
            powerPellets.splice(i, 1);
            score += 50;
            updateScore();
            makeGhostsScared();
        }
    }
    
    // Check win
    if (pellets.length === 0 && powerPellets.length === 0) {
        gameWin();
    }
}

function makeGhostsScared() {
    ghosts.forEach(ghost => {
        if (!ghost.eaten) {
            ghost.scared = true;
            setTimeout(() => {
                ghost.scared = false;
            }, 8000);
        }
    });
}

function moveGhosts() {
    ghosts.forEach(ghost => {
        if (ghost.eaten) {
            // Return to ghost house
            if (ghost.x < 10) ghost.x++;
            else if (ghost.x > 10) ghost.x--;
            else if (ghost.y < 13) ghost.y++;
            else {
                ghost.eaten = false;
                ghost.scared = false;
            }
            return;
        }
        
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = [];
        
        directions.forEach(dir => {
            let newX = ghost.x;
            let newY = ghost.y;
            
            if (dir === 'up') newY--;
            else if (dir === 'down') newY++;
            else if (dir === 'left') newX--;
            else if (dir === 'right') newX++;
            
            if (canMove(newX, newY) && map[newY][newX] !== 4) {
                // Don't reverse direction unless necessary
                if (dir !== getOppositeDirection(ghost.direction)) {
                    validDirections.push(dir);
                }
            }
        });
        
        if (validDirections.length === 0) {
            // Must reverse
            let newX = ghost.x;
            let newY = ghost.y;
            const opposite = getOppositeDirection(ghost.direction);
            if (opposite === 'up') newY--;
            else if (opposite === 'down') newY++;
            else if (opposite === 'left') newX--;
            else if (opposite === 'right') newX++;
            
            if (canMove(newX, newY)) {
                ghost.direction = opposite;
                ghost.x = newX;
                ghost.y = newY;
            }
        } else {
            // Simple AI: move towards Pac-Man when not scared, away when scared
            if (Math.random() < 0.7) {
                // Choose direction based on Pac-Man position
                let bestDir = validDirections[0];
                let bestDist = ghost.scared ? -Infinity : Infinity;
                
                validDirections.forEach(dir => {
                    let newX = ghost.x;
                    let newY = ghost.y;
                    
                    if (dir === 'up') newY--;
                    else if (dir === 'down') newY++;
                    else if (dir === 'left') newX--;
                    else if (dir === 'right') newX++;
                    
                    const dist = Math.abs(newX - pacman.x) + Math.abs(newY - pacman.y);
                    
                    if (ghost.scared) {
                        if (dist > bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    } else {
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    }
                });
                
                ghost.direction = bestDir;
            }
            
            // Move
            let newX = ghost.x;
            let newY = ghost.y;
            
            if (ghost.direction === 'up') newY--;
            else if (ghost.direction === 'down') newY++;
            else if (ghost.direction === 'left') newX--;
            else if (ghost.direction === 'right') newX++;
            
            if (canMove(newX, newY)) {
                ghost.x = newX;
                ghost.y = newY;
            }
        }
        
        // Wrap around
        if (ghost.x < 0) ghost.x = COLS - 1;
        if (ghost.x >= COLS) ghost.x = 0;
    });
}

function getOppositeDirection(dir) {
    if (dir === 'up') return 'down';
    if (dir === 'down') return 'up';
    if (dir === 'left') return 'right';
    if (dir === 'right') return 'left';
    return dir;
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            if (ghost.scared && !ghost.eaten) {
                // Eat ghost
                ghost.eaten = true;
                score += 200;
                updateScore();
            } else if (!ghost.eaten) {
                // Pac-Man dies
                lives--;
                updateScore();
                
                if (lives <= 0) {
                    gameOver();
                } else {
                    resetPositions();
                }
            }
        }
    });
}

function showModal(isWin) {
    const modal = document.getElementById('gameModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById('modalTitle');
    const modalScore = document.getElementById('modalScore');
    
    if (isWin) {
        modalTitle.textContent = '🎉 YOU WIN!';
        modalContent.className = 'modal-content win';
    } else {
        modalTitle.textContent = '💀 GAME OVER';
        modalContent.className = 'modal-content lose';
    }
    
    modalScore.textContent = 'Final Score: ' + score;
    modal.classList.add('show');
}

function hideModal() {
    const modal = document.getElementById('gameModal');
    modal.classList.remove('show');
}

function gameWin() {
    gameRunning = false;
    clearInterval(gameLoop);
    showModal(true);
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    showModal(false);
}

function gameStep() {
    if (!gamePaused && gameRunning) {
        movePacman();
        moveGhosts();
        checkCollisions();
        
        drawMap();
        drawPellets();
        drawPowerPellets();
        drawPacman();
        drawGhosts();
    }
}

// Controls
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    if (e.key === 'ArrowUp') pacman.nextDirection = 'up';
    else if (e.key === 'ArrowDown') pacman.nextDirection = 'down';
    else if (e.key === 'ArrowLeft') pacman.nextDirection = 'left';
    else if (e.key === 'ArrowRight') pacman.nextDirection = 'right';
});

// Virtual Joystick Control
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');

let joystickCenter = { x: 0, y: 0 };
let joystickActive = false;
const maxDistance = 40; // Maximum stick movement distance

function setDirection(dir) {
    pacman.nextDirection = dir;
}

// Initialize joystick position
function updateJoystickCenter() {
    const rect = joystickBase.getBoundingClientRect();
    joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Handle touch/mouse events for joystick
joystickBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    updateJoystickCenter();
    handleJoystickMove(e.touches[0]);
}, { passive: false });

joystickBase.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joystickActive) {
        handleJoystickMove(e.touches[0]);
    }
}, { passive: false });

joystickBase.addEventListener('touchend', (e) => {
    e.preventDefault();
    joystickActive = false;
    resetJoystick();
}, { passive: false });

// Mouse support for desktop testing
joystickBase.addEventListener('mousedown', (e) => {
    joystickActive = true;
    updateJoystickCenter();
    handleJoystickMove(e);
});

document.addEventListener('mousemove', (e) => {
    if (joystickActive) {
        handleJoystickMove(e);
    }
});

document.addEventListener('mouseup', () => {
    if (joystickActive) {
        joystickActive = false;
        resetJoystick();
    }
});

function handleJoystickMove(input) {
    const deltaX = input.clientX - joystickCenter.x;
    const deltaY = input.clientY - joystickCenter.y;
    
    // Calculate distance and angle
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    // Move stick visually
    const stickX = Math.cos(angle) * clampedDistance;
    const stickY = Math.sin(angle) * clampedDistance;
    
    joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
    
    // Determine direction based on angle
    // Divide into 4 quadrants for 4 directions
    const degrees = angle * 180 / Math.PI;
    
    if (distance > 10) { // Dead zone
        if (degrees > -45 && degrees <= 45) {
            setDirection('right');
        } else if (degrees > 45 && degrees <= 135) {
            setDirection('down');
        } else if (degrees > 135 || degrees <= -135) {
            setDirection('left');
        } else if (degrees > -135 && degrees <= -45) {
            setDirection('up');
        }
    }
}

function resetJoystick() {
    joystickStick.style.transform = 'translate(-50%, -50%)';
    joystickStick.classList.remove('active');
}

// Action buttons
startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        initGame();
        gameRunning = true;
        gamePaused = false;
        messageElement.textContent = '';
        gameLoop = setInterval(gameStep, 150);
    }
});

pauseBtn.addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
    }
});

restartBtn.addEventListener('click', () => {
    clearInterval(gameLoop);
    initGame();
    gameRunning = true;
    gamePaused = false;
    messageElement.textContent = '';
    pauseBtn.textContent = 'Pause';
    gameLoop = setInterval(gameStep, 150);
});

// Modal buttons
const modalRestartBtn = document.getElementById('modalRestartBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');

modalRestartBtn.addEventListener('click', () => {
    hideModal();
    clearInterval(gameLoop);
    initGame();
    gameRunning = true;
    gamePaused = false;
    pauseBtn.textContent = 'Pause';
    gameLoop = setInterval(gameStep, 150);
});

modalCloseBtn.addEventListener('click', () => {
    hideModal();
});

// Initial draw
drawMap();
