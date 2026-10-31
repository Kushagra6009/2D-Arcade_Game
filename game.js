/* ==========================================================================
   CAMPUS CYCLE RUSH: 8:59 AM
   Multimedia Systems Lab — Lab Test 2: Customizable 2D Arcade Game
   
   Author: Kushagra (Student Submission)
   Technology: HTML5 Canvas, Vanilla JavaScript, Web Audio API
   ========================================================================== */

// ==========================================================================
// 1. GAME CONFIGURATION (EASY TO TWEAK DURING LAB EVALUATION / VIVA)
// ==========================================================================
const CONFIG = {
  // Player Settings
  PLAYER_SPEED: 7.0,             // Horizontal steer speed
  INITIAL_ATTENDANCE: 100,       // Starting attendance percentage
  MIN_ATTENDANCE_TO_PASS: 60,    // Below this = Game Over (Shortage)
  ATTENDANCE_LOSS_DOG: 20,       // Attendance lost when hitting dog
  ATTENDANCE_LOSS_PROF: 30,      // Attendance lost when hitting professor
  ATTENDANCE_LOSS_PUDDLE: 10,    // Attendance lost on puddle skid

  // Goal & Progression Settings
  TOTAL_DISTANCE_METERS: 600,    // Distance from hostel to Lab 204
  BASE_SCROLL_SPEED: 4.5,        // Starting road scroll speed
  MAX_SCROLL_SPEED: 8.5,         // Maximum speed at final stretch
  SPEED_ACCELERATION: 0.003,     // Rate at which speed ramps up

  // Spawn Timing (in frames at 60 FPS)
  ITEM_SPAWN_INTERVAL: 85,       // Spawn collectible every ~1.4s
  HAZARD_SPAWN_INTERVAL: 95,     // Spawn hazard every ~1.6s

  // Power-Up Duration
  SHIELD_DURATION_FRAMES: 300,   // Hall ticket invincibility (5 seconds @ 60fps)
  COFFEE_BOOST_FRAMES: 180,      // Coffee speed boost duration (3 seconds)

  // Scoring
  SCORE_ID_CARD: 30,
  SCORE_ASSIGNMENT: 20,
  SCORE_HALL_TICKET: 50,
  SCORE_DISTANCE_FACTOR: 0.1     // Points per distance unit traveled
};

// ==========================================================================
// 2. RETRO SOUND SYNTHESIZER (Web Audio API — 100% Native, No external files)
// ==========================================================================
class SoundController {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.bgmOscillator = null;
    this.bgmGain = null;
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  // Initialize Web Audio Context upon first user interaction
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Bicycle Bell: Dual high-pitched pleasant bell rings (Ding-Ding!)
  playBell() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [1760, 2093].forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      gain.gain.setValueAtTime(0.18, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.3);
    });
  }

  // Item Collect: High ascending coin chime
  playCollect() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Coffee Drink: Bubbly rising sound
  playCoffee() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.22);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Hall Ticket: Celestial Power-Up Chord
  playShield() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.14, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.42);
    });
  }

  // Hazard Crash: Low skid buzz noise
  playCrash() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Dog Bark / Low honk
  playDogBark() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Game Over: Descending defeat fanfare
  playGameOver() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [392, 349.23, 311.13, 261.63].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.16);
      gain.gain.setValueAtTime(0.2, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.3);
    });
  }

  // Victory Fanfare: Triumphant brass sequence
  playVictory() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.14);
      gain.gain.setValueAtTime(0.25, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.45);
    });
  }

  // Synthesized Retro Chiptune Background Groove
  startBGM() {
    if (this.bgmInterval || !this.musicEnabled) return;
    this.init();
    // 8-note retro bass groove (C - E - G - A - C - G - F - D)
    const notes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 196.00, 164.81];
    this.bgmStep = 0;

    this.bgmInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(notes[this.bgmStep % notes.length], now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
      this.bgmStep++;
    }, 220); // ~136 BPM
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const sounds = new SoundController();

// ==========================================================================
// 3. GAME STATE MANAGEMENT & VARIABLES
// ==========================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States: 'START', 'PLAYING', 'PAUSED', 'GAMEOVER', 'VICTORY'
let gameState = 'START';

// Road Boundaries (Campus Walkway inside canvas width 540)
const ROAD = {
  left: 70,
  right: 470,
  width: 400,
  lanes: [136, 270, 404] // 3 main travel corridors
};

