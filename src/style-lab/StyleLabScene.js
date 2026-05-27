import Phaser from 'phaser';
import {
    GRANDMA_ROCKING_SHEET,
    MOMO_SHEETS,
    PLAYER_SHEETS,
    TILE,
    TILE_KEYS,
    TOOL_SHEETS,
    WORLD_OBJECT_KEYS
} from './styleLabAssets';
import {
    canPlaceNaturalObject,
    createFarmCells,
    createPathCells,
    FLOWER_CLUSTER_OFFSETS,
    FLORA_POOL,
    FLORA_SPOTS,
    GROUND_DETAIL_SPOTS,
    isWaterCell,
    LANDMARK_PROPS,
    LANDMARKS,
    MAP_COLS,
    MAP_ROWS,
    pickGrassTile,
    TREE_POOL,
    TREE_SPOTS
} from './styleLabLayout';

export default class StyleLabScene extends Phaser.Scene {
    constructor() {
        super('StyleLabScene');
        this.mapCols = MAP_COLS;
        this.mapRows = MAP_ROWS;
        this.lastNatureKeys = [];
        this.playerDirection = 'down';
        this.playerIdleMs = 0;
        this.playerIsMoving = false;
        this.lastPlayerMoveAt = 0;
        this.currentTool = 1;
        this.isActing = false;
    }

    preload() {
        const describeLoaderSet = (files) => {
            if (!files) return '';
            const values = typeof files.values === 'function' ? [...files.values()] : Object.values(files.entries ?? files);
            return values
                .map((file) => `${file.key}:${file.state}`)
                .join(',');
        };
        const loaderDebugTimer = window.setInterval(() => {
            document.body.dataset.styleLabLoaderState = String(this.load.state);
            document.body.dataset.styleLabLoaderMax = String(this.load.maxParallelDownloads);
            document.body.dataset.styleLabQueued = describeLoaderSet(this.load.list);
            document.body.dataset.styleLabInflight = describeLoaderSet(this.load.inflight);
            document.body.dataset.styleLabPending = describeLoaderSet(this.load.queue);
        }, 500);
        this.load.on('progress', (progress) => {
            document.body.dataset.styleLabLoadProgress = progress.toFixed(2);
        });
        this.load.on('loaderror', (file) => {
            document.body.dataset.styleLabLoadError = file?.src ?? file?.key ?? 'unknown';
        });
        this.load.on('filecomplete', (key) => {
            document.body.dataset.styleLabLastLoaded = key;
        });
        this.load.on('complete', () => {
            document.body.dataset.styleLabLoadComplete = 'true';
            window.clearInterval(loaderDebugTimer);
        });
        TILE_KEYS.forEach(([key, path]) => this.load.image(key, path));
        WORLD_OBJECT_KEYS.forEach(([key, path]) => this.load.image(key, path));
        PLAYER_SHEETS.forEach((sheet) => this.load.spritesheet(sheet.key, sheet.path, {
            frameWidth: sheet.frameWidth,
            frameHeight: sheet.frameHeight
        }));
        MOMO_SHEETS.forEach((sheet) => this.load.spritesheet(sheet.key, sheet.path, {
            frameWidth: 160,
            frameHeight: 160
        }));
        TOOL_SHEETS.forEach((sheet) => this.load.spritesheet(sheet.key, sheet.path, {
            frameWidth: sheet.frameWidth,
            frameHeight: sheet.frameHeight
        }));
        this.load.spritesheet(GRANDMA_ROCKING_SHEET.key, GRANDMA_ROCKING_SHEET.path, {
            frameWidth: GRANDMA_ROCKING_SHEET.frameWidth,
            frameHeight: GRANDMA_ROCKING_SHEET.frameHeight
        });
    }

