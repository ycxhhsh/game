import Phaser from 'phaser';
import { INTERIOR_OBJECT_KEYS, INTERIOR_TILE_KEYS, PLAYER_SHEETS, TILE } from './styleLabAssets';

const ROOM_COLS = 15;
const ROOM_ROWS = 12;
const ROOM_WIDTH = ROOM_COLS * TILE;
const ROOM_HEIGHT = ROOM_ROWS * TILE;
const DOOR_COLS = new Set([6, 7, 8]);

const FURNITURE = [
    { key: 'interior_window', x: 7.5, y: 2.62, scale: 0.52, block: [146, 22, 0, -20], wall: true },
    { key: 'interior_stove', x: 2.45, y: 5.0, scale: 0.42, block: [96, 76, 0, -36] },
    { key: 'interior_bed', x: 12.2, y: 5.1, scale: 0.5, block: [112, 86, 0, -42] },
    { key: 'interior_bookshelf', x: 13.45, y: 8.45, scale: 0.45, block: [70, 104, 0, -52] },
    { key: 'interior_rocking_chair', x: 10.05, y: 7.2, scale: 0.48, block: [74, 66, 0, -30] },
    { key: 'interior_tea_table', x: 7.65, y: 8.35, scale: 0.5, block: [116, 58, 0, -26] },
    { key: 'interior_plant', x: 4.65, y: 6.55, scale: 0.35, block: [34, 28, 0, -14] },
    { key: 'interior_door_mat', x: 7.5, y: 11.22, scale: 0.55, block: null, depthOffset: -8 }
];

export default class StyleLabInteriorScene extends Phaser.Scene {
    constructor() {
        super('StyleLabInteriorScene');
    }

    preload() {
        INTERIOR_TILE_KEYS.forEach(([key, path]) => {
            if (!this.textures.exists(key)) this.load.image(key, path);
        });
        INTERIOR_OBJECT_KEYS.forEach(([key, path]) => {
            if (!this.textures.exists(key)) this.load.image(key, path);
        });
        if (!this.textures.exists('soft_shadow')) {
            this.load.image('soft_shadow', 'assets/style-lab/soft_shadow.png');
        }
        PLAYER_SHEETS.forEach((sheet) => {
            if (!this.textures.exists(sheet.key)) {
                this.load.spritesheet(sheet.key, sheet.path, {
                    frameWidth: sheet.frameWidth,
                    frameHeight: sheet.frameHeight
                });
            }
        });
    }

    create(data = {}) {
        this.returnScene = data.returnScene ?? 'StyleLabScene';
        this.createAnimations();
        this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
        this.blockers = this.physics.add.staticGroup();

        this.buildRoomShell();
        this.placeFurniture();
        this.createExitAffordance();
        this.createPlayer();
        this.createControls();

        this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setZoom(1);
        this.cameras.main.fadeIn(180, 20, 16, 12);
        this.isLeaving = false;
        this.publishDebugState();
    }

    createAnimations() {
        PLAYER_SHEETS.forEach((sheet) => {
            if (!this.anims.exists(sheet.anim)) {
                this.anims.create({
                    key: sheet.anim,
                    frames: this.anims.generateFrameNumbers(sheet.key, { start: 0, end: 3 }),
                    frameRate: sheet.frameRate,
                    repeat: -1
                });
            }
        });
    }

    buildRoomShell() {
        for (let y = 0; y < ROOM_ROWS; y += 1) {
            for (let x = 0; x < ROOM_COLS; x += 1) {
                const px = x * TILE;
                const py = y * TILE;
                const isBackWall = y < 3;
                const isSideReturn = x === 0 || x === ROOM_COLS - 1;
                const isFrontRail = y === ROOM_ROWS - 1 && !DOOR_COLS.has(x);
                let key = (x + y) % 2 === 0 ? 'interior_floor_a' : 'interior_floor_b';

                if (isBackWall) key = isSideReturn ? 'interior_wall_side' : 'interior_wall';
                else if (isSideReturn || isFrontRail) key = 'interior_wall_side';

                this.add.image(px, py, key).setOrigin(0, 0).setDepth(isBackWall ? 10 : 0);
            }
        }

        this.add.rectangle(ROOM_WIDTH / 2, 174, ROOM_WIDTH - 92, 14, 0x5b341f, 0.9).setDepth(22);
        this.add.rectangle(ROOM_WIDTH / 2, ROOM_HEIGHT - 98, ROOM_WIDTH - 380, 14, 0x5b341f, 0.82).setDepth(520);
        this.add.rectangle(TILE / 2, ROOM_HEIGHT / 2, 22, ROOM_HEIGHT, 0x2a1b14, 0.38).setDepth(510);
        this.add.rectangle(ROOM_WIDTH - TILE / 2, ROOM_HEIGHT / 2, 22, ROOM_HEIGHT, 0x2a1b14, 0.38).setDepth(510);

        this.addBlocker(ROOM_WIDTH / 2, 92, ROOM_WIDTH, 180);
        this.addBlocker(34, ROOM_HEIGHT / 2, 68, ROOM_HEIGHT);
        this.addBlocker(ROOM_WIDTH - 34, ROOM_HEIGHT / 2, 68, ROOM_HEIGHT);
        this.addBlocker(172, ROOM_HEIGHT - 36, 344, 72);
        this.addBlocker(ROOM_WIDTH - 172, ROOM_HEIGHT - 36, 344, 72);
    }

