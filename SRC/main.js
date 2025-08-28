const hitSound = new Audio("hit.mp3") // Sound effect for hitting a brick

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const state = {menu: 'Menu', playing: 'Playing', gameOver: 'GameOver', paused: 'Paused', win: 'Win'}; // Game states
let currentState = state.menu; // Start at menu

// Handle mouse clicks for menu and pause/game over/win overlays
canvas.addEventListener('click', (event) => {
    const mousePos = getMousePosition(event);

    if (currentState === state.menu) {
        const buttons = getMenuButtons();
        for (const b of buttons) {
            if (mousePos.x > b.x && mousePos.x < b.x + b.width &&
                mousePos.y > b.y && mousePos.y < b.y + b.height) {
                b.onclick();
                break;
            }
        }
        return;
    }
    if (currentState === state.paused || currentState === state.win || currentState === state.gameOver ){
        const buttons = getPauseButtons();
        for (const b of buttons){
            if(mousePos.x > b.x && mousePos.x < b.x + b.width &&
                mousePos.y > b.y && mousePos.y < b.y + b.height){
                b.onclick();
                break;
            }
        }
        return;
    }
});

// Paddle variables
let paddleWidth = 100;
const paddleHeight = 20;
let paddleX = (canvas.width - paddleWidth) / 2;
const paddleSpeed = 7;
let rightPressed = false;
let leftPressed = false;
let ballSpeedX = 0;
let ballSpeedY = 0;

// Ball variables
const ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height - 40;

// Player variables
let score = 0;
let lives = 3;

// Brick layout variables
const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 7;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

// Main menu difficulty settings
const difficulty = {
    easy: { paddleWidth: 120, ballSpeedX: 5, ballSpeedY: -5, lives: 5 },
    medium: { paddleWidth: 100, ballSpeedX: 6, ballSpeedY: -6, lives: 3 },
    hard: { paddleWidth: 60, ballSpeedX: 8, ballSpeedY: -8, lives: 1 }
}
let currentDifficulty = null;

// Initialize bricks array
let bricks = [];
for (let c = 0; c < brickColumnCount; c++){
    bricks[c] = [];
    for (let r = 0; r< brickRowCount; r++){
        bricks[c][r] = { x: 0, y: 0, status: 1 }; //1 means brick is visible
    }
}

// Main draw function, draws menu, game, or overlays depending on state
function draw(){
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width, canvas.height);

    if (currentState === state.menu) {
        drawMenu();
        return;
    }
    // Draw game scenery
    drawGame();

    // If paused
    if (currentState === state.paused){
        drawPauseOverlay();
    }

    // If win
    if(currentState === state.win){
        drawWinOverlay();
    }

    // If game over
    if (currentState === state.gameOver) {
        drawGameOverOverlay();
    }
}

// Draws the main menu and its buttons
function drawMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ball Paddle Game', canvas.width / 2, canvas.height / 2 - 100);
    ctx.textAlign = 'left';

    const buttons = getMenuButtons();
    buttons.forEach(b => drawButton(b));
}

// Draws the paddle, ball, bricks, score, and lives during gameplay
function drawGame() {
    // Draw paddle
    ctx.fillStyle = '#0f0';
    ctx.fillRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fill();
    ctx.closePath();

    // Draw bricks
    for (let c = 0; c<brickColumnCount; c++){
     for (let r = 0; r < brickRowCount; r++){
        if (bricks[c][r].status == 1){
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX
            bricks[c][r].y = brickY;
            ctx.fillStyle = '#0095DD';
            ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
        }
     }
    }
    drawScore();
    drawLives();
}

// Draws the pause overlay and pause menu buttons
function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Paused - Press Space to Resume', canvas.width / 2, canvas.height / 2 - 100);
    const buttons = getPauseButtons();
    buttons.forEach(b => drawButton(b));    
}

// Draws the win overlay and menu buttons
function drawWinOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';    
    ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 100);
    const buttons = getPauseButtons();
    buttons.forEach(b => drawButton(b)); 
}

// Draws the game over overlay and menu buttons
function drawGameOverOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';    
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 100);
    const buttons = getPauseButtons();
    buttons.forEach(b => drawButton(b));
}

// Returns mouse position relative to canvas
function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

// Returns an array of menu button objects with positions and click handlers
function getMenuButtons() {
    const buttonWidth = 200;
    const buttonHeight = 44;
    const gap = 14;
    const startY = canvas.height / 2 - (buttonHeight * 2 + gap) / 2;
    const cx = canvas.width / 2 - buttonWidth/2;
    return [
        {label: 'Easy', x: cx, y: startY + 0 * (buttonHeight + gap), width: buttonWidth, height: buttonHeight, onclick: () =>  startGame('easy')},
        {label: 'Medium', x: cx, y: startY + 1 * (buttonHeight + gap), width: buttonWidth, height: buttonHeight, onclick: () =>  startGame('medium')},
        {label: 'Hard', x: cx, y: startY + 2 * (buttonHeight + gap), width: buttonWidth, height: buttonHeight, onclick: () =>  startGame('hard')},
    ];
}

