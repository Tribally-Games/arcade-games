import { millisecondsToTicks as T, Vector2D as h, serializer as L, GameObject as B, FRAMES_PER_SECOND as q, GameObjectEventType as A, GameEngine as te, CollisionGrid as K, GameObjectGroup as M, GameState as G, UserInputEventSource as se, AbstractRenderer as H, PIXI as I, GameCanvas as ie } from "@hiddentao/clockwork-engine";
var R = /* @__PURE__ */ ((p) => (p.EMPTY = "empty", p.SNAKE_HEAD = "snake_head", p.SNAKE_BODY = "snake_body", p.SNAKE_TAIL = "snake_tail", p.OBSTACLE = "obstacle", p.PREVIEW_OBSTACLE = "preview_obstacle", p.CONSUMABLE = "consumable", p.POWER_UP = "power_up", p.JACKPOT_DIAMOND = "jackpot_diamond", p))(R || {}), m = /* @__PURE__ */ ((p) => (p.UP = "up", p.DOWN = "down", p.LEFT = "left", p.RIGHT = "right", p))(m || {}), y = /* @__PURE__ */ ((p) => (p.INVINCIBLE = "invincible", p.INVERTED_CONTROLS = "inverted_controls", p.SLOW_DOWN = "slow_down", p.DARKNESS = "darkness", p))(y || {});
const o = {
  ARENA_SIZE: 50,
  BLOCK_SIZE: 12,
  INITIAL_SNAKE_LENGTH: 2,
  MAX_SNAKE_LENGTH: 2400,
  MAX_OBSTACLES: 100,
  APPLES_TO_LEVEL_UP: 8,
  INITIAL_MOVE_INTERVAL: T(100),
  // milliseconds (0.1 seconds)
  SPEED_INCREASE_AMOUNT: T(10),
  // Snake speeds up by 10ms every 10 seconds
  SPEED_INCREASE_INTERVAL: T(1e4),
  // milliseconds (10 seconds)
  MIN_MOVE_INTERVAL: T(50),
  // Minimum interval (fastest speed)
  OBSTACLE_SPAWN_INTERVAL: T(500),
  // milliseconds (0.5 seconds)
  CONSUMABLE_SPAWN_INTERVAL: T(100),
  // milliseconds (0.1 seconds)
  POWER_UP_SPAWN_INTERVAL: T(1e3),
  // milliseconds (1 second)
  POWER_UP_SPAWN_CHANCE: 0.1,
  // 10% chance per second
  POWER_UP_DURATION: T(2e4),
  // milliseconds (20 seconds)
  POWER_UP_EFFECT_DURATION: T(6e3),
  // milliseconds (6 seconds)
  SLOW_DOWN_EFFECT_DURATION: T(1e4)
  // milliseconds (10 seconds) - longer duration for slow down
}, D = new h(25, 42), ne = m.RIGHT, z = [
  {
    level: 1,
    obstacles: [],
    // No obstacles in level 1
    maxSnakeLength: o.MAX_SNAKE_LENGTH
  },
  {
    level: 2,
    obstacles: oe(),
    maxSnakeLength: o.MAX_SNAKE_LENGTH - o.MAX_OBSTACLES
  }
];
function oe() {
  const p = [];
  for (let e = 10; e < 40; e++)
    e !== 25 && (p.push(new h(e, 5)), p.push(new h(e, 45)));
  for (let e = 15; e < 35; e++)
    e !== 25 && (p.push(new h(5, e)), p.push(new h(45, e)));
  return p.slice(0, o.MAX_OBSTACLES);
}
const v = {
  BACKGROUND: 0,
  SNAKE_HEAD: 16744448,
  // Orange color for snake head
  SNAKE_BODY: 16737792,
  // Darker orange for snake body
  SNAKE_TAIL: 16729088,
  // Even darker orange for snake tail
  CONSUMABLE: 16711680,
  OBSTACLE: 65280,
  // Green color for obstacles (matches grid outline)
  GRID: 65280,
  POWER_UP: 16766720,
  // Golden color for power-ups
  SNAKE_INVINCIBLE: 16766720,
  // Golden color for invincible snake
  SNAKE_INVERTED: 8388736,
  // Purple color for inverted controls snake
  SNAKE_SLOW: 65535
  // Cyan color for slow down snake
};
class C extends B {
  static TypeName = "Obstacle";
  static idCounter = 0;
  isPreview;
  spawnTick;
  points;
  isFlashing;
  lastToggleTick;
  constructor(e, t = !1, s, i, n) {
    const r = n || `obstacle_${++C.idCounter}`;
    super(r, e, new h(1, 1), 1), this.isPreview = t, this.spawnTick = s || 0, this.points = i || [{ point: new h(e.x, e.y) }], this.isFlashing = !1, this.lastToggleTick = s || 0;
  }
  getType() {
    return C.TypeName;
  }
  isPreviewObstacle() {
    return this.isPreview;
  }
  setPreview(e) {
    this.isPreview = e, this.needsRepaint = !0;
  }
  getSpawnTick() {
    return this.spawnTick;
  }
  hasSpawnTick() {
    return this.spawnTick !== void 0;
  }
  isFlashingActive() {
    return this.isFlashing;
  }
  getPoints() {
    return this.points.map((e) => ({
      ...e,
      point: new h(e.point.x, e.point.y)
    }));
  }
  getAllPointPositions() {
    return this.points.map((e) => new h(e.point.x, e.point.y));
  }
  setPoints(e) {
    this.points = e, this.emit("pointsReplaced", this, this.points), this.needsRepaint = !0;
  }
  addPoint(e) {
    this.points.push(e), this.emit("pointAdded", this, e), this.needsRepaint = !0;
  }
  removePoint(e) {
    if (e >= 0 && e < this.points.length) {
      const t = this.points[e];
      this.points.splice(e, 1), this.emit("pointRemoved", this, t), this.needsRepaint = !0;
    }
  }
  containsPoint(e) {
    return this.points.some(
      (t) => t.point.x === e.x && t.point.y === e.y
    );
  }
  getPointCount() {
    return this.points.length;
  }
  update(e, t) {
    super.update(e, t), !(this.destroyed || !this.isPreview) && t - this.lastToggleTick >= q / 5 && (this.isFlashing = !this.isFlashing, this.lastToggleTick = t, this.needsRepaint = !0);
  }
  activateFromPreview() {
    this.isPreview = !1, this.spawnTick = void 0, this.isFlashing = !1, this.needsRepaint = !0;
  }
  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y },
      size: { x: this.size.x, y: this.size.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      rotation: this.rotation,
      health: this.health,
      maxHealth: this.maxHealth,
      isDestroyed: this.destroyed,
      isPreview: this.isPreview,
      spawnTick: this.spawnTick,
      points: this.points.map((e) => ({
        x: e.point.x,
        y: e.point.y
      })),
      isFlashing: this.isFlashing,
      lastToggleTick: this.lastToggleTick
    };
  }
  static deserialize(e) {
    const t = e.points ? e.points.map((i) => ({
      point: new h(i.x, i.y)
    })) : void 0, s = new C(
      new h(e.position.x, e.position.y),
      e.isPreview,
      e.spawnTick,
      t,
      void 0
      // Let it auto-generate an ID
    );
    return s.setVelocity(new h(e.velocity.x, e.velocity.y)), s.setRotation(e.rotation), s.health = e.health, s.maxHealth = e.maxHealth, s.destroyed = e.isDestroyed, s.isFlashing = e.isFlashing || !1, s.lastToggleTick = e.lastToggleTick || 0, s;
  }
}
L.registerType(C.TypeName, C);
class _ {
  gameEngine;
  prng;
  _isStatic = !1;
  usesPreviewObstacles = !0;
  obstacleGroup;
  previewObstacleGroup;
  loadedPromise;
  loadedResolver;
  constructor(e) {
    this.gameEngine = e, this.prng = e.getPrng(), this.reset();
  }
  isStatic() {
    return this._isStatic;
  }
  spawnObstacles(e) {
    const t = [];
    if (!this.obstacleGroup)
      return console.error(`${this.name}: obstacleGroup not set`), { collidesWith: t };
    if (this.usesPreviewObstacles && !this.previewObstacleGroup)
      return console.error(`${this.name}: previewObstacleGroup not set`), { collidesWith: t };
    const s = this.usesPreviewObstacles ? this.activatePreviewObstacles(e) : !1, i = this.spawnNewObstacles(
      e,
      s
    );
    return t.push(...i), { collidesWith: t };
  }
  /**
   * Activates preview obstacles if they don't collide with the snake.
   * Returns true if any preview obstacles were activated.
   */
  activatePreviewObstacles(e) {
    if (!this.previewObstacleGroup)
      return !1;
    const t = this.previewObstacleGroup.getAllActive();
    let s = !1;
    return t.length > 0 && t.forEach((i) => {
      i.getPoints().every((r) => e.snakeGrid.containsPoint(r.point).length === 0) && (i.activateFromPreview(), this.obstacleGroup.add(i), this.previewObstacleGroup.remove(i), i.getPoints().forEach((r) => {
        e.collisionGrid.add(r.point, i);
      }), i.on(A.DESTROYED, () => {
        e.collisionGrid.removeSource(i);
      }), s = !0);
    }), s;
  }
  /**
   * Reset the strategy to its initial state.
   * Override this in derived classes that maintain state between spawns.
   */
  reset() {
    this.loadedPromise = new Promise((e) => {
      this.loadedResolver = e;
    });
  }
  async setOnStrategyLoaded(e, t) {
    this.obstacleGroup = e, this.previewObstacleGroup = t, this.obstacleGroup.clearAndDestroy(), this.usesPreviewObstacles && this.previewObstacleGroup.clearAndDestroy(), await this.loadedPromise;
  }
  notifyStrategyLoaded() {
    this.loadedResolver && (this.loadedResolver(), this.loadedResolver = void 0);
  }
  finalizePreviewObstacle(e, t, s) {
    t.length > 0 && (e.setPoints(t), this.previewObstacleGroup.add(e), e.on(A.DESTROYED, () => {
      s.spawnGrid.removeSource(e);
    }));
  }
}
class Z extends _ {
  usesPreviewObstacles = !1;
  currentObstacle = null;
  currentPosition = new h(0, 0);
  reset() {
    super.reset(), this.currentObstacle = null, this.currentPosition = new h(0, 0), this.notifyStrategyLoaded();
  }
  spawnNewObstacles(e, t) {
    const s = [];
    if (this.currentObstacle === null) {
      const i = this.findSafeInitialPosition(e.snakeGrid);
      this.currentPosition = i, this.currentObstacle = new C(
        this.currentPosition,
        !1,
        this.gameEngine.getTotalTicks(),
        []
      );
      const n = this.generateObstaclePoints();
      this.currentObstacle.setPoints(n), this.obstacleGroup.add(this.currentObstacle);
      const r = this.addToGrids(
        e,
        this.currentObstacle,
        this.currentPosition
      );
      s.push(...r), this.setupObstacleCleanup(e, this.currentObstacle);
    } else {
      const i = this.calculateNextPosition();
      if (this.wouldCollideWithSnake(i, e.snakeGrid))
        return s;
      this.currentPosition = i, this.removeFromGrids(e, this.currentObstacle), this.currentObstacle.setPosition(this.currentPosition);
      const n = this.addToGrids(
        e,
        this.currentObstacle,
        this.currentPosition
      );
      s.push(...n);
    }
    return s;
  }
  wouldCollideWithSnake(e, t) {
    return this.generateObstaclePoints().some((i) => {
      const n = new h(
        e.x + i.point.x,
        e.y + i.point.y
      );
      return t.containsPoint(n).length > 0;
    });
  }
  addToGrids(e, t, s) {
    const i = [];
    return t.getPoints().forEach((n) => {
      const r = new h(
        s.x + n.point.x,
        s.y + n.point.y
      ), a = e.collisionGrid.containsPoint(r);
      i.push(...a), e.collisionGrid.add(r, t), e.spawnGrid.add(r, t);
    }), i;
  }
  removeFromGrids(e, t) {
    e.collisionGrid.removeSource(t), e.spawnGrid.removeSource(t);
  }
  setupObstacleCleanup(e, t) {
    t.on(A.DESTROYED, () => {
      e.collisionGrid.removeSource(t), e.spawnGrid.removeSource(t), this.currentObstacle = null;
    });
  }
}
class re extends _ {
  name = "Boundary Wall";
  levelName = "Implosion";
  currentBounds = null;
  lastDirection = null;
  reset() {
    super.reset(), this.currentBounds = null, this.lastDirection = null, this.notifyStrategyLoaded();
  }
  spawnNewObstacles(e, t) {
    const s = [];
    if (this.previewObstacleGroup.getAllActive().length === 0 || t) {
      this.currentBounds === null && (this.currentBounds = {
        minX: 0,
        maxX: o.ARENA_SIZE - 1,
        minY: 0,
        maxY: o.ARENA_SIZE - 1
      });
      const n = this.currentBounds.maxX - this.currentBounds.minX + 1, r = this.currentBounds.maxY - this.currentBounds.minY + 1;
      if (n <= 10 || r <= 10)
        return s;
      let l = [...["NORTH", "SOUTH", "EAST", "WEST"]];
      this.lastDirection && l.length > 1 && (l = l.filter(
        (u) => u !== this.lastDirection
      ));
      const d = this.prng.randomChoice(l);
      let g = !1;
      switch (d) {
        case "NORTH": {
          const u = this.currentBounds.minY + 2;
          for (let c = this.currentBounds.minX; c <= this.currentBounds.maxX; c++)
            if (e.snakeGrid.containsPoint(new h(c, u)).length > 0) {
              g = !0;
              break;
            }
          break;
        }
        case "SOUTH": {
          const u = this.currentBounds.maxY - 2;
          for (let c = this.currentBounds.minX; c <= this.currentBounds.maxX; c++)
            if (e.snakeGrid.containsPoint(new h(c, u)).length > 0) {
              g = !0;
              break;
            }
          break;
        }
        case "EAST": {
          const u = this.currentBounds.maxX - 2;
          for (let c = this.currentBounds.minY; c <= this.currentBounds.maxY; c++)
            if (e.snakeGrid.containsPoint(new h(u, c)).length > 0) {
              g = !0;
              break;
            }
          break;
        }
        case "WEST": {
          const u = this.currentBounds.minX + 2;
          for (let c = this.currentBounds.minY; c <= this.currentBounds.maxY; c++)
            if (e.snakeGrid.containsPoint(new h(u, c)).length > 0) {
              g = !0;
              break;
            }
          break;
        }
      }
      if (g)
        return s;
      const f = new C(
        new h(0, 0),
        !0,
        this.gameEngine.getTotalTicks(),
        []
      ), S = [];
      switch (d) {
        case "NORTH":
          for (let u = this.currentBounds.minX; u <= this.currentBounds.maxX; u++) {
            const c = new h(u, this.currentBounds.minY);
            if (e.snakeGrid.containsPoint(c).length === 0) {
              const w = e.collisionGrid.containsPoint(c);
              s.push(...w), S.push({ point: c }), e.spawnGrid.add(c, f);
            }
          }
          break;
        case "SOUTH":
          for (let u = this.currentBounds.minX; u <= this.currentBounds.maxX; u++) {
            const c = new h(u, this.currentBounds.maxY);
            if (e.snakeGrid.containsPoint(c).length === 0) {
              const w = e.collisionGrid.containsPoint(c);
              s.push(...w), S.push({ point: c }), e.spawnGrid.add(c, f);
            }
          }
          break;
        case "EAST":
          for (let u = this.currentBounds.minY; u <= this.currentBounds.maxY; u++) {
            const c = new h(this.currentBounds.maxX, u);
            if (e.snakeGrid.containsPoint(c).length === 0) {
              const w = e.collisionGrid.containsPoint(c);
              s.push(...w), S.push({ point: c }), e.spawnGrid.add(c, f);
            }
          }
          break;
        case "WEST":
          for (let u = this.currentBounds.minY; u <= this.currentBounds.maxY; u++) {
            const c = new h(this.currentBounds.minX, u);
            if (e.snakeGrid.containsPoint(c).length === 0) {
              const w = e.collisionGrid.containsPoint(c);
              s.push(...w), S.push({ point: c }), e.spawnGrid.add(c, f);
            }
          }
          break;
      }
      if (this.finalizePreviewObstacle(f, S, e), S.length > 0) {
        switch (d) {
          case "NORTH":
            this.currentBounds.minY++;
            break;
          case "SOUTH":
            this.currentBounds.maxY--;
            break;
          case "EAST":
            this.currentBounds.maxX--;
            break;
          case "WEST":
            this.currentBounds.minX++;
            break;
        }
        this.lastDirection = d;
      }
    }
    return s;
  }
}
class ae extends _ {
  name = "Four Block";
  levelName = "Confetti";
  reset() {
    super.reset(), this.notifyStrategyLoaded();
  }
  spawnNewObstacles(e, t) {
    const s = [];
    if (this.previewObstacleGroup.getAllActive().length === 0 || t) {
      const n = new C(
        new h(0, 0),
        !0,
        this.gameEngine.getTotalTicks(),
        []
      ), r = [], a = 10;
      let l = 0;
      for (; l < a; ) {
        const g = this.prng.randomBoolean(0.5) ? this.tryPlaceHorizontalLine(e) : this.tryPlaceVerticalLine(e);
        if (g.success) {
          for (const f of g.points) {
            const S = e.collisionGrid.containsPoint(f);
            s.push(...S), r.push({ point: f }), e.spawnGrid.add(f, n);
          }
          break;
        }
        l++;
      }
      this.finalizePreviewObstacle(n, r, e);
    }
    return s;
  }
  tryPlaceHorizontalLine(e) {
    const t = this.prng.randomInt(0, o.ARENA_SIZE - 4), s = this.prng.randomInt(0, o.ARENA_SIZE - 1);
    return this.validateAndGeneratePoints(
      e,
      (i) => new h(t + i, s)
    );
  }
  tryPlaceVerticalLine(e) {
    const t = this.prng.randomInt(0, o.ARENA_SIZE - 1), s = this.prng.randomInt(0, o.ARENA_SIZE - 4);
    return this.validateAndGeneratePoints(
      e,
      (i) => new h(t, s + i)
    );
  }
  validateAndGeneratePoints(e, t) {
    const s = [];
    for (let i = 0; i < 4; i++) {
      const n = t(i);
      if (s.push(n), e.snakeGrid.containsPoint(n).length > 0)
        return { success: !1, points: [] };
    }
    return { success: !0, points: s };
  }
}
class ce extends _ {
  name = "Growing Square";
  levelName = "Contagion";
  growthDirection = "horizontal";
  growthCount = 0;
  currentBounds = null;
  // Reset the strategy state when game resets
  reset() {
    super.reset(), this.growthDirection = "horizontal", this.growthCount = 0, this.currentBounds = null, this.notifyStrategyLoaded();
  }
  spawnNewObstacles(e, t) {
    const s = [];
    if (this.previewObstacleGroup.getAllActive().length === 0 || t) {
      const n = new C(
        new h(0, 0),
        !0,
        this.gameEngine.getTotalTicks(),
        []
      ), r = [];
      if (this.currentBounds === null) {
        const a = Math.floor(o.ARENA_SIZE / 2), l = Math.floor(o.ARENA_SIZE / 2), d = new h(a, l);
        if (e.snakeGrid.containsPoint(d).length === 0) {
          const f = e.collisionGrid.containsPoint(d);
          s.push(...f);
          const S = {
            point: d
          };
          r.push(S), e.spawnGrid.add(d, n), this.currentBounds = {
            minX: a,
            maxX: a,
            minY: l,
            maxY: l
          }, this.growthCount = 0, this.growthDirection = "horizontal";
        }
      } else {
        const { minX: a, maxX: l, minY: d, maxY: g } = this.currentBounds, f = [];
        this.growthDirection === "horizontal" ? f.push("left", "right") : f.push("top", "bottom");
        for (const S of f)
          switch (S) {
            case "top":
              for (let u = a; u <= l; u++) {
                const c = d - 1, w = new h(u, c);
                if (c >= 0 && c < o.ARENA_SIZE && e.snakeGrid.containsPoint(w).length === 0) {
                  const O = e.collisionGrid.containsPoint(w);
                  s.push(...O);
                  const k = {
                    point: w
                  };
                  r.push(k), e.spawnGrid.add(w, n), this.currentBounds.minY = Math.min(
                    this.currentBounds.minY,
                    c
                  );
                }
              }
              break;
            case "bottom":
              for (let u = a; u <= l; u++) {
                const c = g + 1, w = new h(u, c);
                if (c >= 0 && c < o.ARENA_SIZE && e.snakeGrid.containsPoint(w).length === 0) {
                  const O = e.collisionGrid.containsPoint(w);
                  s.push(...O);
                  const k = {
                    point: w
                  };
                  r.push(k), e.spawnGrid.add(w, n), this.currentBounds.maxY = Math.max(
                    this.currentBounds.maxY,
                    c
                  );
                }
              }
              break;
            case "left":
              for (let u = d; u <= g; u++) {
                const c = a - 1, w = new h(c, u);
                if (c >= 0 && c < o.ARENA_SIZE && e.snakeGrid.containsPoint(w).length === 0) {
                  const O = e.collisionGrid.containsPoint(w);
                  s.push(...O);
                  const k = {
                    point: w
                  };
                  r.push(k), e.spawnGrid.add(w, n), this.currentBounds.minX = Math.min(
                    this.currentBounds.minX,
                    c
                  );
                }
              }
              break;
            case "right":
              for (let u = d; u <= g; u++) {
                const c = l + 1, w = new h(c, u);
                if (c >= 0 && c < o.ARENA_SIZE && e.snakeGrid.containsPoint(w).length === 0) {
                  const O = e.collisionGrid.containsPoint(w);
                  s.push(...O);
                  const k = {
                    point: w
                  };
                  r.push(k), e.spawnGrid.add(w, n), this.currentBounds.maxX = Math.max(
                    this.currentBounds.maxX,
                    c
                  );
                }
              }
              break;
          }
        this.growthCount++, this.growthCount >= 2 && (this.growthDirection = this.growthDirection === "horizontal" ? "vertical" : "horizontal", this.growthCount = 0);
      }
      this.finalizePreviewObstacle(n, r, e);
    }
    return s;
  }
}
class le extends Z {
  name = "Vertical Moving Wall";
  levelName = "Paint the Fence";
  generateObstaclePoints() {
    const e = [];
    for (let t = 0; t < 4; t++)
      for (let s = 0; s < o.ARENA_SIZE; s++)
        e.push({ point: new h(t, s) });
    return e;
  }
  findSafeInitialPosition(e) {
    let t = 0, s = -1;
    for (; t < 10 && s === -1; ) {
      const i = this.prng.randomInt(0, o.ARENA_SIZE - 4), n = new h(i, 0);
      this.wouldCollideWithSnake(n, e) || (s = i), t++;
    }
    return s === -1 && (s = this.prng.randomInt(0, o.ARENA_SIZE - 4)), new h(s, 0);
  }
  calculateNextPosition() {
    let e = this.currentPosition.x - 4;
    return e < 0 && (e = o.ARENA_SIZE - 4), new h(e, 0);
  }
  getThickness() {
    return 4;
  }
}
class he extends Z {
  name = "Horizontal Moving Wall";
  levelName = "Wax On";
  generateObstaclePoints() {
    const e = [];
    for (let t = 0; t < 4; t++)
      for (let s = 0; s < o.ARENA_SIZE; s++)
        e.push({ point: new h(s, t) });
    return e;
  }
  findSafeInitialPosition(e) {
    let t = 0, s = -1;
    for (; t < 10 && s === -1; ) {
      const i = this.prng.randomInt(0, o.ARENA_SIZE - 4), n = new h(0, i);
      this.wouldCollideWithSnake(n, e) || (s = i), t++;
    }
    return s === -1 && (s = this.prng.randomInt(0, o.ARENA_SIZE - 4)), new h(0, s);
  }
  calculateNextPosition() {
    let e = this.currentPosition.y - 4;
    return e < 0 && (e = o.ARENA_SIZE - 4), new h(0, e);
  }
  getThickness() {
    return 4;
  }
}
class de extends Z {
  name = "Moving Cross";
  levelName = "Gauntlet";
  generateObstaclePoints() {
    const e = [], s = o.ARENA_SIZE * 2;
    for (let i = -4; i < 4; i++)
      for (let n = -s / 2; n < s / 2; n++)
        e.push({ point: new h(n, i) });
    for (let i = -4; i < 4; i++)
      for (let n = -s / 2; n < s / 2; n++)
        n >= -4 && n < 4 || e.push({ point: new h(i, n) });
    return e;
  }
  findSafeInitialPosition(e) {
    const t = new h(
      Math.floor(o.ARENA_SIZE / 2),
      Math.floor(o.ARENA_SIZE / 2)
    );
    if (!this.wouldCollideWithSnake(t, e))
      return t;
    for (let s = 1; s <= 3; s++) {
      const i = [
        new h(t.x + s, t.y),
        new h(t.x - s, t.y),
        new h(t.x, t.y + s),
        new h(t.x, t.y - s)
      ];
      for (const n of i)
        if (n.x >= 4 && n.x < o.ARENA_SIZE - 4 && n.y >= 4 && n.y < o.ARENA_SIZE - 4 && !this.wouldCollideWithSnake(n, e))
          return n;
    }
    return t;
  }
  calculateNextPosition() {
    let e = (this.currentPosition.x + 6) % o.ARENA_SIZE, t = (this.currentPosition.y + 6) % o.ARENA_SIZE;
    return new h(e, t);
  }
  getThickness() {
    return 8;
  }
}
class ue extends _ {
  name = "Blank Map";
  levelName = "???";
  constructor(e) {
    super(e), this.notifyStrategyLoaded();
  }
  spawnNewObstacles(e, t) {
    return [];
  }
}
class X extends _ {
  name = "Static Map";
  levelName;
  _isStatic = !0;
  mapData = null;
  level;
  mapName = null;
  cachedObstacles = [];
  // Pre-calculated obstacle positions
  constructor(e, t, s = "Static Level") {
    super(e), this.level = t, this.levelName = s, this.mapData = null, this.mapName = null, this.cachedObstacles = [];
  }
  async loadMapWithRetry(e = 10, t = 100) {
    for (let s = 1; s <= e; s++)
      try {
        if (!this.mapName) {
          const n = await this.gameEngine.getLoader().fetchData("", { type: "mapNames" }), r = JSON.parse(n).sort();
          this.mapName = this.prng.randomChoice(r);
        }
        if (!this.mapName)
          throw new Error("Failed to select a map name");
        const i = await this.gameEngine.getLoader().fetchData(this.mapName, { type: "map" });
        this.mapData = JSON.parse(i), this.precalculateObstacles(), this.notifyStrategyLoaded();
        return;
      } catch (i) {
        if (console.error(
          `Static Map: Error loading map for level ${this.level} (attempt ${s}/${e}):`,
          i
        ), s < e)
          await new Promise((n) => setTimeout(n, t));
        else
          throw console.error(
            `Static Map: Failed to load map after ${e} attempts`
          ), i;
      }
  }
  precalculateObstacles() {
    if (!this.mapData) return;
    this.cachedObstacles = [];
    const e = 50;
    for (let t = 0; t < e; t++) {
      const s = this.mapData[t];
      if (s)
        for (let i = 0; i < e; i++)
          s[i] >= 1 && this.cachedObstacles.push({
            point: new h(i, t)
          });
    }
  }
  reset() {
    super.reset(), this.loadMapWithRetry().catch((e) => {
      console.error("Static Map: Failed to load map in reset:", e);
    }), this.cachedObstacles = [];
  }
  spawnNewObstacles(e, t) {
    const s = [];
    if (this.obstacleGroup.activeSize() > 0)
      return s;
    if (!this.mapData || this.cachedObstacles.length === 0)
      return this.loadMapWithRetry().catch((i) => {
        console.error(
          "Static Map: Failed to load map in spawnNewObstacles:",
          i
        );
      }), s;
    if (this.cachedObstacles.length > 0) {
      const i = new C(
        new h(0, 0),
        !1,
        // Not a preview obstacle
        this.gameEngine.getTotalTicks(),
        [...this.cachedObstacles]
        // Copy the cached obstacles
      );
      this.obstacleGroup.add(i), i.getPoints().forEach((n) => {
        const r = e.collisionGrid.containsPoint(
          n.point
        );
        s.push(...r), e.collisionGrid.add(n.point, i), e.spawnGrid.add(n.point, i);
      }), i.on(A.DESTROYED, () => {
        e.collisionGrid.removeSource(i), e.spawnGrid.removeSource(i);
      });
    }
    return s;
  }
}
class pe {
  gameEngine;
  prng;
  strategyCache = /* @__PURE__ */ new Map();
  lastUsedStrategyIndex = null;
  usedStrategiesForLevels2Plus = /* @__PURE__ */ new Set();
  constructor(e) {
    this.gameEngine = e, this.prng = e.getPrng(), this.strategyCache = /* @__PURE__ */ new Map(), this.getCachedStrategy(
      "growing-square",
      () => new ce(e)
    ), this.getCachedStrategy(
      "boundary-wall",
      () => new re(e)
    ), this.getCachedStrategy(
      "four-block",
      () => new ae(e)
    ), this.getCachedStrategy(
      "moving-cross",
      () => new de(e)
    ), this.getCachedStrategy(
      "horizontal-moving-wall",
      () => new he(e)
    ), this.getCachedStrategy(
      "vertical-moving-wall",
      () => new le(e)
    );
  }
  /**
   * Gets a cached strategy instance or creates a new one if it doesn't exist
   */
  getCachedStrategy(e, t) {
    return this.strategyCache.has(e) || this.strategyCache.set(e, t()), this.strategyCache.get(e);
  }
  /**
   * Gets the appropriate obstacle strategy for a given level
   */
  getStrategyForLevel(e) {
    if (e === 1)
      return new X(this.gameEngine, e, "Level 1");
    const t = [
      { key: "growing-square", name: "Contagion" },
      { key: "boundary-wall", name: "Implosion" },
      { key: "four-block", name: "Confetti" },
      { key: "moving-cross", name: "Gauntlet" },
      { key: "horizontal-moving-wall", name: "Wax On" },
      { key: "vertical-moving-wall", name: "Paint the Fence" }
    ];
    this.usedStrategiesForLevels2Plus.size >= t.length && this.usedStrategiesForLevels2Plus.clear();
    const s = t.filter(
      (n) => !this.usedStrategiesForLevels2Plus.has(n.key)
    ), i = this.prng.randomChoice(s);
    return this.usedStrategiesForLevels2Plus.add(i.key), this.getCachedStrategy(i.key);
  }
  /**
   * Clears the strategy cache. Useful for testing or if strategies need to be recreated.
   */
  clearCache() {
    this.strategyCache.clear(), this.usedStrategiesForLevels2Plus.clear();
  }
  /**
   * Gets a random strategy from the available strategies
   */
  getRandomStrategy() {
    const e = Array.from(this.strategyCache.values()), t = this.prng.randomInt(0, e.length - 1);
    if (e.length > 1 && this.lastUsedStrategyIndex !== null && t === this.lastUsedStrategyIndex) {
      const s = (t + 1) % e.length;
      return this.lastUsedStrategyIndex = s, e[s];
    }
    return this.lastUsedStrategyIndex = t, e[t];
  }
  /**
   * Gets a strategy by its key
   */
  getStrategyByKey(e) {
    if (this.strategyCache.has(e))
      return this.strategyCache.get(e) || null;
    if (e.includes("_")) {
      const t = new X(this.gameEngine, 1, e);
      return this.strategyCache.set(e, t), t;
    }
    return null;
  }
}
const $ = T(1e4), ge = T(2e3);
class b extends B {
  static TypeName = "Consumable";
  static idCounter = 0;
  spawnTick;
  hidden;
  lastToggleTick;
  constructor(e, t, s) {
    const i = s || `consumable_${++b.idCounter}`;
    super(i, e, new h(1, 1), 1), this.spawnTick = t, this.hidden = !1, this.lastToggleTick = t;
  }
  getType() {
    return b.TypeName;
  }
  isHidden() {
    return this.hidden;
  }
  setHidden(e) {
    this.hidden !== e && (this.hidden = e, this.needsRepaint = !0);
  }
  update(e, t) {
    if (super.update(e, t), this.destroyed)
      return;
    const s = t - this.spawnTick;
    s >= $ - ge && t - this.lastToggleTick >= q / 5 && (this.hidden = !this.hidden, this.lastToggleTick = t, this.needsRepaint = !0), s >= $ && this.destroy();
  }
  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y },
      size: { x: this.size.x, y: this.size.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      rotation: this.rotation,
      health: this.health,
      maxHealth: this.maxHealth,
      isDestroyed: this.destroyed,
      spawnTick: this.spawnTick,
      hidden: this.hidden,
      lastToggleTick: this.lastToggleTick
    };
  }
  static deserialize(e) {
    const t = new b(
      new h(e.position.x, e.position.y),
      e.spawnTick
    );
    return t.setVelocity(new h(e.velocity.x, e.velocity.y)), t.setRotation(e.rotation), t.health = e.health, t.maxHealth = e.maxHealth, t.destroyed = e.isDestroyed, t.hidden = e.hidden, t.lastToggleTick = e.lastToggleTick, t;
  }
}
L.registerType(b.TypeName, b);
class P extends b {
  static TypeName = "JackpotDiamond";
  constructor(e, t, s) {
    super(e, t, s);
  }
  getType() {
    return P.TypeName;
  }
  serialize() {
    return super.serialize();
  }
  static deserialize(e) {
    const t = new P(
      new h(e.position.x, e.position.y),
      e.spawnTick
    );
    return t.setVelocity(new h(e.velocity.x, e.velocity.y)), t.setRotation(e.rotation), t.health = e.health, t.maxHealth = e.maxHealth, t.destroyed = e.isDestroyed, t.setHidden(e.hidden), t;
  }
}
L.registerType(P.TypeName, P);
class N extends B {
  static TypeName = "PowerUp";
  static idCounter = 0;
  powerUpType;
  spawnTick;
  isHelpful;
  constructor(e, t, s = !0, i, n) {
    const r = n || `powerup_${++N.idCounter}`;
    super(r, e, new h(1, 1), 1), this.powerUpType = t, this.spawnTick = i, this.isHelpful = s;
  }
  getType() {
    return N.TypeName;
  }
  getPowerUpType() {
    return this.powerUpType;
  }
  isHelpfulPowerUp() {
    return this.isHelpful;
  }
  getPotionType() {
    return this.isHelpful ? "helpful" : "hindering";
  }
  containsPoint(e) {
    const t = this.getPosition();
    return t.x === e.x && t.y === e.y;
  }
  update(e, t) {
    if (super.update(e, t), this.destroyed)
      return;
    t - this.spawnTick >= o.POWER_UP_DURATION && this.destroy();
  }
  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y },
      size: { x: this.size.x, y: this.size.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      rotation: this.rotation,
      health: this.health,
      maxHealth: this.maxHealth,
      isDestroyed: this.destroyed,
      powerUpType: this.powerUpType,
      spawnTick: this.spawnTick,
      isHelpful: this.isHelpful
    };
  }
  static deserialize(e) {
    const t = new N(
      new h(e.position.x, e.position.y),
      e.powerUpType,
      e.isHelpful,
      e.spawnTick
    );
    return t.setVelocity(new h(e.velocity.x, e.velocity.y)), t.setRotation(e.rotation), t.health = e.health, t.maxHealth = e.maxHealth, t.destroyed = e.isDestroyed, t;
  }
}
L.registerType(N.TypeName, N);
class x extends B {
  static TypeName = "Snake";
  static idCounter = 0;
  bodyPositions;
  direction;
  snakeLength;
  dontRemoveTailInNextMoveIteration = !1;
  constructor(e, t = m.RIGHT, s) {
    const i = s || `snake_${++x.idCounter}`;
    super(
      i,
      e[0] || new h(0, 0),
      new h(1, 1),
      e.length
    ), this.direction = t, this.snakeLength = e.length, this.bodyPositions = [...e];
  }
  getType() {
    return x.TypeName;
  }
  getDirection() {
    return this.direction;
  }
  setDirection(e) {
    this.direction = e, this.needsRepaint = !0;
  }
  getLength() {
    return this.snakeLength;
  }
  getPositions() {
    return [...this.bodyPositions];
  }
  getHeadPosition() {
    return this.bodyPositions.length > 0 ? this.bodyPositions[0] : null;
  }
  getTailPosition() {
    return this.bodyPositions.length > 0 ? this.bodyPositions[this.bodyPositions.length - 1] : null;
  }
  getSegmentType(e) {
    return e < 0 || e >= this.bodyPositions.length ? "body" : e === 0 ? "head" : e === this.bodyPositions.length - 1 ? "tail" : "body";
  }
  move(e) {
    if (this.bodyPositions.unshift(e), this.emit("segmentAdded", this, e), this.setPosition(e), this.dontRemoveTailInNextMoveIteration)
      this.snakeLength++, this.dontRemoveTailInNextMoveIteration = !1;
    else {
      const t = this.bodyPositions.pop();
      t && this.emit("segmentRemoved", this, t);
    }
    this.needsRepaint = !0;
  }
  grow() {
    this.dontRemoveTailInNextMoveIteration = !0, this.needsRepaint = !0;
  }
  update(e, t) {
    if (super.update(e, t), this.destroyed)
      return;
    const s = this.getHeadPosition();
    s && this.setPosition(s);
  }
  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y },
      size: { x: this.size.x, y: this.size.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      rotation: this.rotation,
      health: this.health,
      maxHealth: this.maxHealth,
      isDestroyed: this.destroyed,
      bodyPositions: this.bodyPositions.map((e) => ({ x: e.x, y: e.y })),
      direction: this.direction,
      snakeLength: this.snakeLength
    };
  }
  static deserialize(e) {
    const t = e.bodyPositions.map(
      (i) => new h(i.x, i.y)
    ), s = new x(t, e.direction, void 0);
    return s.setVelocity(new h(e.velocity.x, e.velocity.y)), s.setRotation(e.rotation), s.health = e.health, s.maxHealth = e.maxHealth, s.destroyed = e.isDestroyed, s;
  }
}
L.registerType(x.TypeName, x);
class fe {
  audioContext = null;
  eatSoundBuffer = null;
  gameOverSoundBuffer = null;
  arenaResetSoundBuffer = null;
  invincibleMusicSource = null;
  invertedMusicSource = null;
  invincibleMusicBuffer = null;
  invertedMusicBuffer = null;
  constructor() {
    this.initAudio();
  }
  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)(), await this.loadEatSound(), await this.loadGameOverSound(), await this.loadArenaResetSound(), await this.loadInvincibleMusic(), await this.loadInvertedMusic();
    } catch (e) {
      console.warn("Audio not supported:", e);
    }
  }
  async loadEatSound() {
    try {
      const e = this.audioContext.sampleRate, s = this.audioContext.createBuffer(
        1,
        e * 0.25,
        e
      ), i = s.getChannelData(0);
      for (let n = 0; n < s.length; n++) {
        const r = n / e, a = Math.exp(-r * 6), l = 800 + Math.sin(r * 100) * 200, d = Math.sin(2 * Math.PI * l * r) * 0.4, g = (Math.random() - 0.5) * 2 * 0.3, f = Math.sin(2 * Math.PI * l * 1.5 * r) * 0.2, S = Math.sin(2 * Math.PI * l * 2.2 * r) * 0.1;
        i[n] = (d + g + f + S) * a * 0.5;
      }
      this.eatSoundBuffer = s;
    } catch (e) {
      console.warn("Could not create eat sound:", e);
    }
  }
  async loadGameOverSound() {
    try {
      const e = this.audioContext.sampleRate, s = this.audioContext.createBuffer(
        1,
        e * 0.4,
        e
      ), i = s.getChannelData(0);
      for (let n = 0; n < s.length; n++) {
        const r = n / e, a = Math.exp(-r * 5), l = 400 - r * 200, d = Math.sin(2 * Math.PI * l * r) * 0.5, g = (Math.random() - 0.5) * 2 * 0.3, f = Math.sin(2 * Math.PI * (l * 0.5) * r) * 0.2;
        i[n] = (d + g + f) * a * 0.6;
      }
      this.gameOverSoundBuffer = s;
    } catch (e) {
      console.warn("Could not create game over sound:", e);
    }
  }
  async loadArenaResetSound() {
    try {
      const e = this.audioContext.sampleRate, s = this.audioContext.createBuffer(
        1,
        e * 0.3,
        e
      ), i = s.getChannelData(0);
      for (let n = 0; n < s.length; n++) {
        const r = n / e, a = Math.exp(-r * 3), l = 800, d = Math.sin(2 * Math.PI * l * r) * 0.4, g = Math.sin(2 * Math.PI * l * 2.5 * r) * 0.2, f = Math.sin(2 * Math.PI * l * 4 * r) * 0.1, S = Math.sin(2 * Math.PI * l * 5.5 * r) * 0.05, u = l + Math.sin(r * 10) * 50, c = Math.sin(2 * Math.PI * u * r) * 0.1;
        i[n] = (d + g + f + S + c) * a * 0.6;
      }
      this.arenaResetSoundBuffer = s;
    } catch (e) {
      console.warn("Could not create arena reset sound:", e);
    }
  }
  async loadInvincibleMusic() {
    try {
      const e = this.audioContext.sampleRate, s = this.audioContext.createBuffer(
        1,
        e * 0.8,
        e
      ), i = s.getChannelData(0);
      for (let n = 0; n < s.length; n++) {
        const a = n / e % 0.8, l = Math.sin(2 * Math.PI * 523 * a * 6) * 0.25 + // C note, 6x speed
        Math.sin(2 * Math.PI * 659 * a * 6) * 0.2 + // E note, 6x speed
        Math.sin(2 * Math.PI * 784 * a * 6) * 0.2, d = Math.sin(2 * Math.PI * 659 * a * 8) * 0.2 + // E note, 8x speed
        Math.sin(2 * Math.PI * 784 * a * 8) * 0.15 + // G note, 8x speed
        Math.sin(2 * Math.PI * 1047 * a * 8) * 0.15, g = Math.sin(2 * Math.PI * 784 * a * 10) * 0.15 + // G note, 10x speed
        Math.sin(2 * Math.PI * 1047 * a * 10) * 0.1 + // C note octave, 10x speed
        Math.sin(2 * Math.PI * 1319 * a * 10) * 0.1, f = Math.sin(2 * Math.PI * 131 * a * 4) * 0.3 + // Low C
        Math.sin(2 * Math.PI * 165 * a * 4) * 0.25 + // Low E
        Math.sin(2 * Math.PI * 196 * a * 4) * 0.25, S = Math.sin(2 * Math.PI * 1047 * a * 12) * 0.15 + // High C
        Math.sin(2 * Math.PI * 1319 * a * 12) * 0.1 + // High E
        Math.sin(2 * Math.PI * 1568 * a * 12) * 0.1, u = Math.sin(a * Math.PI * 6) * 0.5 + 0.5, c = (l + d + g + f + S) * u * 0.25;
        i[n] = c;
      }
      this.invincibleMusicBuffer = s;
    } catch (e) {
      console.warn("Could not create invincible music:", e);
    }
  }
  async loadInvertedMusic() {
    try {
      const e = this.audioContext.sampleRate, s = this.audioContext.createBuffer(
        1,
        e * 3,
        e
      ), i = s.getChannelData(0);
      for (let n = 0; n < s.length; n++) {
        const a = n / e % 3, l = Math.sin(2 * Math.PI * 55 * a) * 0.4 + // Low A
        Math.sin(2 * Math.PI * 73 * a) * 0.3, d = Math.sin(2 * Math.PI * 220 * a) * 0.2 + // A
        Math.sin(2 * Math.PI * 261 * a) * 0.15 + // C
        Math.sin(2 * Math.PI * 293 * a) * 0.15, g = Math.sin(2 * Math.PI * 233 * a) * 0.1 + // A#
        Math.sin(2 * Math.PI * 277 * a) * 0.1, f = Math.sin(2 * Math.PI * 110 * a * 0.5) * 0.3, S = Math.sin(a * Math.PI * 0.5) * 0.3 + 0.7;
        i[n] = (l + d + g + f) * S * 0.3;
      }
      this.invertedMusicBuffer = s;
    } catch (e) {
      console.warn("Could not create inverted music:", e);
    }
  }
  playEatSound() {
    if (!(!this.audioContext || !this.eatSoundBuffer))
      try {
        const e = this.audioContext.createBufferSource();
        e.buffer = this.eatSoundBuffer, e.connect(this.audioContext.destination), e.start(0);
      } catch (e) {
        console.warn("Could not play eat sound:", e);
      }
  }
  playGameOverSound() {
    if (!(!this.audioContext || !this.gameOverSoundBuffer))
      try {
        const e = this.audioContext.createBufferSource();
        e.buffer = this.gameOverSoundBuffer, e.connect(this.audioContext.destination), e.start(0);
      } catch (e) {
        console.warn("Could not play game over sound:", e);
      }
  }
  playArenaResetSound() {
    if (!(!this.audioContext || !this.arenaResetSoundBuffer))
      try {
        const e = this.audioContext.createBufferSource();
        e.buffer = this.arenaResetSoundBuffer, e.connect(this.audioContext.destination), e.start(0);
      } catch (e) {
        console.warn("Could not play arena reset sound:", e);
      }
  }
  playInvincibleMusic() {
    if (!(!this.audioContext || !this.invincibleMusicBuffer))
      try {
        this.stopInvincibleMusic(), this.invincibleMusicSource = this.audioContext.createBufferSource(), this.invincibleMusicSource.buffer = this.invincibleMusicBuffer, this.invincibleMusicSource.connect(this.audioContext.destination), this.invincibleMusicSource.loop = !0, this.invincibleMusicSource.start(0);
      } catch (e) {
        console.warn("Could not play invincible music:", e);
      }
  }
  stopInvincibleMusic() {
    if (this.invincibleMusicSource)
      try {
        this.invincibleMusicSource.stop(), this.invincibleMusicSource = null;
      } catch (e) {
        console.warn("Could not stop invincible music:", e);
      }
  }
  playInvertedMusic() {
    if (!(!this.audioContext || !this.invertedMusicBuffer))
      try {
        this.stopInvertedMusic(), this.invertedMusicSource = this.audioContext.createBufferSource(), this.invertedMusicSource.buffer = this.invertedMusicBuffer, this.invertedMusicSource.connect(this.audioContext.destination), this.invertedMusicSource.loop = !0, this.invertedMusicSource.start(0);
      } catch (e) {
        console.warn("Could not play inverted music:", e);
      }
  }
  stopInvertedMusic() {
    if (this.invertedMusicSource)
      try {
        this.invertedMusicSource.stop(), this.invertedMusicSource = null;
      } catch (e) {
        console.warn("Could not stop inverted music:", e);
      }
  }
  playSlowDownChime() {
    if (this.audioContext)
      try {
        const e = this.audioContext.sampleRate, s = this.audioContext.createBuffer(
          1,
          e * 0.5,
          e
        ), i = s.getChannelData(0);
        for (let r = 0; r < s.length; r++) {
          const a = r / e, l = Math.exp(-a * 4), d = Math.sin(2 * Math.PI * 523 * a) * 0.3 + // C note
          Math.sin(2 * Math.PI * 659 * a) * 0.25 + // E note
          Math.sin(2 * Math.PI * 784 * a) * 0.25 + // G note
          Math.sin(2 * Math.PI * 1047 * a) * 0.2, g = Math.sin(2 * Math.PI * 1319 * a) * 0.15 + // E octave
          Math.sin(2 * Math.PI * 1568 * a) * 0.1;
          i[r] = (d + g) * l * 0.6;
        }
        const n = this.audioContext.createBufferSource();
        n.buffer = s, n.connect(this.audioContext.destination), n.start(0);
      } catch (e) {
        console.warn("Could not play slow down chime:", e);
      }
  }
  // Method to resume audio context (needed for browser autoplay policies)
  resumeAudioContext() {
    this.audioContext && this.audioContext.state === "suspended" && this.audioContext.resume();
  }
}
const E = new fe(), J = "preview_obstacle";
var Q = /* @__PURE__ */ ((p) => (p.LEVEL_CHANGE = "levelChange", p))(Q || {});
class Oe extends te {
  gameConfig = {};
  currentMoveInterval = o.INITIAL_MOVE_INTERVAL;
  directionQueue = [];
  speedIncreaseCount = 0;
  applesEaten = 0;
  potionsEaten = 0;
  jackpotTokensCollected = 0;
  jackpotEligible = !1;
  jackpotTier = null;
  potentialJackpotReturn = 0;
  jackpotDiamondSpawned = !1;
  jackpotWon = !1;
  currentObstacleStrategy = {};
  strategyManager = {};
  isLoadingLevel = !1;
  // Flag to prevent consumable spawning during level transitions
  // Collision grids for different collision types
  collisionBspTree;
  spawnBspTree;
  snakeBspTree;
  constructor(e) {
    super(e), this.collisionBspTree = new K(), this.spawnBspTree = new K(), this.snakeBspTree = new K(), this.setupInputHandling();
  }
  async reset(e) {
    E.stopInvincibleMusic(), E.stopInvertedMusic(), await super.reset(e);
  }
  end() {
    super.end(), E.stopInvincibleMusic(), E.stopInvertedMusic(), E.playGameOverSound();
  }
  handleGameObjectDestroyed = (e) => {
    e.off(
      A.POSITION_CHANGED,
      this.handleGameObjectPositionChanged
    ), this.collisionBspTree.removeSource(e), this.spawnBspTree.removeSource(e);
  };
  getSnake() {
    return this.gameObjectGroups.get(x.TypeName).getById("snake-1");
  }
  getObstacles() {
    let e = this.gameObjectGroups.get(C.TypeName);
    return e || (e = new M(), this.gameObjectGroups.set(C.TypeName, e)), e;
  }
  getPreviewObstacles() {
    let e = this.gameObjectGroups.get(J);
    return e || (e = new M(), this.gameObjectGroups.set(J, e)), e;
  }
  getConsumables() {
    let e = this.gameObjectGroups.get(b.TypeName);
    return e || (e = new M(), this.gameObjectGroups.set(b.TypeName, e)), e;
  }
  getPowerUps() {
    let e = this.gameObjectGroups.get(N.TypeName);
    return e || (e = new M(), this.gameObjectGroups.set(N.TypeName, e)), e;
  }
  getJackpotDiamonds() {
    let e = this.gameObjectGroups.get(P.TypeName);
    return e || (e = new M(), this.gameObjectGroups.set(P.TypeName, e)), e;
  }
  getActiveEffects() {
    return this.gameConfig.activeEffects;
  }
  isGameRunning() {
    return this.state === G.PLAYING;
  }
  isGameOver() {
    return this.state === G.ENDED;
  }
  isGamePaused() {
    return this.state === G.PAUSED;
  }
  getLoader() {
    return super.getLoader();
  }
  getPrng() {
    return this.prng;
  }
  getGameConfig() {
    return {
      ...this.gameConfig,
      state: this.state,
      levelName: this.currentObstacleStrategy.levelName,
      applesEaten: this.applesEaten,
      jackpotTokensCollected: this.jackpotTokensCollected,
      jackpotEligible: this.jackpotEligible,
      jackpotTier: this.jackpotTier,
      potentialJackpotReturn: this.potentialJackpotReturn,
      jackpotWon: this.jackpotWon,
      coinRevealOrder: this.gameConfig.coinRevealOrder
    };
  }
  setJackpotInfo(e, t, s) {
    this.jackpotEligible = e, this.jackpotTier = t, this.potentialJackpotReturn = 0, this.jackpotDiamondSpawned = !1, s && (this.gameConfig.coinRevealOrder = s);
  }
  start() {
    E.resumeAudioContext(), this.setupTimers(), this.spawnConsumable(), super.start();
  }
  setupTimers() {
    this.timer.reset(), this.setInterval(() => {
      this.clearDestroyedGameObjects();
    }, 600);
    const e = () => {
      this.moveSnake(), this.setTimeout(e, this.currentMoveInterval);
    };
    this.setTimeout(e, this.currentMoveInterval), this.setInterval(() => {
      this.speedIncreaseCount++, this.currentMoveInterval = Math.max(
        this.currentMoveInterval - o.SPEED_INCREASE_AMOUNT,
        o.MIN_MOVE_INTERVAL
      );
    }, o.SPEED_INCREASE_INTERVAL), this.setInterval(() => {
      this.getPowerUps().activeSize() === 0 && this.prng.randomBoolean(o.POWER_UP_SPAWN_CHANCE) && this.spawnPowerUp();
    }, o.POWER_UP_SPAWN_INTERVAL), this.setInterval(() => {
      this.getConsumables().activeSize() === 0 && this.spawnConsumable();
    }, o.CONSUMABLE_SPAWN_INTERVAL), this.setInterval(() => {
      this.spawnNextObstacles();
    }, o.OBSTACLE_SPAWN_INTERVAL);
  }
  changeDirection(e) {
    const s = this.getEventManager().getSource();
    s instanceof se ? s.queueInput("direction", { direction: e }) : this.changeDirectionInternal(e);
  }
  changeDirectionInternal(e) {
    this.gameConfig.activeEffects.some(
      (n) => n.type === y.INVERTED_CONTROLS
    ) && (e = {
      [m.UP]: m.DOWN,
      [m.DOWN]: m.UP,
      [m.LEFT]: m.RIGHT,
      [m.RIGHT]: m.LEFT
    }[e]);
    const s = this.getSnake().getDirection(), i = {
      [m.UP]: m.DOWN,
      [m.DOWN]: m.UP,
      [m.LEFT]: m.RIGHT,
      [m.RIGHT]: m.LEFT
    };
    if (i[s] !== e) {
      const n = this.directionQueue.length > 0 ? this.directionQueue[this.directionQueue.length - 1] : s;
      i[n] !== e && (this.directionQueue.length === 0 || this.directionQueue[this.directionQueue.length - 1] !== e) && this.directionQueue.push(e);
    }
  }
  // Relative turn handler for two-button UI: 'left' or 'right' relative to current heading
  changeDirectionRelative(e) {
    const t = this.getSnake().getDirection();
    let s;
    t === m.UP ? s = e === "left" ? m.LEFT : m.RIGHT : t === m.DOWN ? s = e === "left" ? m.RIGHT : m.LEFT : t === m.LEFT ? s = e === "left" ? m.DOWN : m.UP : s = e === "left" ? m.UP : m.DOWN, this.changeDirection(s);
  }
  async setup() {
    const e = {
      jackpotEligible: this.jackpotEligible,
      jackpotTier: this.jackpotTier,
      potentialJackpotReturn: this.potentialJackpotReturn,
      coinRevealOrder: this.gameConfig?.coinRevealOrder
    };
    this.collisionBspTree.clear(), this.spawnBspTree.clear(), this.snakeBspTree.clear(), this.strategyManager = new pe(this), this.currentObstacleStrategy = this.strategyManager.getStrategyForLevel(1), this.gameConfig = {
      state: G.READY,
      activeEffects: [],
      score: 0,
      level: 1,
      levelName: this.currentObstacleStrategy.levelName,
      applesEaten: 0,
      potionsEaten: 0,
      jackpotTokensCollected: 0,
      jackpotEligible: e.jackpotEligible,
      jackpotTier: e.jackpotTier,
      potentialJackpotReturn: e.potentialJackpotReturn,
      coinRevealOrder: e.coinRevealOrder,
      jackpotWon: !1
    }, this.currentMoveInterval = o.INITIAL_MOVE_INTERVAL, this.directionQueue = [], this.speedIncreaseCount = 0, this.applesEaten = 0, this.potionsEaten = 0, this.jackpotTokensCollected = 0, this.jackpotEligible = e.jackpotEligible, this.jackpotTier = e.jackpotTier, this.potentialJackpotReturn = e.potentialJackpotReturn, this.jackpotDiamondSpawned = !1, this.jackpotWon = !1, this.isLoadingLevel = !1, await this.loadStrategyAndSetupMap(), this.createSnake();
  }
  setupInputHandling() {
    this.getEventManager().onUserInput = (e) => {
      console.log("Received input event:", e), e.inputType === "direction" && e.params?.direction && this.changeDirectionInternal(e.params.direction);
    };
  }
  update(e) {
    super.update(e), this.state === G.PLAYING && this.checkCollisions();
  }
  moveSnake() {
    const e = this.getSnake();
    if (this.directionQueue.length > 0) {
      const i = this.directionQueue.shift();
      e.setDirection(i);
    }
    const t = e.getHeadPosition(), s = this.getNextPosition(t, e.getDirection());
    e.move(s);
  }
  getNextPosition(e, t) {
    const { ARENA_SIZE: s } = o;
    let { x: i, y: n } = e;
    switch (t) {
      case m.UP:
        n = n === 0 ? s - 1 : n - 1;
        break;
      case m.DOWN:
        n = n === s - 1 ? 0 : n + 1;
        break;
      case m.LEFT:
        i = i === 0 ? s - 1 : i - 1;
        break;
      case m.RIGHT:
        i = i === s - 1 ? 0 : i + 1;
        break;
    }
    return new h(i, n);
  }
  checkCollisions() {
    const e = this.getSnake(), s = e.getPositions()[0], i = s.x < 0 || s.x >= o.ARENA_SIZE || s.y < 0 || s.y >= o.ARENA_SIZE, n = this.collisionBspTree.containsPoint(s), r = n.length > 0;
    for (const a of n) {
      const l = a;
      if (!l.isDestroyed())
        switch (l.getType()) {
          case b.TypeName: {
            l.destroy();
            const d = 1 + this.speedIncreaseCount;
            this.gameConfig.score += d, this.applesEaten++, e.grow(), E.playEatSound(), this.jackpotEligible && this.applesEaten === 3 && !this.jackpotDiamondSpawned && this.setTimeout(() => {
              try {
                this.spawnJackpotDiamond();
              } catch (u) {
                console.error("�� Error in spawnJackpotDiamond:", u);
              }
            }, 0);
            const g = this.gameConfig.level - 1, f = z[g];
            f && e.getLength() >= f.maxSnakeLength || this.spawnConsumable(), this.applesEaten % o.APPLES_TO_LEVEL_UP === 0 && this.goToNextLevel();
            break;
          }
          case P.TypeName: {
            l.destroy(), this.jackpotWon = !0, this.jackpotTokensCollected++, e.grow(), E.playEatSound();
            const d = this.gameConfig.level - 1, g = z[d];
            g && e.getLength() >= g.maxSnakeLength || this.spawnConsumable();
            break;
          }
          case N.TypeName: {
            const d = l;
            l.destroy(), this.gameConfig.score += 5, this.gameConfig.potionsEaten += 1, this.potionsEaten += 1, this.applyPowerUpEffect(d);
            break;
          }
          case C.TypeName: {
            const d = this.gameConfig.activeEffects.some(
              (g) => g.type === y.INVINCIBLE
            );
            (i || r) && !d && this.end();
          }
        }
    }
  }
  async loadStrategyAndSetupMap() {
    const e = this.getObstacles(), t = this.getPreviewObstacles(), s = this.getConsumables();
    e.clearAndDestroy(), t.clearAndDestroy(), s.clearAndDestroy(), this.currentObstacleStrategy.reset(), await this.currentObstacleStrategy.setOnStrategyLoaded(
      e,
      t
    ), this.spawnObstacles(), this.spawnConsumable();
  }
  spawnConsumable() {
    if (this.isLoadingLevel || this.getConsumables().activeSize() > 0)
      return null;
    const t = this.findAvailableSpawnPoint();
    if (t === null)
      return null;
    const s = new b(t, this.totalTicks);
    return this.registerGameObject(s), this.collisionBspTree.add(t, s), this.spawnBspTree.add(t, s), s.on(
      A.POSITION_CHANGED,
      this.handleGameObjectPositionChanged
    ), s.on(A.DESTROYED, this.handleGameObjectDestroyed), s;
  }
  /**
   * Check if a position has 3 or more adjacent obstacle blocks
   * This prevents spawning consumables in unreachable locations
   */
  hasTooManyAdjacentObstacles(e, t) {
    const s = [
      new h(e.x - 1, e.y),
      // Left
      new h(e.x + 1, e.y),
      // Right
      new h(e.x, e.y - 1),
      // Up
      new h(e.x, e.y + 1)
      // Down
    ];
    let i = 0;
    for (const n of s) {
      if (n.x < 0 || n.x >= o.ARENA_SIZE || n.y < 0 || n.y >= o.ARENA_SIZE) {
        i++;
        continue;
      }
      t.getAllActive().some((r) => r.containsPoint(n)) && i++;
    }
    return i >= 3;
  }
  spawnPowerUp() {
    const e = this.findAvailableSpawnPoint();
    if (e === null)
      return;
    let t, s;
    this.prng.randomBoolean(0.65) ? (t = this.prng.randomChoice([
      y.INVINCIBLE,
      y.SLOW_DOWN
    ]), s = !0) : (t = this.prng.randomChoice([
      y.INVERTED_CONTROLS,
      y.DARKNESS
    ]), s = !1);
    const n = new N(
      e,
      t,
      s,
      this.totalTicks
    );
    this.registerGameObject(n), this.collisionBspTree.add(e, n), this.spawnBspTree.add(e, n), n.on(
      A.POSITION_CHANGED,
      this.handleGameObjectPositionChanged
    ), n.on(A.DESTROYED, this.handleGameObjectDestroyed);
  }
  applyPowerUpEffect(e) {
    const t = Date.now();
    E.stopInvincibleMusic(), E.stopInvertedMusic();
    const s = this.gameConfig.activeEffects.some(
      (r) => r.type === y.SLOW_DOWN
    );
    this.gameConfig.activeEffects = [], s && this.resetSpeedToNormal();
    const i = e.getPowerUpType() === y.SLOW_DOWN ? o.SLOW_DOWN_EFFECT_DURATION : o.POWER_UP_EFFECT_DURATION, n = {
      type: e.getPowerUpType(),
      startTime: t,
      duration: i,
      isHelpful: e.isHelpfulPowerUp(),
      timerId: 0
    };
    n.timerId = this.setTimeout(() => {
      n.type === y.INVINCIBLE ? E.stopInvincibleMusic() : n.type === y.INVERTED_CONTROLS ? E.stopInvertedMusic() : n.type === y.SLOW_DOWN ? this.resetSpeedToNormal() : n.type === y.DARKNESS && E.stopInvertedMusic(), this.gameConfig.activeEffects = this.gameConfig.activeEffects.filter(
        (r) => r !== n
      );
    }, i), this.gameConfig.activeEffects.push(n), e.getPowerUpType() === y.INVINCIBLE ? E.playInvincibleMusic() : e.getPowerUpType() === y.INVERTED_CONTROLS ? E.playInvertedMusic() : e.getPowerUpType() === y.SLOW_DOWN ? (E.playSlowDownChime(), this.currentMoveInterval = o.INITIAL_MOVE_INTERVAL) : e.getPowerUpType() === y.DARKNESS && E.playInvertedMusic();
  }
  spawnNextObstacles() {
    if (!this.currentObstacleStrategy.isStatic())
      try {
        this.spawnObstacles();
      } catch (e) {
        console.error("Error spawning obstacles:", e);
      }
  }
  spawnObstacles() {
    if (!this.getObstacles()) {
      console.error("Invalid game state for obstacle spawning");
      return;
    }
    const t = {
      collisionGrid: this.collisionBspTree,
      spawnGrid: this.spawnBspTree,
      snakeGrid: this.snakeBspTree
    }, s = this.currentObstacleStrategy.spawnObstacles(t);
    for (const i of s.collidesWith)
      if (i instanceof B)
        switch (i.destroy(), i.getType()) {
          case P.TypeName:
            this.spawnJackpotDiamond();
            break;
          case b.TypeName:
            this.spawnConsumable();
            break;
          case N.TypeName:
            this.spawnPowerUp();
            break;
        }
  }
  resetSpeedToNormal() {
    const e = Math.max(
      o.INITIAL_MOVE_INTERVAL - this.speedIncreaseCount * o.SPEED_INCREASE_AMOUNT,
      o.MIN_MOVE_INTERVAL
    );
    this.currentMoveInterval = e;
  }
  goToNextLevel() {
    this.pause(), this.emit(
      "levelChange"
      /* LEVEL_CHANGE */
    ), E.playArenaResetSound(), this.gameConfig.level++, this.resetArenaObstaclesAndBounds(), this.getJackpotDiamonds().clearAndDestroy(), this.jackpotDiamondSpawned = !1, this.currentMoveInterval = Math.min(
      this.currentMoveInterval + T(20),
      o.INITIAL_MOVE_INTERVAL
    );
    const e = this.gameConfig.level;
    this.currentObstacleStrategy = this.strategyManager.getStrategyForLevel(e), this.gameConfig.levelName = this.currentObstacleStrategy.levelName, this.currentObstacleStrategy.reset(), this.loadStrategyAndResumeLevel();
  }
  async loadStrategyAndResumeLevel() {
    await this.currentObstacleStrategy.setOnStrategyLoaded(
      this.getObstacles(),
      this.getPreviewObstacles()
    ), this.spawnObstacles(), this.resume();
  }
  /**
   * Find a safe position to spawn the snake, avoiding obstacles
   */
  findSafeSnakeSpawnPosition() {
    let t = 0;
    for (; t < 50; ) {
      const s = this.prng.randomInt(
        1,
        o.ARENA_SIZE - o.INITIAL_SNAKE_LENGTH - 1
      ), i = this.prng.randomInt(1, o.ARENA_SIZE - 2), n = new h(s, i);
      if (Array.from(
        { length: o.INITIAL_SNAKE_LENGTH },
        (l, d) => new h(n.x + d, n.y)
      ).every(
        (l) => this.collisionBspTree.containsPoint(l).length === 0
      ))
        return n;
      t++;
    }
    return D;
  }
  /**
   * Set up event listeners for all game objects to maintain collision grids
   */
  createSnake() {
    let e = D;
    if (Array.from(
      { length: o.INITIAL_SNAKE_LENGTH },
      (l, d) => new h(D.x + d, D.y)
    ).some(
      (l) => this.collisionBspTree.containsPoint(l).length > 0
    )) {
      const l = this.findSafeSnakeSpawnPosition();
      l && (e = l);
    }
    const i = Array.from(
      { length: o.INITIAL_SNAKE_LENGTH },
      (l, d) => new h(e.x + d, e.y)
    ).reverse(), n = new x(
      i,
      ne,
      "snake-1"
    );
    this.gameObjectGroups.get(x.TypeName)?.clear(), this.registerGameObject(n);
    const r = this.getSnake();
    r.getPositions().forEach((l) => {
      this.collisionBspTree.add(l, r), this.spawnBspTree.add(l, r), this.snakeBspTree.add(l, r);
    }), r.on("segmentAdded", this.handleSnakeSegmentAdded), r.on("segmentRemoved", this.handleSnakeSegmentRemoved);
  }
  /**
   * Event handlers for maintaining collision grids
   */
  handleSnakeSegmentAdded = (e, t) => {
    this.collisionBspTree.containsPoint(t).find((i) => i === e) ? this.end() : (this.collisionBspTree.add(t, e), this.spawnBspTree.add(t, e), this.snakeBspTree.add(t, e));
  };
  handleSnakeSegmentRemoved = (e, t) => {
    this.collisionBspTree.remove(t, e), this.spawnBspTree.remove(t, e), this.snakeBspTree.remove(t, e);
  };
  handleGameObjectPositionChanged = (e, t, s) => {
    this.collisionBspTree.remove(t, e), this.collisionBspTree.add(s, e), this.spawnBspTree.remove(t, e), this.spawnBspTree.add(s, e);
  };
  spawnJackpotDiamond() {
    if (typeof P > "u") {
      console.error("🎰 ERROR: JackpotDiamond is undefined!");
      return;
    }
    if (!P.TypeName) {
      console.error("🎰 ERROR: JackpotDiamond.TypeName is undefined!");
      return;
    }
    const e = this.findAvailableSpawnPoint(!1);
    if (e) {
      const t = new P(e, this.totalTicks);
      this.registerGameObject(t), this.collisionBspTree.add(e, t), this.spawnBspTree.add(e, t), t.on(
        A.POSITION_CHANGED,
        this.handleGameObjectPositionChanged
      ), t.on(
        A.DESTROYED,
        this.handleGameObjectDestroyed
      ), this.jackpotDiamondSpawned = !0;
    }
  }
  findAvailableSpawnPoint(e = !0) {
    e = !1;
    const t = this.getObstacles(), s = 10;
    let i = 0, n;
    do {
      let r, a;
      r = this.prng.randomInt(0, o.ARENA_SIZE - 1), a = this.prng.randomInt(0, o.ARENA_SIZE - 1), n = new h(r, a), i++;
    } while (i < s && (this.spawnBspTree.containsPoint(n).length > 0 || e && this.hasTooManyAdjacentObstacles(n, t)));
    return i >= s ? (console.log("findAvailableSpawnPoint: max attempts reached"), null) : n;
  }
  /**
   * Show a placeholder map with no obstacles for degen mode
   * This provides a clean canvas while waiting for the real level to load
   */
  showPlaceholderMap() {
    this.resetArenaObstaclesAndBounds(), this.currentObstacleStrategy = new ue(this), this.gameConfig.levelName = "???";
  }
  resetArenaObstaclesAndBounds() {
    const e = this.getObstacles(), t = this.getPreviewObstacles();
    e.clearAndDestroy(), t.clearAndDestroy();
  }
}
class me extends H {
  constructor(e) {
    super(e);
  }
  getId(e) {
    const t = e.getPosition();
    return `consumable_${t.x}_${t.y}_${e.getId()}`;
  }
  create(e) {
    const t = e.getPosition(), s = this.createStandardContainer(
      t.x * o.BLOCK_SIZE,
      t.y * o.BLOCK_SIZE,
      void 0,
      this.createAppleGraphics()
    );
    return s.name = `consumable_${t.x}_${t.y}`, s;
  }
  repaintContainer(e, t) {
    const s = t.getPosition();
    e.position.set(
      s.x * o.BLOCK_SIZE,
      s.y * o.BLOCK_SIZE
    ), e.visible = !t.isHidden();
  }
  createAppleGraphics() {
    const e = this.createGraphics(), t = o.BLOCK_SIZE, s = t / 2, i = t / 2, n = t / 2;
    return e.circle(i, n, s), e.fill(v.CONSUMABLE), e.circle(i, n, s), e.stroke({ color: 0, width: 1 }), e;
  }
}
class we {
  container;
  gridGraphics;
  constructor(e) {
    this.container = e;
  }
  /**
   * Render the static grid - this should only be called once during initialization
   */
  renderGrid() {
    this.gridGraphics || (this.gridGraphics = new I.Graphics(), this.gridGraphics.rect(
      0,
      0,
      o.ARENA_SIZE * o.BLOCK_SIZE,
      o.ARENA_SIZE * o.BLOCK_SIZE
    ), this.gridGraphics.stroke({ color: v.GRID, width: 2 }), this.container.addChild(this.gridGraphics));
  }
  /**
   * Show the grid
   */
  show() {
    this.gridGraphics && (this.gridGraphics.visible = !0);
  }
  /**
   * Hide the grid
   */
  hide() {
    this.gridGraphics && (this.gridGraphics.visible = !1);
  }
  /**
   * Destroy the grid renderer and clean up resources
   */
  destroy() {
    this.gridGraphics && (this.container.removeChild(this.gridGraphics), this.gridGraphics.destroy(), this.gridGraphics = void 0);
  }
}
class Se extends H {
  constructor(e) {
    super(e);
  }
  getId(e) {
    return `${e.getId()}_render`;
  }
  create(e) {
    const t = e.getPosition(), s = this.createStandardContainer(
      t.x * o.BLOCK_SIZE,
      t.y * o.BLOCK_SIZE,
      void 0,
      this.createDiamondGraphics()
    );
    return s.name = `jackpot_diamond_${t.x}_${t.y}`, s;
  }
  repaintContainer(e, t) {
    const s = t.getPosition();
    e.position.set(
      s.x * o.BLOCK_SIZE,
      s.y * o.BLOCK_SIZE
    );
  }
  createDiamondGraphics() {
    const e = this.createGraphics(), t = o.BLOCK_SIZE, s = t / 2, i = t / 2, n = t / 2;
    return e.beginFill(65535), e.lineStyle(2, 32896), e.moveTo(s, i - n), e.lineTo(s + n, i), e.lineTo(s, i + n), e.lineTo(s - n, i), e.closePath(), e.endFill(), e;
  }
}
class j extends H {
  activeEffects = [];
  needsEffectsRepaint = !1;
  constructor(e) {
    super(e);
  }
  updateContainer(e, t) {
    (this.needsEffectsRepaint || t.needsRepaint) && (this.repaintContainer(e, t), t.needsRepaint = !1);
  }
  /**
   * Override setItems to also accept active effects
   */
  setItems(e, t = []) {
    this.activeEffects !== t && (this.needsEffectsRepaint = !0, this.activeEffects = t), super.setItems(e), this.needsEffectsRepaint = !1;
  }
}
class ye extends j {
  pointGraphics = /* @__PURE__ */ new Map();
  constructor(e) {
    super(e);
  }
  getId(e) {
    return e.getId();
  }
  create(e) {
    const t = new I.Container();
    return t.label = e.getId(), this.repaintContainer(t, e), t;
  }
  repaintContainer(e, t) {
    const s = t.getPosition();
    e.position.set(
      s.x * o.BLOCK_SIZE,
      s.y * o.BLOCK_SIZE
    );
    const i = t.getPoints(), n = /* @__PURE__ */ new Set(), r = this.getObstacleColor();
    for (const l of i) {
      const d = `${l.point.x},${l.point.y}`;
      n.add(d);
      let g = this.pointGraphics.get(d);
      g || (g = this.createObstacleGraphics(), g.name = d, this.pointGraphics.set(d, g), e.addChild(g)), g.position && g.position.set(
        l.point.x * o.BLOCK_SIZE,
        l.point.y * o.BLOCK_SIZE
      ), g.tint = r;
    }
    const a = [];
    for (const l of e.children)
      if (l instanceof I.Graphics) {
        const d = l.name;
        n.has(d) || (a.push(d), e.removeChild(l));
      }
    for (const l of a)
      this.pointGraphics.get(l) && this.pointGraphics.delete(l);
  }
  createObstacleGraphics() {
    const e = this.createGraphics(), t = o.BLOCK_SIZE;
    return e.rect(0, 0, t, t), e.fill(16777215), e.rect(0, 0, t, t), e.stroke({ color: 0, width: 1 }), e;
  }
  clear() {
    this.pointGraphics.clear(), super.clear();
  }
  remove(e) {
    super.remove(e);
    for (const [t, s] of this.pointGraphics)
      s.parent?.label === e && this.pointGraphics.delete(t);
  }
  getObstacleColor() {
    return this.activeEffects.find(
      (t) => t.type === y.DARKNESS
    ) ? 657930 : v.OBSTACLE;
  }
}
class Ee extends H {
  constructor(e) {
    super(e);
  }
  getId(e) {
    return `${e.getId()}_render`;
  }
  create(e) {
    const t = e.getPosition(), s = this.createStandardContainer(
      t.x * o.BLOCK_SIZE,
      t.y * o.BLOCK_SIZE,
      void 0,
      this.createPotionGraphics()
    );
    return s.name = `powerup_${t.x}_${t.y}`, s;
  }
  repaintContainer(e, t) {
    const s = t.getPosition();
    e.position.set(
      s.x * o.BLOCK_SIZE,
      s.y * o.BLOCK_SIZE
    );
  }
  createPotionGraphics() {
    const e = this.createGraphics(), t = o.BLOCK_SIZE, s = t * 1.6, i = t * 1.8, n = t / 2, r = t / 2, a = s * 0.8, l = i * 0.7, d = n - a / 2, g = r - l / 2 + i * 0.1;
    e.roundRect(d, g, a, l, 4), e.fill(v.POWER_UP), e.roundRect(d, g, a, l, 4), e.stroke({ color: 0, width: 2 });
    const f = a * 0.4, S = i * 0.2, u = n - f / 2, c = g - S;
    e.roundRect(u, c, f, S, 2), e.fill(v.POWER_UP), e.roundRect(u, c, f, S, 2), e.stroke({ color: 0, width: 2 });
    const w = f * 1.2, O = i * 0.15, k = n - w / 2, U = c - O;
    e.roundRect(k, U, w, O, 3), e.fill(9127187), e.roundRect(k, U, w, O, 3), e.stroke({ color: 0, width: 1 });
    const W = a * 0.6, F = l * 0.5, Y = n - W / 2, V = g + l * 0.2;
    return e.roundRect(Y, V, W, F, 2), e.fill(16766720), e.roundRect(Y, V, W, F, 2), e.stroke({ color: 0, width: 1 }), e;
  }
}
class ve extends j {
  constructor(e) {
    super(e);
  }
  getId(e) {
    const t = e.getSpawnTick() || Date.now();
    return `preview_${e.getId()}_${t}`;
  }
  create(e) {
    const t = new I.Container();
    return t.name = `preview_${e.getId()}`, this.updatePreviewObstacleGraphics(t, e), t;
  }
  repaintContainer(e, t) {
    e.removeChildren(), this.updatePreviewObstacleGraphics(e, t);
  }
  updatePreviewObstacleGraphics(e, t) {
    const s = t.getPoints();
    for (let i = 0; i < s.length; i++) {
      const n = s[i], r = this.createPreviewObstacleGraphics(t);
      r.position.set(
        n.point.x * o.BLOCK_SIZE,
        n.point.y * o.BLOCK_SIZE
      ), r.name = `preview_point_${i}`, e.addChild(r);
    }
  }
  createPreviewObstacleGraphics(e) {
    const t = this.createGraphics(), s = o.BLOCK_SIZE;
    return t.rect(0, 0, s, s), t.fill(this.getPreviewObstacleColor()), e.isFlashingActive() ? (t.rect(0, 0, s, s), t.stroke({ color: 16777215, width: 2 })) : (t.rect(0, 0, s, s), t.stroke({ color: 0, width: 1 })), t;
  }
  getPreviewObstacleColor() {
    return this.activeEffects.find(
      (t) => t.type === y.DARKNESS
    ) ? 657930 : v.OBSTACLE;
  }
}
class Ie extends j {
  constructor(e) {
    super(e);
  }
  getId(e) {
    return e.getId();
  }
  create(e) {
    const t = new I.Container();
    return t.name = e.getId(), this.updateSnakeSegments(t, e), t;
  }
  repaintContainer(e, t) {
    this.updateSnakeSegments(e, t);
  }
  updateSnakeSegments(e, t) {
    e.removeChildren();
    const s = t.getPositions();
    s.forEach((i, n) => {
      let r;
      n === 0 ? r = R.SNAKE_HEAD : n === s.length - 1 ? r = R.SNAKE_TAIL : r = R.SNAKE_BODY;
      const a = this.createSnakeSegment(i, r);
      e.addChild(a);
    });
  }
  createSnakeSegment(e, t) {
    const s = this.createGraphics(), i = o.BLOCK_SIZE, n = e.x * i, r = e.y * i;
    let a, l = !1;
    const d = this.activeEffects.find(
      (c) => c.type === y.INVINCIBLE && c.isHelpful
    ), g = this.activeEffects.find(
      (c) => c.type === y.INVERTED_CONTROLS && !c.isHelpful
    ), f = this.activeEffects.find(
      (c) => c.type === y.SLOW_DOWN && c.isHelpful
    ), S = Date.now(), u = 3e3;
    if (d) {
      const c = d.duration - (S - d.startTime);
      c <= u && c > 0 && (l = !0), a = v.SNAKE_INVINCIBLE;
    } else if (g) {
      const c = g.duration - (S - g.startTime);
      c <= u && c > 0 && (l = !0), a = v.SNAKE_INVERTED;
    } else if (f) {
      const c = f.duration - (S - f.startTime);
      c <= u && c > 0 && (l = !0), a = v.SNAKE_SLOW;
    } else
      switch (t) {
        case R.SNAKE_HEAD:
          a = v.SNAKE_HEAD;
          break;
        case R.SNAKE_BODY:
          a = v.SNAKE_BODY;
          break;
        case R.SNAKE_TAIL:
          a = v.SNAKE_TAIL;
          break;
        default:
          a = v.SNAKE_BODY;
      }
    if (l && Math.floor(S / 200) % 2 === 0)
      switch (t) {
        case R.SNAKE_HEAD:
          a = v.SNAKE_HEAD;
          break;
        case R.SNAKE_BODY:
          a = v.SNAKE_BODY;
          break;
        case R.SNAKE_TAIL:
          a = v.SNAKE_TAIL;
          break;
      }
    return s.rect(n, r, i, i), s.fill(a), s.rect(n, r, i, i), s.stroke({ color: 0, width: 1 }), s;
  }
}
class Ce {
  container;
  startInstructionContainer;
  constructor(e) {
    this.container = e;
  }
  /**
   * Show the start instruction text
   */
  showStartInstruction() {
    if (this.startInstructionContainer) {
      this.startInstructionContainer.visible = !0;
      return;
    }
    this.startInstructionContainer = this.createStartInstructionGraphics(), this.container.addChild(this.startInstructionContainer);
  }
  /**
   * Hide the start instruction text
   */
  hideStartInstruction() {
    this.startInstructionContainer && (this.startInstructionContainer.visible = !1);
  }
  /**
   * Rerender UI elements (called by the main renderer)
   */
  rerender() {
  }
  /**
   * Destroy the UI renderer and clean up resources
   */
  destroy() {
    this.startInstructionContainer && (this.container.removeChild(this.startInstructionContainer), this.startInstructionContainer.destroy({ children: !0 }), this.startInstructionContainer = void 0);
  }
  createStartInstructionGraphics() {
    const e = new I.Container(), t = new I.Text("Press any direction to start", {
      fontFamily: "Arial",
      fontSize: 18,
      fill: 16777215,
      // White text
      align: "center"
    }), s = new I.Text(
      "Desktop: Arrow keys or WASD | Mobile: D-Pad",
      {
        fontFamily: "Arial",
        fontSize: 12,
        fill: 16777215,
        // White text
        align: "center"
      }
    );
    return t.x = o.ARENA_SIZE * o.BLOCK_SIZE / 2 - t.width / 2, t.y = 20, s.x = o.ARENA_SIZE * o.BLOCK_SIZE / 2 - s.width / 2, s.y = t.y + t.height + 10, e.addChild(t), e.addChild(s), e;
  }
}
class ee extends ie {
  showSpinOverlay = !1;
  events = {
    canvasClick: () => {
    },
    directionChange: () => {
    }
  };
  // Specialized renderers
  gridRenderer;
  snakeRenderer;
  consumableRenderer;
  powerUpRenderer;
  obstacleRenderer;
  previewObstacleRenderer;
  uiRenderer;
  jackpotDiamondRenderer;
  constructor(e) {
    super(e);
  }
  static async createWithGameEngine(e, t, s) {
    const i = {
      width: s.x,
      height: s.y,
      worldWidth: o.ARENA_SIZE * o.BLOCK_SIZE,
      worldHeight: o.ARENA_SIZE * o.BLOCK_SIZE,
      backgroundColor: v.BACKGROUND,
      resolution: window.devicePixelRatio || 1,
      antialias: !1,
      minZoom: 0.5,
      maxZoom: 2,
      initialZoom: 1,
      enableDrag: !1,
      enablePinch: !1,
      enableWheel: !1,
      enableDecelerate: !1,
      scaleWithResize: !1
    }, n = await super.create.call(
      ee,
      e,
      i
    );
    return n.setGameEngine(t), n;
  }
  setGameEngine(e) {
    super.setGameEngine(e), e.on(Q.LEVEL_CHANGE, () => {
      this.obstacleRenderer.clear();
    });
  }
  async initialize(e) {
    await super.initialize(e);
  }
  initializeGameLayers() {
    const e = new I.Container();
    this.getGameContainer().addChild(e);
    const t = new I.Container();
    this.getGameContainer().addChild(t);
    const s = new I.Container();
    this.getGameContainer().addChild(s);
    const i = new I.Container();
    this.getGameContainer().addChild(i);
    const n = new I.Container();
    this.getGameContainer().addChild(n);
    const r = new I.Container();
    this.getGameContainer().addChild(r), this.gridRenderer = new we(e), this.obstacleRenderer = new ye(t), this.previewObstacleRenderer = new ve(t), this.consumableRenderer = new me(s), this.powerUpRenderer = new Ee(i), this.snakeRenderer = new Ie(n), this.uiRenderer = new Ce(r), this.jackpotDiamondRenderer = new Se(s), this.gridRenderer.renderGrid();
  }
  render(e) {
    this.gameEngine && this.updateGameRenderers();
  }
  setupEventListeners() {
    super.setupEventListeners(), this.container && (this.container.addEventListener("click", this.handleSnakeClick), this.container.addEventListener("touchend", this.handleSnakeClick));
  }
  handleSnakeClick = (e) => {
    const t = this.container;
    if (!t) return;
    const s = t.getBoundingClientRect();
    let i, n;
    if (e instanceof TouchEvent) {
      e.preventDefault();
      const l = e.changedTouches[0];
      i = l.clientX, n = l.clientY;
    } else
      i = e.clientX, n = e.clientY;
    const r = Math.floor((i - s.left) / o.BLOCK_SIZE), a = Math.floor((n - s.top) / o.BLOCK_SIZE);
    this.events.canvasClick(new h(r, a));
  };
  updateGameRenderers() {
    if (this.showSpinOverlay) {
      this.clearAllRenderers();
      return;
    }
    const e = this.gameEngine;
    this.obstacleRenderer.setItems(
      e.getObstacles().getAllActive(),
      e.getActiveEffects()
    ), this.previewObstacleRenderer.setItems(
      e.getPreviewObstacles().getAllActive(),
      e.getActiveEffects()
    ), this.consumableRenderer.setItems(e.getConsumables().getAllActive()), this.jackpotDiamondRenderer.setItems(
      e.getJackpotDiamonds().getAllActive()
    ), this.powerUpRenderer.setItems(e.getPowerUps().getAllActive()), this.snakeRenderer.setItems(
      [e.getSnake()],
      e.getActiveEffects()
    ), !e.isGameRunning() && !e.isGameOver() ? this.uiRenderer.showStartInstruction() : this.uiRenderer.hideStartInstruction();
  }
  clearAllRenderers() {
    this.obstacleRenderer.clear(), this.previewObstacleRenderer.clear(), this.consumableRenderer.clear(), this.jackpotDiamondRenderer.clear(), this.powerUpRenderer.clear(), this.snakeRenderer.clear(), this.uiRenderer.hideStartInstruction();
  }
  reset() {
    this.clearAllRenderers();
  }
  setShowSpinOverlay(e) {
    this.showSpinOverlay = e;
  }
  onCanvasClick(e) {
    this.events.canvasClick = e;
  }
  onDirectionChange(e) {
    this.events.directionChange = e;
  }
  destroy() {
    const e = this.container;
    e && (e.removeEventListener("click", this.handleSnakeClick), e.removeEventListener("touchend", this.handleSnakeClick)), this.clearAllRenderers(), super.destroy();
  }
}
const Te = "1.0.2", Pe = {
  version: Te
};
function Ae() {
  return Pe.version;
}
export {
  ee as GameCanvas,
  Oe as GameEngine,
  Ae as getVersion
};
//# sourceMappingURL=game.js.map