// Player Cyclist Object
const player = {
  x: ROAD.lanes[1],
  y: 570,
  width: 38,
  height: 66,
  targetX: ROAD.lanes[1],
  steerSpeed: CONFIG.PLAYER_SPEED,
  pedalAngle: 0,
  tiltAngle: 0,
  attendance: CONFIG.INITIAL_ATTENDANCE,
  shieldTimer: 0,
  coffeeTimer: 0,
  invulnerableTimer: 0
};

// Active Game Entities
let collectibles = [];
let hazards = [];
let particles = [];
let scenery = [];

// Game Counters & Progress
let score = 0;
let distanceRemaining = CONFIG.TOTAL_DISTANCE_METERS;
let currentScrollSpeed = CONFIG.BASE_SCROLL_SPEED;
let roadMarkingOffset = 0;
let itemsCollectedCount = 0;
let frameCount = 0;
let screenShakeTimer = 0;
let highScore = parseInt(localStorage.getItem('campus_cycle_highscore') || '0', 10);

// Exam Clock (Simulates 8:58:00 AM to 9:00:00 AM)
const START_TIME_SEC = 8 * 3600 + 58 * 60; // 08:58:00 (in seconds)
const DEADLINE_SEC = 9 * 3600;              // 09:00:00
let simulatedClockSec = START_TIME_SEC;

// Input State
const keys = {
  left: false,
  right: false,
  up: false,
  down: false
};

// ==========================================================================
// 4. ENTITY INITIALIZATION & SCENERY GENERATION
// ==========================================================================
function initScenery() {
  scenery = [];
  // Populate roadside campus trees and lampposts
  for (let y = -100; y < canvas.height + 200; y += 90) {
    scenery.push({
      x: 35,
      y: y,
      type: Math.random() > 0.4 ? 'tree' : 'lamp',
      side: 'left'
    });
    scenery.push({
      x: 505,
      y: y + 45,
      type: Math.random() > 0.4 ? 'tree' : 'flower',
      side: 'right'
    });
  }
}

// Reset everything for a fresh run
function resetGame() {
  gameState = 'PLAYING';
  score = 0;
  distanceRemaining = CONFIG.TOTAL_DISTANCE_METERS;
  currentScrollSpeed = CONFIG.BASE_SCROLL_SPEED;
  simulatedClockSec = START_TIME_SEC;
  itemsCollectedCount = 0;
  frameCount = 0;
  screenShakeTimer = 0;

  player.x = ROAD.lanes[1];
  player.targetX = ROAD.lanes[1];
  player.y = 570;
  player.attendance = CONFIG.INITIAL_ATTENDANCE;
  player.shieldTimer = 0;
  player.coffeeTimer = 0;
  player.invulnerableTimer = 0;
  player.tiltAngle = 0;

  collectibles = [];
  hazards = [];
  particles = [];
  initScenery();

  updateHUD();
  hideAllOverlays();
  sounds.startBGM();
}

// ==========================================================================
// 5. INPUT HANDLING (KEYBOARD, MOUSE, TOUCH)
// ==========================================================================
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;

  // Global Start / Restart shortcuts
  if ((e.code === 'Enter' || e.code === 'Space') && gameState === 'START') {
    resetGame();
    return;
  }
  if (e.code === 'Space' && (gameState === 'GAMEOVER' || gameState === 'VICTORY')) {
    resetGame();
    return;
  }

  // Pause Toggle
  if (e.code === 'KeyP') {
    togglePause();
    return;
  }

  // Steering Keys
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;

  // Bicycle Bell Trigger
  if (e.code === 'Space' && gameState === 'PLAYING') {
    triggerBicycleBell();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
});

// Canvas Mouse / Touch drag steering
let isPointerDown = false;
canvas.addEventListener('pointerdown', (e) => {
  if (gameState !== 'PLAYING') return;
  isPointerDown = true;
  updatePointerSteer(e);
});

window.addEventListener('pointermove', (e) => {
  if (isPointerDown && gameState === 'PLAYING') {
    updatePointerSteer(e);
  }
});

window.addEventListener('pointerup', () => { isPointerDown = false; });

function updatePointerSteer(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const canvasX = (e.clientX - rect.left) * scaleX;
  player.targetX = Math.max(ROAD.left + 25, Math.min(ROAD.right - 25, canvasX));
}