    placeFurniture() {
        FURNITURE.forEach((item) => {
            const x = item.x * TILE;
            const y = item.y * TILE;
            if (!item.wall) this.addShadow(x, y + 4, 92 * item.scale, 22 * item.scale, y - 3);
            const sprite = this.add.image(x, y, item.key)
                .setOrigin(0.5, 1)
                .setScale(item.scale)
                .setDepth(y + (item.depthOffset ?? 0));

            if (item.block) {
                const [w, h, ox = 0, oy = 0] = item.block;
                this.addBlocker(x + ox, y + oy, w, h);
            }
            return sprite;
        });
    }

    createExitAffordance() {
        this.exitZone = new Phaser.Geom.Rectangle(6 * TILE, 9.9 * TILE, 3 * TILE, 2.1 * TILE);
        this.add.rectangle(7.5 * TILE, 10.75 * TILE, 210, 76, 0xf4c76e, 0.16).setDepth(498);
        this.add.rectangle(7.5 * TILE, 11 * TILE + 2, 190, 16, 0xffdf8a, 0.32).setDepth(499);
        this.exitHint = this.add.circle(7.5 * TILE, 10.45 * TILE, 8, 0xffe6a6, 0.78)
            .setDepth(900)
            .setAlpha(0);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(7.5 * TILE, 10.15 * TILE, 'lab_player_up')
            .setOrigin(0.5, 0.92)
            .setScale(0.27)
            .setDepth(700);
        this.setPlayerBody('up');
        this.player.currentDir = 'up';
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.blockers);
    }

    createControls() {
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.isLeaving) return;
        this.updatePlayer();
        this.updateExitAffordance();
        this.publishDebugState();

        if (Phaser.Geom.Rectangle.Contains(this.exitZone, this.player.x, this.player.y)
            && (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keys.E))) {
            this.exitInterior();
        }
    }

    updatePlayer() {
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up = this.cursors.up.isDown || this.keys.W.isDown;
        const down = this.cursors.down.isDown || this.keys.S.isDown;
        const vx = (right ? 1 : 0) - (left ? 1 : 0);
        const vy = (down ? 1 : 0) - (up ? 1 : 0);
        const speed = 180;

        if (vx || vy) {
            const len = Math.hypot(vx, vy) || 1;
            this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
            const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
            this.player.currentDir = dir;
            const animKey = `lab_walk_${dir}`;
            if (this.player.anims.currentAnim?.key !== animKey) {
                this.player.play(animKey);
                this.setPlayerBody(dir);
            }
        } else {
            this.player.setVelocity(0, 0);
            this.player.anims.stop();
            this.player.setFrame(0);
        }
        this.player.setDepth(this.player.y + 24);
    }

    updateExitAffordance() {
        const inExitZone = Phaser.Geom.Rectangle.Contains(this.exitZone, this.player.x, this.player.y);
        this.exitHint
            .setAlpha(inExitZone ? 0.85 + Math.sin(this.time.now / 130) * 0.12 : 0)
            .setScale(inExitZone ? 1 + Math.sin(this.time.now / 170) * 0.08 : 1);
    }

    setPlayerBody(direction) {
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

    addShadow(x, y, w, h, depth) {
        return this.add.image(x, y, 'soft_shadow')
            .setDisplaySize(w, h)
            .setDepth(depth)
            .setAlpha(0.5);
    }

    addBlocker(x, y, w, h) {
        const rect = this.add.rectangle(x, y, w, h, 0xff00ff, 0);
        this.physics.add.existing(rect, true);
        this.blockers.add(rect);
    }

    exitInterior() {
        this.isLeaving = true;
        this.player.setVelocity(0, 0);
        this.cameras.main.fadeOut(180, 20, 16, 12);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop();
            if (this.scene.isPaused(this.returnScene)) {
                this.scene.resume(this.returnScene);
            } else {
                this.scene.start(this.returnScene);
            }
        });
    }

    publishDebugState() {
        if (typeof document === 'undefined' || !document.body || !this.player) return;
        Object.assign(document.body.dataset, {
            styleLabInteriorReady: 'true',
            styleLabInteriorPlayerX: Math.round(this.player.x).toString(),
            styleLabInteriorPlayerY: Math.round(this.player.y).toString(),
            styleLabInteriorBlockers: (this.blockers?.getChildren?.().length ?? 0).toString(),
            styleLabInteriorCanExit: Phaser.Geom.Rectangle.Contains(this.exitZone, this.player.x, this.player.y) ? 'true' : 'false'
        });
    }
}
