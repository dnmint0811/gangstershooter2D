window.addEventListener("DOMContentLoaded", () => {
  const bg = document.querySelector(".background");
  const selectedMap = localStorage.getItem("selectedMap");

  if (selectedMap && bg) {
    bg.style.backgroundImage = `url('assets/images/${selectedMap}')`;
    bg.style.backgroundRepeat = "repeat-x";
    bg.style.backgroundSize = "auto 100%";
  } else {
    // Nếu chưa chọn map nào → quay về màn hình chọn nhiệm vụ
    window.location.href = "select.html";
  }
});
const player = document.querySelector('.player');
const background = document.querySelector('.background');
const shootBtn = document.querySelector('.shoot-btn');
const healthBar = document.querySelector('.health-bar');
const gameOverScreen = document.getElementById('gameOver');
const playAgainBtn = document.getElementById('playAgain');

let playerX = player.offsetLeft;
let moveInterval = null;
let enemies = [];
let playerHealth = 100;

window.addEventListener('load', () => {
  const screenWidth = document.querySelector('.game-container').offsetWidth;
  const bgWidth = background.offsetWidth;
  const playerWidth = player.offsetWidth;

  initMoveLogic(screenWidth, bgWidth, playerWidth);

  spawnEnemy(bgWidth);
  setInterval(() => spawnEnemy(bgWidth), 5000);
});

function initMoveLogic(screenWidth, bgWidth, playerWidth) {
  function updatePlayer() {
    player.style.left = `${playerX}px`;
    const scrollX = Math.max(0, Math.min(playerX - screenWidth / 2, bgWidth - screenWidth));
    background.style.transform = `translateX(${-scrollX}px)`;
  }

  function move(direction) {
    stopMove();
    moveInterval = setInterval(() => {
      if (direction === 'left') {
        playerX -= 5;
        if (playerX < 0) playerX = 0;
        player.classList.add('flip');
      }

      if (direction === 'right') {
        playerX += 5;
        const maxRight = bgWidth - player.offsetWidth;
        if (playerX > maxRight) playerX = maxRight;
        player.classList.remove('flip');
      }

      updatePlayer();
    }, 16);
  }

  function stopMove() {
    clearInterval(moveInterval);
    moveInterval = null;
  }

  function shootBullet() {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');

    const playerBox = player.getBoundingClientRect();
    const containerBox = document.querySelector('.game-container').getBoundingClientRect();

    const top = playerBox.top + playerBox.height * 0.38 - containerBox.top;
    const left = playerBox.left + playerBox.width / 2 - containerBox.left - 8;

    bullet.style.top = `${top}px`;
    bullet.style.left = `${left}px`;

    document.querySelector('.game-container').appendChild(bullet);

    const isFlipped = player.classList.contains('flip');
    const direction = isFlipped ? -1 : 1;
    const speed = 10;

    const interval = setInterval(() => {
      const currentX = parseFloat(bullet.style.left);
      bullet.style.left = `${currentX + direction * speed}px`;

      enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        const bulletBox = bullet.getBoundingClientRect();
        const enemyBox = enemy.el.getBoundingClientRect();

        const hit =
          bulletBox.right > enemyBox.left &&
          bulletBox.left < enemyBox.right &&
          bulletBox.top < enemyBox.bottom &&
          bulletBox.bottom > enemyBox.top;

        if (hit) {
          bullet.remove();
          clearInterval(interval);
          enemy.hit++;
          if (enemy.hit >= 3) {
            enemy.el.remove();
            enemy.alive = false;
          }
        }
      });

      if (currentX < 0 || currentX > bgWidth) {
        bullet.remove();
        clearInterval(interval);
      }
    }, 16);
  }

  // Điều khiển
  const leftBtn = document.querySelector('.left-btn');
  const rightBtn = document.querySelector('.right-btn');

  leftBtn.addEventListener('touchstart', () => move('left'));
  rightBtn.addEventListener('touchstart', () => move('right'));
  leftBtn.addEventListener('touchend', stopMove);
  rightBtn.addEventListener('touchend', stopMove);

  leftBtn.addEventListener('mousedown', () => move('left'));
  rightBtn.addEventListener('mousedown', () => move('right'));
  leftBtn.addEventListener('mouseup', stopMove);
  rightBtn.addEventListener('mouseup', stopMove);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') move('left');
    if (e.key === 'ArrowRight') move('right');
    if (e.key === ' ') shootBullet();
  });

  document.addEventListener('keyup', stopMove);

  shootBtn.addEventListener('touchstart', () => {
    const audio = new Audio('assets/sounds/shoot.wav');
    audio.play();
    shootBullet();
  });

  shootBtn.addEventListener('mousedown', () => {
    const audio = new Audio('assets/sounds/shoot.wav');
    audio.play();
    shootBullet();
  });

  playAgainBtn.addEventListener('click', resetGame);
}

function damagePlayer(amount) {
  if (playerHealth <= 0) return;

  playerHealth -= amount;
  if (playerHealth < 0) playerHealth = 0;

  healthBar.style.width = `${playerHealth}%`;

  player.classList.add('damage-flash');
  setTimeout(() => player.classList.remove('damage-flash'), 300);

  if (playerHealth <= 0) {
    showGameOver();
  }
}

function showGameOver() {
  gameOverScreen.style.display = 'flex';
}

function resetGame() {
  playerHealth = 100;
  healthBar.style.width = '100%';
  player.classList.remove('damage-flash');
  playerX = 100;
  player.style.left = '100px';

  enemies.forEach(e => e.el.remove());
  enemies = [];

  gameOverScreen.style.display = 'none';

  spawnEnemy(background.offsetWidth);
}

function spawnEnemy(bgWidth) {
  const enemyEl = document.createElement('div');
  enemyEl.classList.add('enemy');

  const side = Math.random() < 0.5 ? 'left' : 'right';
  let x = side === 'left' ? -100 : bgWidth + 100;
  let speed = side === 'left' ? 2 : -2;

  enemyEl.style.left = `${x}px`;
  enemyEl.style.transform = side === 'left' ? 'scaleX(-1)' : 'scaleX(1)';

  document.querySelector('.game-container').appendChild(enemyEl);

  const enemy = {
    el: enemyEl,
    hit: 0,
    alive: true,
    stopped: false,
  };
  enemies.push(enemy);

  const move = setInterval(() => {
    if (!enemy.alive) {
      clearInterval(move);
      return;
    }

    if (enemy.stopped) return;

    x += speed;
    enemyEl.style.left = `${x}px`;

    const enemyBox = enemyEl.getBoundingClientRect();
    const playerBox = player.getBoundingClientRect();

    const isTouchingPlayer =
      enemyBox.right > playerBox.left &&
      enemyBox.left < playerBox.right &&
      enemyBox.bottom > playerBox.top &&
      enemyBox.top < playerBox.bottom;

    if (isTouchingPlayer) {
      enemy.stopped = true;
      damagePlayer(20);

      setTimeout(() => {
        if (!enemy.alive) return;

        const r = Math.random();
        if (r < 0.5) {
          speed = playerX < x ? -2 : 2;
        } else {
          speed = Math.random() < 0.5 ? -2 : 2;
        }

        enemyEl.style.transform = speed < 0 ? 'scaleX(1)' : 'scaleX(-1)';
        enemy.stopped = false;
      }, 3000);
    }
  }, 30);
}
