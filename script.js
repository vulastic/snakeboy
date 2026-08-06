'use strict';

//==========================================
// HTML
//==========================================

// Dom objects
const root = document.documentElement;
const consoleElement = document.getElementById('console');

// Functions
function initialize() {
    updateResolution();

    // add event handler
    if (window.visualViewport)
        window.visualViewport.addEventListener('resize', updateResolution);
    else
        window.addEventListener('resize', updateResolution);

    window.addEventListener('orientationchange', updateResolution);
}

// Calculate resolution
function updateResolution() {
    const viewport = window.visualViewport ?? window;
    const width = viewport.width;
    const height = viewport.height;
    
    // check landscape
    if (height < 700 && width / height >= 1.6) 
        consoleElement.classList.add('landscape');
    else
        consoleElement.classList.remove('landscape');
}


//==========================================
// Game Logic
//==========================================

// DOM
const screen = document.getElementById('screen');
const ctx = screen.getContext("2d");

// Variables
const COLORS = Object.freeze({
    BACKGROUND: "#4C5E16",
    BORDER:     "#1A1A1A",
    SNAKE:      "#4C5E16",
    SNAKE_HEAD: "#1A1A1A7F",
    FOOD:       "#810C487F"
});

const SCENE = Object.freeze({
    START:      "START",
    PLAYING:    "PLAYING",
    END:        "END"
});

const KEYCODE = Object.freeze({
    ENTER:  13,
    ESC:    27,
    LEFT:   37,
    UP:     38,
    RIGHT:  39,
    DOWN:   40
});

const BOARD = Object.freeze({
    WIDTH: 360,
    HEIGHT: 330,
    OFFSET_X: 20,
    OFFSET_Y: 50,
    TILE_SIZE: 15,
    COUNT_X: 24,
    COUNT_Y: 22
});

const gameObject = {
    scene: SCENE.START,
    score: 0,
    highScore: 0,
    flickerTimer: 0,
    flicker: false,

    // play object
    snake: [
        { x: 9, y: 11 },
        { x: 8, y: 11 },
        { x: 7, y: 11 },
    ],
    food: {x:5, y:5},
    direction: {x:1, y:0},
    keyChanged: false
};

// Utility Function
function drawBox(x, y, width, height) {
    // fill box
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(x, y, width, height);

    // draw stroke
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.BORDER;
    ctx.strokeRect(x, y, width, height);
}

function drawText(text, size, x, y, textAlign = 'center') {
    ctx.fillStyle = COLORS.BORDER;
    ctx.textAlign = textAlign;

    // draw title
    ctx.font = size + "px Silkscreen";
    ctx.fillText(text, x, y);
}

function drawTile(x, y, fillColor) {
    ctx.strokeStyle = COLORS.BORDER;
    ctx.fillStyle = fillColor;
    ctx.fillRect(BOARD.OFFSET_X + x * BOARD.TILE_SIZE, BOARD.OFFSET_Y + y * BOARD.TILE_SIZE, BOARD.TILE_SIZE, BOARD.TILE_SIZE);
    ctx.strokeRect(BOARD.OFFSET_X + x * BOARD.TILE_SIZE, BOARD.OFFSET_Y + y * BOARD.TILE_SIZE, BOARD.TILE_SIZE, BOARD.TILE_SIZE);
}

// Game Function
function startNewGame() {
    // Update highscore
    if (gameObject.score > gameObject.highScore)
        gameObject.highScore = gameObject.score;
    changeScene(SCENE.START);
}

function changeScene(scene) {
    gameObject.scene = scene;
    switch (scene) {
        case SCENE.START:
            gameObject.flickerTimer = 0;
            gameObject.flicker = true;
            break;

        case SCENE.PLAYING:
            gameObject.score = 0;
            gameObject.snake = [
                { x: 9, y: 11 },
                { x: 8, y: 11 },
                { x: 7, y: 11 }
            ];
            gameObject.direction.x = 1;
            gameObject.direction.y = 0;
            gameObject.keyChanged = false;
            generateFood();
            break;

        case SCENE.END:
            gameObject.flickerTimer = 0;
            gameObject.flicker = true;
            break;
    }
}

function changeDirection(x, y) {
    gameObject.direction.x = x;
    gameObject.direction.y = y;
    gameObject.keyChanged = true;
}

function generateFood() {
    const snake = gameObject.snake;
    const emptyTiles = [];
    
    for (let y = 0; y < BOARD.COUNT_Y; ++y) {
        for (let x = 0; x < BOARD.COUNT_X; ++x) {
            const occupied = snake.some(item =>
                item.x === x && item.y === y
            );
            if (!occupied)
                emptyTiles.push({ x, y });
        }
    }

    // if the board full, the game will end
    if (emptyTiles.length === 0) {
        return false;
    }

    const index = Math.floor(Math.random() * emptyTiles.length);
    const tile = emptyTiles[index];
    gameObject.food.x = tile.x;
    gameObject.food.y = tile.y;
    return true;
}