// On-Screen touch control buttons
document.getElementById('touchLeft').addEventListener('pointerdown', () => { keys.left = true; });
document.getElementById('touchLeft').addEventListener('pointerup', () => { keys.left = false; });
document.getElementById('touchRight').addEventListener('pointerdown', () => { keys.right = true; });
document.getElementById('touchRight').addEventListener('pointerup', () => { keys.right = false; });
document.getElementById('touchBell').addEventListener('click', () => {
  if (gameState === 'PLAYING') triggerBicycleBell();
});

// Ringing Bell scares away nearby dogs & clears road
function triggerBicycleBell() {
  sounds.playBell();
  // Spawn bell soundwave visual particles around player
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    particles.push({
      x: player.x,
      y: player.y - 10,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      size: 4,
      color: '#ffd700',
      life: 25,
      maxLife: 25
    });
  }

  // Scared dog mechanic: If dog is close in front, it flees to the sidewalk
  hazards.forEach(h => {
    if (h.type === 'dog' && Math.abs(h.x - player.x) < 90 && h.y < player.y && h.y > player.y - 200) {
      h.vx = h.x < player.x ? -4.5 : 4.5; // Dog runs sideways!
      h.scared = true;
    }
  });
}

function togglePause() {
  if (gameState === 'PLAYING') {
    gameState = 'PAUSED';
    document.getElementById('pauseScore').textContent = Math.floor(score);
    document.getElementById('pauseDistance').textContent = `${Math.ceil(distanceRemaining)}m`;
    document.getElementById('pauseScreen').classList.add('active');
    sounds.stopBGM();
  } else if (gameState === 'PAUSED') {
    gameState = 'PLAYING';
    document.getElementById('pauseScreen').classList.remove('active');
    sounds.startBGM();
  }
}

// ==========================================================================
// 6. SPAWN SYSTEMS (COLLECTIBLES & HAZARDS)
// ==========================================================================
function spawnCollectible() {
  const laneIndex = Math.floor(Math.random() * ROAD.lanes.length);
  const laneX = ROAD.lanes[laneIndex] + (Math.random() * 30 - 15);

  // Probabilities: 45% Assignment, 35% ID Card, 12% Coffee, 8% Hall Ticket
  const rand = Math.random();
  let type = 'assignment';
  if (rand < 0.08) {
    type = 'hall_ticket';
  } else if (rand < 0.20) {
    type = 'coffee';
  } else if (rand < 0.55) {
    type = 'id_card';
  }

  collectibles.push({
    x: laneX,
    y: -40,
    width: 32,
    height: 32,
    type: type,
    bobOffset: Math.random() * Math.PI * 2
  });
}

function spawnHazard() {
  const laneIndex = Math.floor(Math.random() * ROAD.lanes.length);
  const laneX = ROAD.lanes[laneIndex] + (Math.random() * 20 - 10);

  // Probabilities: 40% Puddle, 35% Dog, 25% Professor
  const rand = Math.random();
  let type = 'puddle';
  let width = 42;
  let height = 30;
  let vx = 0;

  if (rand < 0.35) {
    type = 'dog';
    width = 38;
    height = 36;
    // Dogs run diagonally across lanes
    vx = Math.random() > 0.5 ? 1.2 : -1.2;
  } else if (rand < 0.60) {
    type = 'professor';
    width = 36;
    height = 54;
    vx = (Math.random() - 0.5) * 0.8; // Slow wandering
  }

  hazards.push({
    x: laneX,
    y: -50,
    width: width,
    height: height,
    type: type,
    vx: vx,
    animFrame: 0,
    scared: false
  });
}

// Particle generator helper
function createSparks(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3.5 + 1;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      color: color,
      life: 20 + Math.floor(Math.random() * 15),
      maxLife: 35
    });
  }
}

// ==========================================================================
// 7. COLLISION DETECTION ALGORITHM (AABB + DISTANCE-BASED)
// ==========================================================================
/**
 * Axis-Aligned Bounding Box (AABB) Collision Detection
 * Formula: Check overlap along both X and Y projection axes.
 * Returns true if boxes intersect with an inner padding margin.
 */
function checkAABBCollision(rect1, rect2, padding = 6) {
  return (
    rect1.x + padding < rect2.x + rect2.width - padding &&
    rect1.x + rect1.width - padding > rect2.x + padding &&
    rect1.y + padding < rect2.y + rect2.height - padding &&
    rect1.y + rect1.height - padding > rect2.y + padding
  );
}