// Returns an array of pause/game over/win button objects
function getPauseButtons(){
    const buttonWidth = 200;
    const buttonHeight = 44;
    const gap = 14;
    const startY = canvas.height / 2 - (buttonHeight * 2 + gap) / 2;
    const cx = canvas.width / 2 - buttonWidth/2;
    return [
        {label: 'Restart', x: cx, y: startY + 0 * (buttonHeight + gap), width: buttonWidth, height: buttonHeight, onclick: () =>  resetGame()},
        {label: 'Menu', x: cx, y: startY + 1 * (buttonHeight + gap), width: buttonWidth, height: buttonHeight, onclick: () =>  {currentState = state.menu;}},
    ];    
}

// Draws a button on the canvas
function drawButton(button) {
    ctx.fillStyle = '#0095DD';
    ctx.fillRect(button.x, button.y, button.width, button.height);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(button.x, button.y, button.width, button.height);

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2 + 6);
    ctx.textAlign = 'left';
}

// Draws the current score
function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 8, 20);
}

// Draws the remaining lives
function drawLives() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Lives: ' + lives, canvas.width - 65, 20);
}

// Updates game state: paddle, ball, collisions, score, lives, win/lose
function update(){
    if (currentState !=  state.playing) {
        return;
    }

    // Move paddle if arrow keys pressed
    if (rightPressed && paddleX < canvas.width - paddleWidth){
        paddleX += paddleSpeed;
    }
    else if (leftPressed && paddleX > 0){
        paddleX -= paddleSpeed;
    }

    // Update ball position
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with left/right walls
    if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) {
        ballSpeedX = -ballSpeedX;
    }

    // Ball collision with top wall
    if (ballY - ballRadius < 0) {
        ballSpeedY = -ballSpeedY;
    }

    // Ball collision with paddle (with bounce angle calculation)
    if (
        ballY + ballRadius > canvas.height - paddleHeight - 10 &&
        ballX > paddleX &&
        ballX < paddleX + paddleWidth
    ) {
        // Calculate bounce angle based on where ball hits paddle
        const paddleCenter = paddleX + paddleWidth / 2;
        const hitPos = (ballX-paddleCenter) / (paddleWidth / 2); // -1 (left) to 1 (right)
        const maxBounceAngle = (Math.PI / 3);
        const angle = hitPos * maxBounceAngle;
        const speed = Math.sqrt(ballSpeedX ** 2 + ballSpeedY ** 2);
        ballSpeedX = speed * Math.sin(angle);
        ballSpeedY = -Math.abs(speed * Math.cos(angle));    
        ballY = canvas.height - paddleHeight - 10 - ballRadius;    
    }

    // Ball falls below paddle (miss)
    if (ballY - ballRadius > canvas.height){
        lives--;      
        if( lives <= 0){
            currentState = state.gameOver; //no lives left, game over
        }
        else {
            // Restart ball & paddle position
            ballX = canvas.width / 2;
            ballY = canvas.height - 40;
            paddleX = (canvas.width - paddleWidth) / 2;

        }
    }

    // Ball collision with bricks
    // Outer loop breaks after first collision for performance and realism
    outer: for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];

            if (b.status === 1) {
                if (
                    ballX + ballRadius > b.x &&
                    ballX - ballRadius < b.x + brickWidth &&
                    ballY + ballRadius > b.y &&
                    ballY - ballRadius < b.y + brickHeight
                ) {
                    const sound = hitSound.cloneNode();
                    hitSound.play();
                    score++;
                    if(score === brickRowCount * brickColumnCount){
                        currentState = state.win; //all bricks hit, player wins
                    }
                    ballSpeedY = -ballSpeedY;
                    b.status = 0; //mark brick as hit 
                    break outer;

                }
                
            }
            
        }
    }
    
}

// Resets game state for a new game or restart
function resetGame(){
    if (!currentDifficulty) return;
    const d = difficulty[currentDifficulty];
    paddleWidth = d.paddleWidth;
    lives = d.lives;
    ballX = canvas.width / 2;
    ballY = canvas.height - 40;   
    paddleX = (canvas.width - paddleWidth) /2;
    score = 0;
    currentState = state.playing;
    // Randomize ball launch angle within a range
    const minAngle = -Math.PI / 4; // -45 degrees
    const maxAngle = Math.PI / 4;  // 45 degrees
    const angle = Math.random() * (maxAngle - minAngle) + minAngle;
    ballSpeedX = difficulty[currentDifficulty].ballSpeedX * Math.sin(angle);
    ballSpeedY = -difficulty[currentDifficulty].ballSpeedX * Math.cos(angle);    
    resetBricks();
}

// Starts a new game at the selected difficulty
function startGame(level) {
    currentDifficulty = level;
    resetGame();
}

// Resets all bricks to visible
function resetBricks(){
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1; //reset all bricks to visible
        }
    }    
}

// Main game loop: updates and draws game each animation frame
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Handles keydown events for paddle movement and pause/resume
function keyDown(e){
    if(e.key === 'ArrowRight'){
        rightPressed = true;
    }
    else if(e.key === 'ArrowLeft'){
        leftPressed = true;
    }
    else if ((e.key === " " || e.code === "Space") && currentState === state.paused){
        currentState = state.playing;
    }   
    else if(e.key == "Escape" && currentState === state.playing){
        currentState = state.paused;
    }
}

// Handles keyup events for paddle movement
function keyUp(e){
    if(e.key === 'ArrowRight'){
        rightPressed = false;
    }
    else if(e.key === 'ArrowLeft'){
        leftPressed = false;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

gameLoop();