// Game Loop
function gameInit() {
    startNewGame();

    // action button input
    document.getElementById("actionStart").addEventListener('click', () => { inputKeyboard({ keyCode: KEYCODE.ENTER }); });
    document.getElementById("actionReset").addEventListener('click', () => { inputKeyboard({ keyCode: KEYCODE.ESC }); });

    // dpad input
    document.getElementById("dpadUp").addEventListener('click', () => { inputKeyboard({ keyCode: KEYCODE.UP }); });
    document.getElementById("dpadLeft").addEventListener('click', () => { inputKeyboard({ keyCode: KEYCODE.LEFT }); });
    document.getElementById("dpadRight").addEventListener('click', () => { inputKeyboard({ keyCode: KEYCODE.RIGHT }); });
    document.getElementById("dpadDown").addEventListener('click', () => { inputKeyboard({ keyCode: KEYCODE.DOWN }); });

    // keyboard input
    document.addEventListener("keydown", inputKeyboard);
}

function gameLoop() {
  const gameInterval = setTimeout(() => {
    clearCanvas();
    updateGame();
    drawScene();
    gameLoop();     // make infinity loop
  }, 100);          // 10 fps
}

// In loop functions
function clearCanvas() {
    // clear canvas
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, screen.width, screen.height);
}

function updateGame() {
    switch (gameObject.scene) {
        case SCENE.START:
        case SCENE.END:
            // Count timer
            if (++gameObject.flickerTimer >= 10) {
                gameObject.flickerTimer = 0;
                gameObject.flicker = !gameObject.flicker;
            }
            break;

        case SCENE.PLAYING:
            const snake = gameObject.snake;
            const head = snake[0];
            const newHead = {
                x: head.x + gameObject.direction.x,
                y: head.y + gameObject.direction.y
            };

            // collision chequing
            for (let i = 4; i < snake.length; ++i) {
                const item = snake[i];
                if (item.x === newHead.x && item.y === newHead.y) {
                    changeScene(SCENE.END);
                    return;
                }
            }
            
            const hitTopBorder = newHead.y < 0;
            const hitLeftBorder = newHead.x < 0;
            const hitRightBorder = newHead.x >= BOARD.COUNT_X;
            const hitBottomBorder = newHead.y >= BOARD.COUNT_Y;
            if (hitTopBorder || hitLeftBorder || hitRightBorder || hitBottomBorder) {
                changeScene(SCENE.END);
                return;
            }
            
            // add new snakehead
            snake.unshift(newHead);
            
            // check to eat food
            if (newHead.x == gameObject.food.x && newHead.y == gameObject.food.y) {
                gameObject.score += 1;
                if (!generateFood()) {
                    changeScene(SCENE.END);
                    return;
                }
            }
            else {
                gameObject.snake.pop();
            }
            gameObject.keyChanged = false;
            break;
    }
}

function drawScene() {
    const screenCenterX = screen.width / 2;
    const screenCenterY = screen.height / 2;
    
    switch (gameObject.scene) {
        // Intro scene
        case SCENE.START:
            // draw title
            drawText("Snake Boy", 48, screenCenterX, screenCenterY - 20);
            
            // draw flicker text
            if (gameObject.flicker) {
                drawText("Press any button", 20, screenCenterX, screenCenterY + 60);
            }
            break;
            
        // Game playing
        case SCENE.PLAYING:
            const textY = 30;
            drawBox(BOARD.OFFSET_X, BOARD.OFFSET_Y, BOARD.WIDTH, BOARD.HEIGHT);
            drawText("Score: " + gameObject.score, 18, BOARD.OFFSET_X, textY, 'left');
            drawText("High Score: " + gameObject.highScore, 18, BOARD.OFFSET_X + BOARD.WIDTH, textY, 'right');
            gameObject.snake.forEach((item, index) => {
                drawTile(item.x, item.y, index == 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE);
            });
            drawTile(gameObject.food.x, gameObject.food.y, COLORS.FOOD);
            break;

        // Game Finished
        case SCENE.END:
            // draw box
            drawBox(60, 80, 280, 240);  // custom box

            // draw score
            const scoreText = gameObject.score > gameObject.highScore ? "High Scored!" : "You Scored";
            drawText(scoreText, 28, screenCenterX, screenCenterY - 60);
            drawText(gameObject.score, 28, screenCenterX, screenCenterY);

            // draw flicker text
            if (gameObject.flicker) {
                drawText("Press Start", 20, screenCenterX, screenCenterY + 70);
            }
            break;
    }
}

//==========================================
// Input Events
//==========================================
function inputKeyboard(event) {
    const key = event.keyCode;
    if (key == KEYCODE.ESC) {
        startNewGame();
        return;
    }

    switch (gameObject.scene) {
        case SCENE.START:
            changeScene(SCENE.PLAYING);
            break;

        case SCENE.END:
            if (key == KEYCODE.ENTER)
                startNewGame();
            break;

        case SCENE.PLAYING:
            // prevent duplicated input
            if (gameObject.keyChanged)
                return;
            
            switch (key) {
                case KEYCODE.UP:
                    if (gameObject.direction.y === 0)
                        changeDirection(0, -1);
                    break;
                case KEYCODE.LEFT:
                    if (gameObject.direction.x === 0)
                        changeDirection(-1, 0);
                    break;
                case KEYCODE.RIGHT:
                    if (gameObject.direction.x === 0)
                        changeDirection(1, 0);
                    break;
                case KEYCODE.DOWN:
                    if (gameObject.direction.y === 0)
                        changeDirection(0, 1);
                    break;
            }
            break;
    }
}

//==========================================
// Entry Point
//==========================================
initialize();
gameInit();
gameLoop();