// ==========================================================================
// 8. UPDATE CYCLE (PHYSICS, SCROLLING, COLLISIONS)
// ==========================================================================
function update() {
  if (gameState !== 'PLAYING') return;

  frameCount++;

  // 1. Difficulty & Speed Scaling
  if (currentScrollSpeed < CONFIG.MAX_SCROLL_SPEED) {
    currentScrollSpeed += CONFIG.SPEED_ACCELERATION;
  }
  const effectiveSpeed = player.coffeeTimer > 0 
    ? currentScrollSpeed * 1.35 
    : currentScrollSpeed;

  // 2. Distance Traveled & Simulated Exam Clock Countdown
  const distanceCoveredThisFrame = (effectiveSpeed * 0.05);
  distanceRemaining -= distanceCoveredThisFrame;
  score += distanceCoveredThisFrame * CONFIG.SCORE_DISTANCE_FACTOR;

  // Clock advances 2 minutes (120 sec) over 600 meters
  const progressRatio = 1 - (Math.max(0, distanceRemaining) / CONFIG.TOTAL_DISTANCE_METERS);
  simulatedClockSec = START_TIME_SEC + progressRatio * (DEADLINE_SEC - START_TIME_SEC);

  // 3. Road Markings & Scenery Scroll
  roadMarkingOffset = (roadMarkingOffset + effectiveSpeed) % 40;
  scenery.forEach(item => {
    item.y += effectiveSpeed;
    if (item.y > canvas.height + 60) {
      item.y = -80;
      item.type = Math.random() > 0.4 ? 'tree' : 'lamp';
    }
  });

  // 4. Player Steering Physics
  let steerDir = 0;
  if (keys.left) steerDir -= 1;
  if (keys.right) steerDir += 1;

  if (steerDir !== 0) {
    player.x += steerDir * player.steerSpeed;
    player.tiltAngle = steerDir * 0.12; // Realistic bicycle lean
    player.targetX = player.x;
  } else {
    // Smooth interpolation towards pointer target if mouse/touch was used
    const dx = player.targetX - player.x;
    if (Math.abs(dx) > 1) {
      player.x += dx * 0.15;
      player.tiltAngle = Math.sign(dx) * Math.min(0.12, Math.abs(dx) * 0.005);
    } else {
      player.tiltAngle *= 0.85; // Stabilize upright
    }
  }

  // Constrain to road boundaries
  player.x = Math.max(ROAD.left + player.width / 2 + 5, Math.min(ROAD.right - player.width / 2 - 5, player.x));

  // Forward/Backward pedal adjustments
  if (keys.up && player.y > 440) player.y -= 2;
  if (keys.down && player.y < 620) player.y += 2;

  // Wheel & Pedaling Animation cycle
  player.pedalAngle += effectiveSpeed * 0.12;

  // Bicycle Tire Dust Particles
  if (frameCount % 4 === 0) {
    particles.push({
      x: player.x + (Math.random() * 8 - 4),
      y: player.y + player.height / 2,
      vx: (Math.random() - 0.5) * 0.8,
      vy: effectiveSpeed * 0.35,
      size: Math.random() * 3 + 2,
      color: '#475569',
      life: 14,
      maxLife: 14
    });
  }

  // 5. Timers (Shield, Coffee Boost, Invulnerability)
  if (player.shieldTimer > 0) {
    player.shieldTimer--;
    // Gold sparkle aura around shield
    if (frameCount % 3 === 0) {
      const angle = Math.random() * Math.PI * 2;
      const r = 42;
      particles.push({
        x: player.x + Math.cos(angle) * r,
        y: player.y + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 3,
        color: '#ffbe0b',
        life: 18,
        maxLife: 18
      });
    }
  }

  if (player.coffeeTimer > 0) {
    player.coffeeTimer--;
    // Steam bubbles from coffee rush
    if (frameCount % 4 === 0) {
      particles.push({
        x: player.x,
        y: player.y - player.height / 2 - 5,
        vx: (Math.random() - 0.5) * 1,
        vy: -2,
        size: 3,
        color: '#f8fafc',
        life: 16,
        maxLife: 16
      });
    }
  }

  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer--;
  }

  // 6. Spawn New Items & Hazards
  if (frameCount % CONFIG.ITEM_SPAWN_INTERVAL === 0) {
    spawnCollectible();
  }
  if (frameCount % CONFIG.HAZARD_SPAWN_INTERVAL === 0) {
    spawnHazard();
  }

  // 7. Update Collectibles & Check Pickups
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const item = collectibles[i];
    item.y += effectiveSpeed * 0.9;
    item.bobOffset += 0.08;

    // AABB Collision Check with Player
    const playerBox = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height
    };

    if (checkAABBCollision(playerBox, item, 4)) {
      // Picked up!
      handleItemPickup(item);
      collectibles.splice(i, 1);
      continue;
    }

    // Remove off-screen items
    if (item.y > canvas.height + 60) {
      collectibles.splice(i, 1);
    }
  }

  // 8. Update Hazards & Check Collisions
  for (let i = hazards.length - 1; i >= 0; i--) {
    const hazard = hazards[i];
    hazard.y += effectiveSpeed * 0.75; // Hazards move with road
    hazard.x += hazard.vx;
    hazard.animFrame = (hazard.animFrame + 0.15) % 4;

    // Bounce dog or professor within sidewalks
    if (hazard.x < ROAD.left + 20 || hazard.x > ROAD.right - 20) {
      hazard.vx *= -1;
    }

    const playerBox = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height
    };

    if (checkAABBCollision(playerBox, hazard, 5)) {
      if (player.shieldTimer > 0) {
        // Hall Ticket Shield destroys hazard for bonus!
        createSparks(hazard.x, hazard.y, 16, '#00f0ff');
        score += 40;
        sounds.playCollect();
        hazards.splice(i, 1);
        continue;
      } else if (player.invulnerableTimer <= 0) {
        // Player takes hit!
        handleHazardHit(hazard);
        if (hazard.type !== 'puddle') {
          hazards.splice(i, 1);
        }
        continue;
      }
    }

    if (hazard.y > canvas.height + 80) {
      hazards.splice(i, 1);
    }
  }

  // 9. Update Visual Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // 10. Screen Shake Countdown
  if (screenShakeTimer > 0) screenShakeTimer--;

  // 11. Check Victory / Defeat Conditions
  checkGameEndConditions();

  // 12. Update Heads-Up Display
  updateHUD();
}

