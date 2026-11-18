'use strict';

// Two original, browser-only mini games. No external dependencies and no data collection.
const $ = (id) => document.getElementById(id);
const tabs = { snake: $('tab-snake'), memory: $('tab-memory') };
const panels = { snake: $('panel-snake'), memory: $('panel-memory') };
let currentTab = 'snake';

function showTab(which) {
  currentTab = which;
  for (const key of Object.keys(tabs)) {
    tabs[key].classList.toggle('active', key === which);
    tabs[key].setAttribute('aria-selected', String(key === which));
    panels[key].classList.toggle('hidden', key !== which);
  }
  if (which !== 'snake' && snake.running && !snake.paused) pauseSnake();
}
tabs.snake.addEventListener('click', () => showTab('snake'));
tabs.memory.addEventListener('click', () => showTab('memory'));

// SNAKE — fixed-step movement, keyboard / touch controls.
const canvas = $('snake-canvas');
const ctx = canvas.getContext('2d');
const GRID = 18, CELL = canvas.width / GRID;
const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const snake = { body: [], direction: DIRS.right, next: DIRS.right, food: null, score: 0, best: 0, running: false, paused: false, timer: null, turned: false };
try { snake.best = Number(localStorage.getItem('akimmstar.snakeBest')) || 0; } catch (_) { /* storage may be disabled */ }
function foodPosition() {
  const empty = [];
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    if (!snake.body.some(part => part.x === x && part.y === y)) empty.push({ x, y });
  }
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}
function updateSnakeScores() {
  $('snake-score').textContent = String(snake.score).padStart(3, '0');
  $('snake-best').textContent = String(snake.best).padStart(3, '0');
}
function overlay(title, subtitle, symbol) {
  $('snake-overlay-title').textContent = title;
  $('snake-overlay-subtitle').textContent = subtitle;
  document.querySelector('.overlay-symbol').textContent = symbol;
  $('snake-overlay').classList.remove('off');
}
function initSnake() {
  clearInterval(snake.timer); snake.timer = null;
  snake.body = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
  snake.direction = DIRS.right; snake.next = DIRS.right;
  snake.food = foodPosition(); snake.score = 0;
  snake.running = false; snake.paused = false; snake.turned = false;
  $('snake-pause').textContent = 'Ⅱ PAUSE';
  overlay('READY, PLAYER ONE?', 'Press START to begin', '🐍');
  updateSnakeScores(); drawSnake();
}
function drawSnake() {
  ctx.fillStyle = '#0a1020'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#1c2842'; ctx.lineWidth = .65;
  for (let i = 0; i <= GRID; i++) {
    const p = i * CELL; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvas.width, p); ctx.stroke();
  }
  if (snake.food) {
    const x = snake.food.x * CELL, y = snake.food.y * CELL;
    ctx.shadowColor = '#ff65b9'; ctx.shadowBlur = 17;
    ctx.fillStyle = '#ff65b9'; ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2, CELL * .32, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  snake.body.forEach((part, index) => {
    ctx.fillStyle = index ? '#33cfa5' : '#89f9d6';
    ctx.fillRect(part.x * CELL + 2, part.y * CELL + 2, CELL - 4, CELL - 4);
    if (!index) { ctx.fillStyle = '#08261d'; ctx.fillRect(part.x * CELL + 12, part.y * CELL + 6, 3, 3); }
  });
}
function endSnake(message) {
  clearInterval(snake.timer); snake.timer = null;
  snake.running = false; snake.paused = false;
  overlay(message, `Final score: ${snake.score} • Press START to try again`, message === 'YOU WIN!' ? '🏆' : '💥');
}
function tickSnake() {
  snake.direction = snake.next;
  snake.turned = false;
  const head = { x: snake.body[0].x + snake.direction.x, y: snake.body[0].y + snake.direction.y };
  const eating = snake.food && head.x === snake.food.x && head.y === snake.food.y;
  const collisionBody = eating ? snake.body : snake.body.slice(0, -1);
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || collisionBody.some(p => p.x === head.x && p.y === head.y)) {
    endSnake('GAME OVER'); return;
  }
  snake.body.unshift(head);
  if (eating) {
    snake.score += 10;
    if (snake.score > snake.best) {
      snake.best = snake.score;
      try { localStorage.setItem('akimmstar.snakeBest', String(snake.best)); } catch (_) {}
    }
    snake.food = foodPosition();
    updateSnakeScores();
    if (!snake.food) { drawSnake(); endSnake('YOU WIN!'); return; }
  } else snake.body.pop();
  drawSnake();
}
function startSnake() {
  if (!snake.running) initSnake();
  snake.running = true; snake.paused = false;
  $('snake-overlay').classList.add('off');
  clearInterval(snake.timer); snake.timer = setInterval(tickSnake, 130);
  $('snake-pause').textContent = 'Ⅱ PAUSE';
}
function pauseSnake() {
  if (!snake.running) return;
  snake.paused = !snake.paused;
  if (snake.paused) {
    clearInterval(snake.timer); snake.timer = null;
    overlay('PAUSED', 'Press RESUME or SPACE to continue', '⏸');
  } else {
    $('snake-overlay').classList.add('off');
    snake.timer = setInterval(tickSnake, 130);
  }
  $('snake-pause').textContent = snake.paused ? '▶ RESUME' : 'Ⅱ PAUSE';
}
function changeDirection(dirName) {
  if (currentTab !== 'snake' || !snake.running || snake.paused || snake.turned) return;
  const target = DIRS[dirName];
  if (target.x === -snake.direction.x && target.y === -snake.direction.y) return;
  snake.next = target; snake.turned = true;
}
$('snake-start').addEventListener('click', startSnake);
$('snake-pause').addEventListener('click', pauseSnake);
$('snake-reset').addEventListener('click', initSnake);
const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
document.addEventListener('keydown', (event) => {
  if (currentTab !== 'snake' || event.altKey || event.ctrlKey || event.metaKey) return;
  const active = document.activeElement;
  if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
  const direction = keyMap[event.key] || keyMap[event.key.toLowerCase()];
  if (direction) { event.preventDefault(); changeDirection(direction); }
  if (event.code === 'Space') { event.preventDefault(); pauseSnake(); }
});
document.querySelectorAll('[data-dir]').forEach(button => button.addEventListener('click', () => changeDirection(button.dataset.dir)));
initSnake();