    create(data = {}) {
        this.createAnimations();
        this.blockers = this.physics.add.staticGroup();
        this.groundTiles = new Map();
        this.farmStates = new Map();
        this.waterTiles = [];
        this.buildGround();
        this.placeLandmarks();
        this.placeNature();
        this.createCharacters(data);
        this.setupCamera();
        this.events.on('resume', () => this.onResumeFromInterior());
        this.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => this.publishDebugState()
        });
        this.publishDebugState();
    }

    createAnimations() {
        const animations = [
            ...PLAYER_SHEETS.map((sheet) => ({
                anim: sheet.anim,
                key: sheet.key,
                frameRate: sheet.frameRate
            })),
            ...MOMO_SHEETS.map((sheet) => ({
                anim: sheet.anim,
                key: sheet.key,
                frameRate: sheet.frameRate
            })),
            ...TOOL_SHEETS.map((sheet) => ({
                anim: sheet.anim,
                key: sheet.key,
                frameRate: sheet.frameRate,
                frames: sheet.frames,
                repeat: 0
            })),
            {
                anim: GRANDMA_ROCKING_SHEET.anim,
                key: GRANDMA_ROCKING_SHEET.key,
                frameRate: GRANDMA_ROCKING_SHEET.frameRate
            }
        ];

        animations.forEach(({ anim, key, frameRate, repeat = -1, frames = 4 }) => {
            if (this.anims.exists(anim)) this.anims.remove(anim);
            this.anims.create({
                key: anim,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }),
                frameRate,
                repeat
            });
        });
    }

    buildGround() {
        const farm = createFarmCells();
        const path = createPathCells();

        for (let y = 0; y < this.mapRows; y += 1) {
            for (let x = 0; x < this.mapCols; x += 1) {
                const px = x * TILE;
                const py = y * TILE;
                const key = `${x},${y}`;
                let tile = pickGrassTile(x, y);

                if (isWaterCell(x, y)) tile = 'tile_water_1';
                else if (farm.has(key)) tile = (x + y) % 2 === 0 ? 'tile_dirt_a' : 'tile_dirt_b';
                else if (path.has(key)) tile = (x + y) % 2 === 0 ? 'tile_path_a' : 'tile_path_b';
                else if ((x === 15 || x === 16) && y >= 17 && y <= 19) tile = 'tile_dirt_a';

                const ground = this.add.image(px, py, tile).setOrigin(0, 0).setDepth(0);
                this.groundTiles.set(key, ground);
                if (farm.has(key)) {
                    this.farmStates.set(key, { state: 'normal', crop: null, marker: null });
                }
                if (tile === 'tile_water_1') {
                    this.waterTiles.push(ground);
                    this.addBlocker(px + 32, py + 32, 64, 64);
                }
            }
        }

        this.time.addEvent({
            delay: 600,
            loop: true,
            callback: () => {
                this.waterTiles.forEach((tile) => {
                    tile.setTexture(tile.texture.key === 'tile_water_1' ? 'tile_water_2' : 'tile_water_1');
                });
            }
        });
    }

    placeLandmarks() {
        this.cottageDoorZone = new Phaser.Geom.Rectangle(
            LANDMARKS.cottageDoor.x - 48,
            LANDMARKS.cottageDoor.y - 82,
            96,
            108
        );
        this.addObject(LANDMARKS.cottage.x, LANDMARKS.cottage.y, 'obj_cottage', 1, {
            shadow: [240, 50],
            block: [260, 42, 0, -18]
        });

        this.heartTreePoint = new Phaser.Math.Vector2(LANDMARKS.heartTree.x, LANDMARKS.heartTree.y);
        this.addObject(LANDMARKS.heartTree.x, LANDMARKS.heartTree.y, 'obj_heart_tree', 1, {
            shadow: [128, 38],
            block: [96, 52, 0, -16]
        });

        LANDMARK_PROPS.forEach((prop) => this.addObject(prop.x, prop.y, prop.key, prop.scale, {
            block: prop.block
        }));
    }

    placeNature() {
        const farm = createFarmCells();
        const path = createPathCells();
        TREE_SPOTS.forEach(([x, y], index) => {
            if (!canPlaceNaturalObject(x, y, { farm, path, avoidWaterBuffer: true })) return;
            const key = TREE_POOL[index % TREE_POOL.length];
            const scale = key === 'obj_tree_shrub' ? 0.95 : 1;
            this.addObject(x * TILE + 32, y * TILE + 56, key, scale, {
                shadow: [112, 34],
                block: [78, 46, 0, -18],
                flip: index % 3 === 0
            });
        });

        FLORA_SPOTS.forEach(([x, y], index) => {
            if (!canPlaceNaturalObject(x, y, { farm, path, avoidDoor: true })) return;
            const key = FLORA_POOL[index % FLORA_POOL.length];
            const [ox, oy] = FLOWER_CLUSTER_OFFSETS[index % FLOWER_CLUSTER_OFFSETS.length];
            this.addObject(x * TILE + 24 + ox, y * TILE + 34 + oy, key, 0.72 + (index % 2) * 0.08);
        });

        GROUND_DETAIL_SPOTS.forEach(([x, y], index) => {
            if (!canPlaceNaturalObject(x, y, { farm, path, avoidWaterBuffer: index % 2 === 1 })) return;
            const key = index % 2 ? 'prop_rock' : 'fol_stone_edge_grass';
            this.addObject(x * TILE + 32, y * TILE + 46, key, 0.86, {
                shadow: [54, 18],
                block: key === 'prop_rock' ? [58, 34, 0, -14] : [96, 28, 0, -14]
            });
        });
    }

    createCharacters(data = {}) {
        this.grandma = this.physics.add.sprite(LANDMARKS.grandma.x, LANDMARKS.grandma.y, GRANDMA_ROCKING_SHEET.key)
            .setOrigin(0.5, 0.94)
            .setScale(0.42)
            .setDepth(LANDMARKS.grandma.y);
        this.grandma.play(GRANDMA_ROCKING_SHEET.anim);
        this.grandma.body.setImmovable(true);
        this.grandma.body.setSize(92, 42);
        this.grandma.body.setOffset(74, 254);
        this.addShadow(this.grandma.x, this.grandma.y + 2, 88, 22, this.grandma.depth - 1);
        this.physics.add.collider(this.grandma, this.blockers);

        this.grandmaPoint = new Phaser.Math.Vector2(this.grandma.x, this.grandma.y);

        const spawn = data.spawn ?? LANDMARKS.playerSpawn;
        this.player = this.physics.add.sprite(spawn.x, spawn.y, 'lab_player_down')
            .setOrigin(0.5, 0.92)
            .setScale(0.27)
            .setDepth(1000);
        this.setPlayerBody('down');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.blockers);
        this.physics.add.collider(this.player, this.grandma);

        this.playerAction = this.add.sprite(this.player.x, this.player.y, 'lab_tool_hoe')
            .setOrigin(0.5, 0.92)
            .setScale(0.27)
            .setDepth(this.player.depth + 1)
            .setVisible(false);

        this.momoShadow = this.addShadow(this.player.x - 64, this.player.y + 42, 48, 12, this.player.depth - 2)
            .setAlpha(0.45);
        this.momo = this.add.sprite(this.player.x - 64, this.player.y + 34, 'lab_momo_active')
            .setOrigin(0.5, 0.86)
            .setScale(0.66)
            .setDepth(this.player.depth - 1);
        this.momo.play('lab_momo_run');
        this.momoState = 'lab_momo_run';

        this.momoAnchor = new Phaser.Math.Vector2(this.momo.x, this.momo.y);
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
        this.keyOne = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.keyTwo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.keyThree = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    setupCamera() {
        const width = this.mapCols * TILE;
        const height = this.mapRows * TILE;
        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setZoom(1);
    }

    update(_, delta) {
        this.updateToolSelection();
        this.updateInteractions();
        if (this.isActing) {
            this.player.setVelocity(0, 0);
            this.updateMomo(delta);
            return;
        }
        this.updatePlayer(delta);
        this.updateMomo(delta);
    }

    updateToolSelection() {
        if (Phaser.Input.Keyboard.JustDown(this.keyOne)) this.currentTool = 1;
        if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) this.currentTool = 2;
        if (Phaser.Input.Keyboard.JustDown(this.keyThree)) this.currentTool = 3;
    }

    updateInteractions() {
        if (!this.player || this.isActing) return;
        if (Phaser.Input.Keyboard.JustDown(this.keyEnter) && Phaser.Geom.Rectangle.Contains(this.cottageDoorZone, this.player.x, this.player.y)) {
            this.enterCottage();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.handleFarmInteract();
        }
    }

    enterCottage() {
        this.isActing = true;
        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        this.cameras.main.fadeOut(220, 20, 16, 12);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.pause();
            this.scene.launch('StyleLabInteriorScene', {
                returnScene: this.scene.key
            });
        });
    }

    onResumeFromInterior() {
        this.isActing = false;
        this.player.setVelocity(0, 0);
        this.player.visible = true;
        this.playerAction.setVisible(false);
        this.player.setPosition(LANDMARKS.cottageDoor.x, LANDMARKS.cottageDoor.y + 44);
        this.momoAnchor.set(this.player.x - 58, this.player.y + 34);
        this.cameras.main.fadeIn(220, 20, 16, 12);
        [this.keyEnter, this.keySpace, this.keys.E].forEach((key) => key?.reset?.());
    }

    handleFarmInteract() {
        const target = this.getFacingTile();
        const key = `${target.x},${target.y}`;
        const farm = this.farmStates.get(key);
        if (!farm) {
            this.playRejectFeedback();
            return;
        }

        let nextState = null;
        if (this.currentTool === 1 && farm.state === 'normal') nextState = 'tilled';
        else if (this.currentTool === 2 && farm.state === 'tilled') nextState = 'watered';
        else if (this.currentTool === 3 && (farm.state === 'tilled' || farm.state === 'watered') && !farm.crop) nextState = 'seeded';

        if (!nextState) {
            this.playRejectFeedback();
            return;
        }

        this.playToolAction(this.currentTool, () => {
            if (nextState === 'seeded') farm.crop = 'sprout';
            else farm.state = nextState;
            this.refreshFarmTile(target.x, target.y, farm);
        });
    }

    getFacingTile() {
        let x = Math.floor(this.player.x / TILE);
        let y = Math.floor(this.player.y / TILE);
        if (this.playerDirection === 'up') y -= 1;
        else if (this.playerDirection === 'down') y += 1;
        else if (this.playerDirection === 'left') x -= 1;
        else if (this.playerDirection === 'right') x += 1;
        return { x, y };
    }

    playToolAction(tool, onImpact) {
        const sheet = TOOL_SHEETS[tool - 1];
        this.isActing = true;
        this.player.setVelocity(0, 0);
        this.player.visible = false;
        this.playerAction
            .setTexture(sheet.key)
            .setPosition(this.player.x, this.player.y)
            .setDepth(this.player.y + 30)
            .setFlipX(this.playerDirection === 'left')
            .setVisible(true);
        this.playerAction.play(sheet.anim);

        this.time.delayedCall(360, () => {
            if (tool === 1) this.emitActionParticles(0xc49a6c, 4);
            if (tool === 2) this.emitActionParticles(0x8fd9ff, 7);
            if (tool === 3) this.emitActionParticles(0xffd77a, 5);
            onImpact();
        });
        this.time.delayedCall(860, () => {
            this.player.visible = true;
            this.playerAction.setVisible(false);
            this.isActing = false;
        });
    }

    emitActionParticles(color, count) {
        const target = this.getFacingTile();
        const emitter = this.add.particles(target.x * TILE + 32, target.y * TILE + 32, '__WHITE', {
            tint: color,
            speed: { min: 24, max: 58 },
            angle: { min: 220, max: 330 },
            gravityY: 240,
            scale: { start: 1.8, end: 0 },
            lifespan: 360,
            quantity: count,
            maxParticles: count
        });
        emitter.setDepth(2200);
        this.time.delayedCall(700, () => emitter.destroy());
    }

    playRejectFeedback() {
        this.tweens.add({
            targets: this.player,
            x: this.player.x + (this.playerDirection === 'left' ? 4 : this.playerDirection === 'right' ? -4 : 0),
            y: this.player.y + (this.playerDirection === 'up' ? 4 : this.playerDirection === 'down' ? -4 : 0),
            duration: 60,
            yoyo: true,
            repeat: 1
        });
    }

    refreshFarmTile(x, y, farm) {
        const key = `${x},${y}`;
        const ground = this.groundTiles.get(key);
        if (!ground) return;
        ground.clearTint();
        if (farm.state === 'normal') ground.setTexture((x + y) % 2 === 0 ? 'tile_dirt_a' : 'tile_dirt_b');
        if (farm.state === 'tilled') ground.setTexture((x + y) % 2 === 0 ? 'tile_tilled_a' : 'tile_tilled_b');
        if (farm.state === 'watered') {
            ground.setTexture((x + y) % 2 === 0 ? 'tile_tilled_wet_a' : 'tile_tilled_wet_b');
        }

        if (farm.marker) {
            farm.marker.destroy();
            farm.marker = null;
        }
        if (farm.crop === 'sprout') {
            farm.marker = this.add.group([
                this.add.ellipse(x * TILE + 32, y * TILE + 34, 8, 13, 0x5ba85b).setDepth(4),
                this.add.ellipse(x * TILE + 38, y * TILE + 31, 6, 10, 0x7fcf63).setDepth(4),
                this.add.ellipse(x * TILE + 26, y * TILE + 31, 6, 10, 0x7fcf63).setDepth(4)
            ]);
        }
        this.farmStates.set(key, farm);
    }

    updatePlayer(delta) {
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up = this.cursors.up.isDown || this.keys.W.isDown;
        const down = this.cursors.down.isDown || this.keys.S.isDown;
        const vx = (right ? 1 : 0) - (left ? 1 : 0);
        const vy = (down ? 1 : 0) - (up ? 1 : 0);
        const speed = 210;

        this.playerIsMoving = Boolean(vx || vy);

        if (this.playerIsMoving) {
            this.playerIdleMs = 0;
            this.lastPlayerMoveAt = this.time.now;
            const len = Math.hypot(vx, vy) || 1;
            this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
            const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
            const animKey = `lab_walk_${dir}`;
            if (this.player.anims.currentAnim?.key !== animKey) {
                this.player.play(animKey);
                this.setPlayerBody(dir);
            }
        } else {
            this.playerIdleMs += delta;
            this.player.setVelocity(0, 0);
            this.player.anims.stop();
            this.player.setFrame(0);
        }
        this.player.setDepth(this.player.y + 24);
    }

    setPlayerBody(direction) {
        this.playerDirection = direction;
        const footprints = {
            down: [84, 88, 91, 318],
            up: [82, 80, 75, 288],
            left: [86, 84, 82, 336],
            right: [86, 84, 83, 336]
        };
        const [width, height, offsetX, offsetY] = footprints[direction] ?? footprints.down;
        this.player.body.setSize(width, height);
        this.player.body.setOffset(offsetX, offsetY);
    }

    updateMomo(delta) {
        if (!this.momo || !this.player) return;
        const side = this.player.body.velocity.x > 10 ? -1 : this.player.body.velocity.x < -10 ? 1 : -1;
        const targetX = this.player.x + side * 58;
        const targetY = this.player.y + 34;
        const lerp = 1 - Math.pow(0.0015, delta / 1000);
        this.momoAnchor.x += (targetX - this.momoAnchor.x) * lerp;
        this.momoAnchor.y += (targetY - this.momoAnchor.y) * lerp;
        const stepHop = this.playerIsMoving ? Math.max(0, Math.sin(this.time.now / 95)) * -2 : 0;
        this.momo.x = this.momoAnchor.x;
        this.momo.y = this.momoAnchor.y + stepHop;
        this.momo.setFlipX(this.momo.x > this.player.x);
        this.momo.setDepth(this.momo.y + 12);
        this.momoShadow
            .setPosition(this.momoAnchor.x, this.momoAnchor.y + 15)
            .setDepth(this.momo.depth - 1)
            .setAlpha(this.playerIsMoving ? 0.38 : 0.5);
        this.updateMomoAnimation();
    }

    updateMomoAnimation() {
        const distanceToGrandma = this.grandmaPoint
            ? Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandmaPoint.x, this.grandmaPoint.y)
            : Infinity;
        const distanceToHeartTree = this.heartTreePoint
            ? Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heartTreePoint.x, this.heartTreePoint.y)
            : Infinity;
        let nextState = 'lab_momo_silent';
        const recentlyMoved = this.time.now - this.lastPlayerMoveAt < 650;

        if (distanceToHeartTree < 190) nextState = 'lab_momo_breath';
        else if (distanceToGrandma < 210) nextState = 'lab_momo_hug';
        else if (this.playerIsMoving || recentlyMoved) nextState = 'lab_momo_run';
        else if (this.playerIdleMs > 10000) nextState = 'lab_momo_curled';
        else if (this.playerIdleMs > 4500) nextState = 'lab_momo_sleepy';

        if (this.momoState !== nextState) {
            this.momoState = nextState;
            this.momo.play(nextState);
        }
    }

    addObject(x, y, key, scale = 1, options = {}) {
        if (options.shadow) this.addShadow(x, y, options.shadow[0] * scale, options.shadow[1] * scale, y - 2);
        const obj = this.add.image(x, y, key)
            .setOrigin(0.5, 1)
            .setScale(scale)
            .setDepth(y);
        if (options.flip) obj.setFlipX(true);
        if (options.block) {
            const [w, h, ox = 0, oy = 0] = options.block;
            this.addBlocker(x + ox, y + oy, w, h);
        }
        return obj;
    }

    addShadow(x, y, w, h, depth) {
        return this.add.image(x, y, 'soft_shadow')
            .setDisplaySize(w, h)
            .setDepth(depth)
            .setAlpha(0.65);
    }

    addBlocker(x, y, w, h) {
        const rect = this.add.rectangle(x, y, w, h, 0xff00ff, 0);
        this.physics.add.existing(rect, true);
        this.blockers.add(rect);
        return rect;
    }

    pickVariant(pool) {
        const available = pool.filter((key) => !(this.lastNatureKeys[0] === key && this.lastNatureKeys[1] === key));
        const key = available[(this.lastNatureKeys.length * 3 + pool.length + Math.floor(Math.random() * available.length)) % available.length];
        this.lastNatureKeys.unshift(key);
        this.lastNatureKeys = this.lastNatureKeys.slice(0, 2);
        return key;
    }

    publishDebugState() {
        if (typeof document === 'undefined' || !document.body || !this.player) return;
        const textureKeys = this.children.list.map((child) => child.texture?.key).filter(Boolean);
        const uniqueTrees = new Set(textureKeys.filter((key) => key.startsWith('obj_tree_')));
        const uniqueFoliage = new Set(textureKeys.filter((key) => key.startsWith('fol_')));
        Object.assign(document.body.dataset, {
            styleLabReady: 'true',
            styleLabPlayerX: Math.round(this.player.x).toString(),
            styleLabPlayerY: Math.round(this.player.y).toString(),
            styleLabMomo: this.momo?.anims?.currentAnim?.key ?? '',
            styleLabMomoState: this.momoState ?? '',
            styleLabGrandma: this.grandma?.anims?.currentAnim?.key ?? '',
            styleLabWaterTiles: (this.waterTiles?.length ?? 0).toString(),
            styleLabBlockers: (this.blockers?.getChildren?.().length ?? 0).toString(),
            styleLabTreeVariants: uniqueTrees.size.toString(),
            styleLabFoliageVariants: uniqueFoliage.size.toString()
        });
    }
}