// Handle item benefits
function handleItemPickup(item) {
  itemsCollectedCount++;
  createSparks(item.x, item.y, 12, '#ffbe0b');

  switch (item.type) {
    case 'id_card':
      score += CONFIG.SCORE_ID_CARD;
      sounds.playCollect();
      break;
    case 'assignment':
      score += CONFIG.SCORE_ASSIGNMENT;
      sounds.playCollect();
      break;
    case 'coffee':
      player.coffeeTimer = CONFIG.COFFEE_BOOST_FRAMES;
      score += 25;
      sounds.playCoffee();
      break;
    case 'hall_ticket':
      player.shieldTimer = CONFIG.SHIELD_DURATION_FRAMES;
      score += CONFIG.SCORE_HALL_TICKET;
      sounds.playShield();
      break;
  }
}

// Handle hazard penalties
function handleHazardHit(hazard) {
  screenShakeTimer = 16;
  player.invulnerableTimer = 60; // 1 second immunity flicker

  let penalty = CONFIG.ATTENDANCE_LOSS_PUDDLE;
  if (hazard.type === 'dog') {
    penalty = CONFIG.ATTENDANCE_LOSS_DOG;
    sounds.playDogBark();
    createSparks(player.x, player.y, 14, '#ff3366');
  } else if (hazard.type === 'professor') {
    penalty = CONFIG.ATTENDANCE_LOSS_PROF;
    sounds.playCrash();
    createSparks(player.x, player.y, 18, '#ff3366');
  } else {
    // Puddle skid
    sounds.playCrash();
    createSparks(player.x, player.y, 10, '#00f0ff');
  }

  player.attendance = Math.max(0, player.attendance - penalty);
}

// Check End Conditions
function checkGameEndConditions() {
  // Defeat 1: Attendance dropped below 60%
  if (player.attendance < CONFIG.MIN_ATTENDANCE_TO_PASS) {
    triggerGameOver('ATTENDANCE SHORTAGE!', 'Your attendance dropped below 75% eligibility criteria. You have been barred from writing the lab test!');
    return;
  }

  // Defeat 2: Clock exceeded 9:00:00 AM before reaching gate
  if (simulatedClockSec >= DEADLINE_SEC && distanceRemaining > 0) {
    triggerGameOver('DOORS LOCKED!', 'The lab examiner closed the laboratory door at 09:00:00 AM. You arrived too late!');
    return;
  }

  // Victory: Reached 0m remaining before 9:00 AM!
  if (distanceRemaining <= 0) {
    triggerVictory();
  }
}