// MEMORY MATCH — shuffled cards, guarded asynchronous flip resolution.
const icons = ['🐍','👾','💎','🚀','⭐','🧠','🎯','⚡'];
let memory = { deck: [], first: null, second: null, locked: false, moves: 0, pairs: 0, timer: null };
function updateMemoryScores() {
  $('memory-moves').textContent = String(memory.moves).padStart(2, '0');
  $('memory-pairs').textContent = `${memory.pairs}/8`;
}
function newMemory() {
  if (memory.timer) clearTimeout(memory.timer);
  memory = { deck: [...icons, ...icons].map((symbol, index) => ({ symbol, id: index, matched: false, revealed: false })), first: null, second: null, locked: false, moves: 0, pairs: 0, timer: null };
  for (let i = memory.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [memory.deck[i], memory.deck[j]] = [memory.deck[j], memory.deck[i]];
  }
  $('memory-win').textContent = '';
  updateMemoryScores(); renderMemory();
}
function renderMemory() {
  const grid = $('memory-grid');
  grid.replaceChildren();
  memory.deck.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'memory-card';
    const faceUp = card.revealed || card.matched;
    button.textContent = faceUp ? card.symbol : '?';
    button.setAttribute('aria-label', faceUp ? `Card ${index + 1}: ${card.symbol}` : `Card ${index + 1}: hidden`);
    button.classList.toggle('flipped', faceUp);
    button.classList.toggle('matched', card.matched);
    button.disabled = card.matched || card.revealed || memory.locked;
    button.addEventListener('click', () => flipMemory(index));
    grid.appendChild(button);
  });
}
function flipMemory(index) {
  const card = memory.deck[index];
  if (memory.locked || card.revealed || card.matched) return;
  card.revealed = true;
  if (memory.first === null) memory.first = index;
  else {
    memory.second = index; memory.moves++;
    const first = memory.deck[memory.first];
    if (first.symbol === card.symbol) {
      first.matched = true; card.matched = true; memory.pairs++;
      memory.first = null; memory.second = null;
      if (memory.pairs === 8) $('memory-win').textContent = `🏆 PERFECT! Completed in ${memory.moves} moves!`;
    } else {
      memory.locked = true;
      memory.timer = setTimeout(() => {
        first.revealed = false; card.revealed = false;
        memory.first = null; memory.second = null; memory.locked = false;
        memory.timer = null; renderMemory();
      }, 850);
    }
  }
  updateMemoryScores(); renderMemory();
}
$('memory-restart').addEventListener('click', newMemory);
newMemory();
