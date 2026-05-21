import Phaser from 'phaser';
import {
    GRANDMA_ROCKING_SHEET,
    MOMO_SHEETS,
    PLAYER_SHEETS,
    TILE,
    TILE_KEYS,
    WORLD_OBJECT_KEYS
} from './styleLabAssets';
import {
    createFarmCells,
    createPathCells,
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
    }

    preload() {
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
        this.load.spritesheet(GRANDMA_ROCKING_SHEET.key, GRANDMA_ROCKING_SHEET.path, {
            frameWidth: GRANDMA_ROCKING_SHEET.frameWidth,
            frameHeight: GRANDMA_ROCKING_SHEET.frameHeight
        });
    }

    create() {
        this.createAnimations();
        this.blockers = this.physics.add.staticGroup();
        this.waterTiles = [];
        this.buildGround();
        this.placeLandmarks();
        this.placeNature();
        this.createCharacters();
        this.setupCamera();
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
            {
                anim: GRANDMA_ROCKING_SHEET.anim,
                key: GRANDMA_ROCKING_SHEET.key,
                frameRate: GRANDMA_ROCKING_SHEET.frameRate
            }
        ];

        animations.forEach(({ anim, key, frameRate }) => {
            if (this.anims.exists(anim)) this.anims.remove(anim);
            this.anims.create({
                key: anim,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                frameRate,
                repeat: -1
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
                else if (farm.has(key)) tile = (x + y) % 2 === 0 ? 'tile_tilled_a' : 'tile_tilled_b';
                else if (path.has(key)) tile = (x + y) % 2 === 0 ? 'tile_path_a' : 'tile_path_b';
                else if ((x === 15 || x === 16) && y >= 17 && y <= 19) tile = 'tile_dirt_a';

                const ground = this.add.image(px, py, tile).setOrigin(0, 0).setDepth(0);
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
        this.addObject(LANDMARKS.cottage.x, LANDMARKS.cottage.y, 'obj_cottage', 1, {
            shadow: [240, 50],
            block: [260, 56, 0, -20]
        });

        this.heartTreePoint = new Phaser.Math.Vector2(LANDMARKS.heartTree.x, LANDMARKS.heartTree.y);
        this.addObject(LANDMARKS.heartTree.x, LANDMARKS.heartTree.y, 'obj_heart_tree', 1, {
            shadow: [128, 38],
            block: [96, 52, 0, -16]
        });

        LANDMARK_PROPS.forEach((prop) => this.addObject(prop.x, prop.y, prop.key, prop.scale));
    }

    placeNature() {
        TREE_SPOTS.forEach(([x, y], index) => {
            const key = this.pickVariant(TREE_POOL);
            const scale = key === 'obj_tree_shrub' ? 0.95 : 1;
            this.addObject(x * TILE + 32, y * TILE + 56, key, scale, {
                shadow: [112, 34],
                block: [78, 46, 0, -18],
                flip: index % 3 === 0
            });
        });

        FLORA_SPOTS.forEach(([x, y], index) => {
            const key = this.pickVariant(FLORA_POOL);
            this.addObject(x * TILE + 20 + (index % 3) * 12, y * TILE + 38, key, 0.75 + (index % 2) * 0.1);
        });

        GROUND_DETAIL_SPOTS.forEach(([x, y], index) => {
            this.addObject(x * TILE + 32, y * TILE + 46, index % 2 ? 'prop_rock' : 'fol_stone_edge_grass', 0.86);
        });
    }

    createCharacters() {
        this.grandma = this.physics.add.sprite(LANDMARKS.grandma.x, LANDMARKS.grandma.y, GRANDMA_ROCKING_SHEET.key)
            .setOrigin(0.5, 0.94)
            .setScale(0.72)
            .setDepth(LANDMARKS.grandma.y);
        this.grandma.play(GRANDMA_ROCKING_SHEET.anim);
        this.grandma.body.setImmovable(true);
        this.grandma.body.setSize(128, 48);
        this.grandma.body.setOffset(56, 246);
        this.addShadow(this.grandma.x, this.grandma.y + 2, 142, 30, this.grandma.depth - 1);
        this.physics.add.collider(this.grandma, this.blockers);

        this.grandmaPoint = new Phaser.Math.Vector2(this.grandma.x, this.grandma.y);

        this.player = this.physics.add.sprite(LANDMARKS.playerSpawn.x, LANDMARKS.playerSpawn.y, 'lab_player_down')
            .setOrigin(0.5, 0.92)
            .setScale(0.27)
            .setDepth(1000);
        this.setPlayerBody('down');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.blockers);
        this.physics.add.collider(this.player, this.grandma);

        this.momo = this.add.sprite(this.player.x - 64, this.player.y + 22, 'lab_momo_active')
            .setOrigin(0.5, 0.86)
            .setScale(0.7)
            .setDepth(this.player.depth - 1);
        this.momo.play('lab_momo_run');
        this.momoState = 'lab_momo_run';

        this.momoAnchor = new Phaser.Math.Vector2(this.momo.x, this.momo.y);
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
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
        this.updatePlayer(delta);
        this.updateMomo(delta);
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
        this.momo.x = this.momoAnchor.x;
        this.momo.y = this.momoAnchor.y + Math.sin(this.time.now / 130) * 4;
        this.momo.setFlipX(this.momo.x > this.player.x);
        this.momo.setDepth(this.momo.y + 12);
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