function triggerGameOver(title, reason) {
  gameState = 'GAMEOVER';
  sounds.stopBGM();
  sounds.playGameOver();

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('campus_cycle_highscore', highScore.toString());
  }

  document.getElementById('gameOverTitle').textContent = title;
  document.getElementById('gameOverReason').textContent = reason;
  document.getElementById('finalScore').textContent = Math.floor(score);
  document.getElementById('finalDistance').textContent = `${Math.floor(CONFIG.TOTAL_DISTANCE_METERS - distanceRemaining)}m`;
  document.getElementById('finalItems').textContent = itemsCollectedCount;
  document.getElementById('highScoreText').textContent = highScore;
  document.getElementById('gameOverScreen').classList.add('active');
}

function triggerVictory() {
  gameState = 'VICTORY';
  sounds.stopBGM();
  sounds.playVictory();

  const totalTimeSeconds = Math.floor((simulatedClockSec - START_TIME_SEC));
  const mins = Math.floor(totalTimeSeconds / 60);
  const secs = totalTimeSeconds % 60;
  const timeFormatted = `0${mins}:${secs < 10 ? '0' : ''}${secs}`;

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('campus_cycle_highscore', highScore.toString());
  }

  document.getElementById('victoryScore').textContent = Math.floor(score);
  document.getElementById('victoryAttendance').textContent = `${Math.floor(player.attendance)}%`;
  document.getElementById('victoryTime').textContent = timeFormatted;
  document.getElementById('victoryScreen').classList.add('active');
}

// ==========================================================================
// 9. RENDERING SYSTEM (CANVAS GRAPHICS, SPRITES, RETRO SHADERS)
// ==========================================================================
function render() {
  ctx.save();

  // Screen shake on hazard crash
  if (screenShakeTimer > 0) {
    const shakeIntensity = (screenShakeTimer / 16) * 6;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(shakeX, shakeY);
  }

  // Clear Canvas
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Road & Grass Borders
  drawCampusEnvironment();

  // 2. Draw Road Hazards (Puddles first so they lie beneath bike)
  hazards.forEach(hazard => {
    if (hazard.type === 'puddle') drawPuddle(hazard);
  });

  // 3. Draw Collectibles
  collectibles.forEach(item => {
    drawCollectible(item);
  });

  // 4. Draw Other Hazards (Dogs, Professors)
  hazards.forEach(hazard => {
    if (hazard.type === 'dog') drawDog(hazard);
    else if (hazard.type === 'professor') drawProfessor(hazard);
  });

  // 5. Draw Cyclist (Player)
  drawPlayerCyclist();

  // 6. Draw Visual Particles
  drawParticles();

  // 7. Hall Ticket Shield Aura
  if (player.shieldTimer > 0) {
    drawShieldAura();
  }

  ctx.restore();
}

