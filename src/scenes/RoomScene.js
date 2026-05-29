import Phaser from 'phaser';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';

const TILE = 64;
const ROOM_COLS = 15;
const ROOM_ROWS = 12;
const ROOM_WIDTH = ROOM_COLS * TILE;
const ROOM_HEIGHT = ROOM_ROWS * TILE;
const DOOR_COLS = new Set([6, 7, 8]);

const INTERIOR_TILE_KEYS = [
    ['interior_floor_a', 'assets/style-lab/interior/tiles/floor_a.png'],
    ['interior_floor_b', 'assets/style-lab/interior/tiles/floor_b.png'],
    ['interior_wall', 'assets/style-lab/interior/tiles/wall.png'],
    ['interior_wall_side', 'assets/style-lab/interior/tiles/wall_side.png']
];

const INTERIOR_OBJECT_KEYS = [
    ['interior_bed', 'assets/style-lab/interior/objects/bed.png'],
    ['interior_bookshelf', 'assets/style-lab/interior/objects/bookshelf.png'],
    ['interior_door_mat', 'assets/style-lab/interior/objects/door-mat.png'],
    ['interior_plant', 'assets/style-lab/interior/objects/plant.png'],
    ['interior_rocking_chair', 'assets/style-lab/interior/objects/rocking-chair.png'],
    ['interior_stove', 'assets/style-lab/interior/objects/stove.png'],
    ['interior_tea_table', 'assets/style-lab/interior/objects/tea-table.png'],
    ['interior_window', 'assets/style-lab/interior/objects/window.png']
];

const PLAYER_SHEETS = [
    { key: 'lab_player_down', anim: 'lab_walk_down', path: 'asset/player_walk_down.png?v=room-v1', frameWidth: 266, frameHeight: 431, frameRate: 6 },
    { key: 'lab_player_up', anim: 'lab_walk_up', path: 'asset/player_walk_up.png?v=room-v1', frameWidth: 231, frameHeight: 394, frameRate: 6 },
    { key: 'lab_player_left', anim: 'lab_walk_left', path: 'asset/player_walk_left.png?v=room-v1', frameWidth: 251, frameHeight: 446, frameRate: 6 },
    { key: 'lab_player_right', anim: 'lab_walk_right', path: 'asset/player_walk_right.png?v=room-v1', frameWidth: 251, frameHeight: 446, frameRate: 6 }
];

const FURNITURE = [
    { key: 'interior_window', x: 7.5, y: 2.62, scale: 0.52, block: [146, 22, 0, -20], wall: true },
    { key: 'interior_stove', x: 2.45, y: 5.0, scale: 0.42, block: [96, 76, 0, -36], care: 'listen' },
    { key: 'interior_bed', x: 12.2, y: 5.1, scale: 0.5, block: [112, 86, 0, -42], care: 'rest' },
    { key: 'interior_bookshelf', x: 13.45, y: 8.45, scale: 0.45, block: [70, 104, 0, -52] },
    { key: 'interior_rocking_chair', x: 10.05, y: 7.2, scale: 0.48, block: [74, 66, 0, -30], care: 'hugMomo' },
    { key: 'interior_tea_table', x: 7.65, y: 8.35, scale: 0.5, block: [116, 58, 0, -26], care: 'realityEcho' },
    { key: 'interior_plant', x: 4.65, y: 6.55, scale: 0.35, block: [34, 28, 0, -14], care: 'water' },
    { key: 'interior_door_mat', x: 7.5, y: 11.22, scale: 0.55, block: null, depthOffset: -8 }
];

const CARE_COPY = {
    listen: { label: '听风角落', prompt: '[E] 听一会儿风', note: '' },
    rest: { label: '床边软光', prompt: '[E] 休息一下', note: '' },
    hugMomo: { label: '摇椅旁', prompt: '[E] 抱抱墨墨', note: '' },
    realityEcho: { label: '茶桌手记', prompt: '[E] 记录回响', note: '在茶桌旁记下了一点现实回响。' },
    water: { label: '窗边绿植', prompt: '[E] 给心里浇点水', note: '' }
};

export default class RoomScene extends Phaser.Scene {
    constructor() {
        super('RoomScene');
    }

    preload() {
        INTERIOR_TILE_KEYS.forEach(([key, path]) => {
            if (!this.textures.exists(key)) this.load.image(key, path);
        });
        INTERIOR_OBJECT_KEYS.forEach(([key, path]) => {
            if (!this.textures.exists(key)) this.load.image(key, path);
        });
        if (!this.textures.exists('soft_shadow')) this.load.image('soft_shadow', 'assets/style-lab/soft_shadow.png');
        PLAYER_SHEETS.forEach((sheet) => {
            if (!this.textures.exists(sheet.key)) {
                this.load.spritesheet(sheet.key, sheet.path, {
                    frameWidth: sheet.frameWidth,
                    frameHeight: sheet.frameHeight
                });
            }
        });
    }