/* --- ENVIRONMENT GRAPHICS (ROAD, CURBS, GRASS, TREES) --- */
function drawCampusEnvironment() {
  // Left Grass lawn
  ctx.fillStyle = '#1c5e32';
  ctx.fillRect(0, 0, ROAD.left, canvas.height);

  // Right Grass lawn
  ctx.fillRect(ROAD.right, 0, canvas.width - ROAD.right, canvas.height);

  // Concrete Curbs / Walkway Edges
  ctx.fillStyle = '#64748b';
  ctx.fillRect(ROAD.left - 6, 0, 6, canvas.height);
  ctx.fillRect(ROAD.right, 0, 6, canvas.height);

  // Walkway Asphalt Surface
  ctx.fillStyle = '#2b3442';
  ctx.fillRect(ROAD.left, 0, ROAD.width, canvas.height);

  // Lane Dividers (Dashed Yellow/White lines)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 20]);
  ctx.lineDashOffset = -roadMarkingOffset;

  // Draw 2 lane divider lines
  [ROAD.left + ROAD.width / 3, ROAD.left + (ROAD.width / 3) * 2].forEach(laneX => {
    ctx.beginPath();
    ctx.moveTo(laneX, 0);
    ctx.lineTo(laneX, canvas.height);
    ctx.stroke();
  });
  ctx.setLineDash([]); // Reset dash

  // Draw Scenery (Trees, Streetlamps, Flowers)
  scenery.forEach(item => {
    if (item.type === 'tree') {
      // Tree Trunk
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(item.x - 4, item.y, 8, 14);
      // Foliage
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(item.x, item.y - 6, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(item.x - 3, item.y - 8, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'lamp') {
      // Campus Street Lamp
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(item.x - 2, item.y - 12, 4, 24);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(item.x, item.y - 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* --- PLAYER SPRITE DRAWING (BICYCLE + STUDENT CYCLIST) --- */
function drawPlayerCyclist() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.tiltAngle);

  // Invulnerability flicker
  if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Shadow on asphalt
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 14, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front & Back Bicycle Tires (Top-Down 2D projection)
  ctx.fillStyle = '#1e293b';
  // Rear Tire
  ctx.fillRect(-4, 12, 8, 20);
  // Front Tire
  ctx.fillRect(-4, -30, 8, 20);

  // Bicycle Metal Frame Tube
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, -16);
  ctx.stroke();

  // Handlebars
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.lineTo(16, -18);
  ctx.stroke();

  // Handle grips
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-17, -20, 4, 5);
  ctx.fillRect(13, -20, 4, 5);

  // Student Torso & College Backpack
  ctx.fillStyle = '#2563eb'; // Student blue t-shirt
  ctx.beginPath();
  ctx.ellipse(0, -2, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red College Backpack
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 16, 12, 4);
  ctx.fill();

  // Student Helmet / Head
  ctx.fillStyle = '#ffbe0b'; // Bright yellow safety helmet
  ctx.beginPath();
  ctx.arc(0, -10, 8, 0, Math.PI * 2);
  ctx.fill();

  // Pedaling Legs Animation
  const legOffset = Math.sin(player.pedalAngle) * 6;
  ctx.fillStyle = '#1e293b';
  // Left foot
  ctx.fillRect(-10, 4 + legOffset, 4, 6);
  // Right foot
  ctx.fillRect(6, 4 - legOffset, 4, 6);

  ctx.restore();
}

/* --- COLLECTIBLE SPRITES --- */
function drawCollectible(item) {
  ctx.save();
  const bobY = item.y + Math.sin(item.bobOffset) * 4;
  ctx.translate(item.x, bobY);

  if (item.type === 'id_card') {
    // 🪪 College ID Card
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.fillRect(-12, -15, 24, 30);
    ctx.strokeRect(-12, -15, 24, 30);
    // Photo box
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-9, -11, 9, 10);
    // Text lines
    ctx.fillStyle = '#64748b';
    ctx.fillRect(2, -9, 8, 2);
    ctx.fillRect(2, -5, 8, 2);
    ctx.fillRect(-9, 4, 18, 2);
    ctx.fillRect(-9, 9, 14, 2);
    // Blue lanyard clip
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-3, -18, 6, 4);
  } else if (item.type === 'coffee') {
    // ☕ Canteen Hot Coffee Cup
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 22, 3);
    ctx.fill();
    // White lid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-11, -14, 22, 5);
    // Coffee bean / cafe logo
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'assignment') {
    // 📑 Assignment Sheet
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-11, -14, 22, 28);
    ctx.strokeRect(-11, -14, 22, 28);
    // Red grade "A+" stamp
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('A+', 0, -4);
    // Assignment lines
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-8, 3, 16, 2);
    ctx.fillRect(-8, 7, 16, 2);
    ctx.fillRect(-8, 11, 10, 2);
  } else if (item.type === 'hall_ticket') {
    // 🎟️ Golden Hall Ticket (Glowing Power-Up)
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(-14, -10, 28, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -10, 28, 20);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('ENTRY', -11, 3);
  }

  ctx.restore();
}