    create() {
        this.gameStore = useGameStore();
        this.uiStore = useUiStore();
        this.createAnimations();
        this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
        this.blockers = this.physics.add.staticGroup();
        this.selfCareHotspots = [];

        this.buildRoomShell();
        this.placeFurniture();
        this.createExitAffordance();
        this.createPlayer();
        this.createControls();
        this.createPromptText();

        this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setZoom(1);
        this.transitionOverlay = this.add.rectangle(0, 0, ROOM_WIDTH, ROOM_HEIGHT, 0x140f0c)
            .setOrigin(0)
            .setDepth(9999);
        this.tweens.add({
            targets: this.transitionOverlay,
            alpha: 0,
            duration: 260,
            onComplete: () => {
                this.isTransitioning = false;
            }
        });
        this.isTransitioning = true;
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
        this.add.rectangle(0, 0, ROOM_WIDTH, ROOM_HEIGHT, 0x120d0b).setOrigin(0).setDepth(-10);
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
            this.add.image(x, y, item.key)
                .setOrigin(0.5, 1)
                .setScale(item.scale)
                .setDepth(y + (item.depthOffset ?? 0));

            if (item.block) {
                const [w, h, ox = 0, oy = 0] = item.block;
                this.addBlocker(x + ox, y + oy, w, h);
            }
            if (item.care) this.addSelfCareHotspot(item.care, x, y);
        });
    }

    addSelfCareHotspot(type, x, y) {
        const copy = CARE_COPY[type];
        const zone = new Phaser.Geom.Rectangle(x - 54, y - 74, 108, 92);
        const marker = this.add.circle(x, y - 42, 8, 0xffe7b0, 0.72)
            .setDepth(y + 80)
            .setAlpha(0);
        this.selfCareHotspots.push({ type, ...copy, zone, marker });
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

    createPromptText() {
        this.promptText = this.add.text(ROOM_WIDTH / 2, ROOM_HEIGHT - 112, '', {
            font: 'bold 16px sans-serif',
            fill: '#fff8e8',
            backgroundColor: 'rgba(55, 37, 28, 0.72)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setAlpha(0).setDepth(1500);
    }

    update() {
        if (this.isTransitioning) return;
        if (this.uiStore.isInventoryOpen || this.uiStore.isDiaryOpen || this.uiStore.isHeartTreeOpen || this.uiStore.isMailboxOpen || this.uiStore.isDialogOpen) {
            this.player.setVelocity(0, 0);
            return;
        }
        this.updatePlayer();
        this.updateHotspots();

        if (Phaser.Geom.Rectangle.Contains(this.exitZone, this.player.x, this.player.y)
            && (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keys.E))) {
            this.exitRoom();
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

    updateHotspots() {
        const activeCare = this.selfCareHotspots.find((hotspot) => Phaser.Geom.Rectangle.Contains(hotspot.zone, this.player.x, this.player.y));
        this.selfCareHotspots.forEach((hotspot) => {
            const active = hotspot === activeCare;
            hotspot.marker
                .setAlpha(active ? 0.85 + Math.sin(this.time.now / 140) * 0.1 : 0)
                .setScale(active ? 1 + Math.sin(this.time.now / 170) * 0.08 : 1);
        });

        const inExitZone = Phaser.Geom.Rectangle.Contains(this.exitZone, this.player.x, this.player.y);
        this.exitHint
            .setAlpha(inExitZone ? 0.85 + Math.sin(this.time.now / 130) * 0.12 : 0)
            .setScale(inExitZone ? 1 + Math.sin(this.time.now / 170) * 0.08 : 1);

        if (activeCare) {
            this.promptText.setText(activeCare.prompt).setAlpha(1);
            if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.performRoomSelfCare(activeCare);
            return;
        }
        if (inExitZone) {
            this.promptText.setText('[E] 返回外边').setAlpha(1);
            return;
        }
        if (this.promptText.text && !this.promptText.text.includes('墨墨')) this.promptText.setAlpha(0);
    }

    performRoomSelfCare(hotspot) {
        this.gameStore.performSelfCare(hotspot.type, { note: hotspot.note });
        this.promptText.setText('墨墨轻轻点头：我们慢一点也没关系。');
        this.tweens.add({
            targets: this.promptText,
            alpha: 1,
            duration: 160,
            yoyo: true,
            hold: 1200
        });
        this.time.delayedCall(1800, () => {
            if (this.promptText && this.promptText.text.includes('墨墨')) this.promptText.setAlpha(0);
        });
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

    exitRoom() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.player.setVelocity(0, 0);
        this.tweens.add({
            targets: this.transitionOverlay,
            alpha: 1,
            duration: 260,
            onComplete: () => {
                this.scene.sleep('RoomScene');
                this.scene.wake('GameScene');
            }
        });
    }
}