/* --- HAZARD SPRITES --- */
function drawPuddle(hazard) {
  ctx.save();
  ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
  ctx.beginPath();
  ctx.ellipse(hazard.x, hazard.y, hazard.width / 2, hazard.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Water ripple highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(hazard.x - 3, hazard.y - 2, hazard.width / 3, hazard.height / 3, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawDog(hazard) {
  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  if (hazard.vx < 0) ctx.scale(-1, 1); // Flip facing direction

  // Dog Body (Brown stray dog)
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.roundRect(-14, -10, 28, 18, 6);
  ctx.fill();

  // Dog Head
  ctx.beginPath();
  ctx.arc(12, -8, 8, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(10, -13, 3, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Wagging tail animation
  const tailAngle = Math.sin(hazard.animFrame * Math.PI) * 0.4;
  ctx.save();
  ctx.translate(-14, -4);
  ctx.rotate(tailAngle);
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -6);
  ctx.stroke();
  ctx.restore();

  // Running Legs
  ctx.fillStyle = '#78350f';
  const legSwing = Math.sin(hazard.animFrame * Math.PI) * 5;
  ctx.fillRect(-8, 8, 4, 8 + legSwing);
  ctx.fillRect(6, 8, 4, 8 - legSwing);

  ctx.restore();
}

function drawProfessor(hazard) {
  ctx.save();
  ctx.translate(hazard.x, hazard.y);

  // Professor Coat (Formal Tweed Brown)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.roundRect(-12, -18, 24, 30, 4);
  ctx.fill();

  // Head with glasses
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -24, 7, 0, Math.PI * 2);
  ctx.fill();

  // Spectacles
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-5, -26, 4, 3);
  ctx.strokeRect(1, -26, 4, 3);

  // Red Attendance Clipboard
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(8, -12, 10, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, -10, 8, 10);

  // Walking feet
  ctx.fillStyle = '#0f172a';
  const step = Math.sin(hazard.animFrame * Math.PI) * 4;
  ctx.fillRect(-7, 12 + step, 5, 7);
  ctx.fillRect(2, 12 - step, 5, 7);

  ctx.restore();
}

/* --- PARTICLE RENDERING --- */
function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

/* --- HALL TICKET SHIELD AURA --- */
function drawShieldAura() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.stroke();

  // Rotating shield nodes
  const nodeAngle = frameCount * 0.08;
  for (let i = 0; i < 3; i++) {
    const a = nodeAngle + (i * Math.PI * 2) / 3;
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 44, Math.sin(a) * 44, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ==========================================================================
// 10. HEADS-UP DISPLAY (HUD) SYNCHRONIZATION
// ==========================================================================
function updateHUD() {
  // 1. Clock Display (HH:MM:SS)
  const currentSec = Math.min(DEADLINE_SEC, Math.floor(simulatedClockSec));
  const hrs = Math.floor(currentSec / 3600);
  const mins = Math.floor((currentSec % 3600) / 60);
  const secs = currentSec % 60;
  const clockStr = `0${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  document.getElementById('hudClock').textContent = clockStr;

  // 2. Attendance Bar & Text
  const bar = document.getElementById('attendanceBar');
  const txt = document.getElementById('attendanceText');
  const att = Math.max(0, Math.floor(player.attendance));
  bar.style.width = `${att}%`;
  txt.textContent = `${att}%`;

  if (att < 75) {
    txt.style.color = 'var(--accent-red)';
  } else if (att < 85) {
    txt.style.color = 'var(--accent-gold)';
  } else {
    txt.style.color = 'var(--accent-green)';
  }

  // 3. Distance Remaining
  document.getElementById('hudDistance').textContent = `${Math.max(0, Math.ceil(distanceRemaining))}m`;

  // 4. Score
  document.getElementById('hudScore').textContent = Math.floor(score);

  // 5. Shield Badge Visibility
  const shieldBadge = document.getElementById('shieldBadge');
  if (player.shieldTimer > 0) {
    shieldBadge.style.display = 'block';
  } else {
    shieldBadge.style.display = 'none';
  }
}

function hideAllOverlays() {
  document.querySelectorAll('.overlay-screen').forEach(el => el.classList.remove('active'));
}

// ==========================================================================
// 11. BUTTON EVENT LISTENERS
// ==========================================================================
document.getElementById('btnStart').addEventListener('click', resetGame);
document.getElementById('btnResume').addEventListener('click', togglePause);
document.getElementById('btnRestartFromPause').addEventListener('click', resetGame);
document.getElementById('btnRestart').addEventListener('click', resetGame);
document.getElementById('btnVictoryRestart').addEventListener('click', resetGame);

// Sound & Music Toggles
const btnAudio = document.getElementById('btnAudioToggle');
btnAudio.addEventListener('click', () => {
  sounds.soundEnabled = !sounds.soundEnabled;
  btnAudio.textContent = sounds.soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
  btnAudio.style.color = sounds.soundEnabled ? 'var(--text-main)' : 'var(--text-muted)';
});

const btnMusic = document.getElementById('btnMusicToggle');
btnMusic.addEventListener('click', () => {
  sounds.musicEnabled = !sounds.musicEnabled;
  btnMusic.textContent = sounds.musicEnabled ? '🎵 BGM CHIPTUNE: ON' : '🎵 BGM CHIPTUNE: OFF';
  btnMusic.style.color = sounds.musicEnabled ? 'var(--text-main)' : 'var(--text-muted)';
  if (sounds.musicEnabled && gameState === 'PLAYING') {
    sounds.startBGM();
  } else {
    sounds.stopBGM();
  }
});

// ==========================================================================
// 12. MAIN 60 FPS ANIMATION LOOP
// ==========================================================================
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Initial scenery setup & start loop
initScenery();
requestAnimationFrame(gameLoop);
