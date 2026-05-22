import Phaser from 'phaser';
import { INTERIOR_BACKGROUND, PLAYER_SHEETS } from './styleLabAssets';

const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 960;

export default class StyleLabInteriorScene extends Phaser.Scene {
    constructor() {
        super('StyleLabInteriorScene');
    }

    preload() {
        if (!this.textures.exists(INTERIOR_BACKGROUND[0])) {
            this.load.image(INTERIOR_BACKGROUND[0], INTERIOR_BACKGROUND[1]);
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

        this.add.image(0, 0, INTERIOR_BACKGROUND[0])
            .setOrigin(0, 0)
            .setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT)
            .setDepth(0);

        this.blockers = this.physics.add.staticGroup();
        this.createBlockers();

        this.exitZone = new Phaser.Geom.Rectangle(392, 820, 176, 128);

        this.player = this.physics.add.sprite(480, 852, 'lab_player_up')
            .setOrigin(0.5, 0.92)
            .setScale(0.27)
            .setDepth(700);
        this.setPlayerBody('up');
        this.player.currentDir = 'up';
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.blockers);

        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
        this.cameras.main.setZoom(1);
        this.cameras.main.fadeIn(180, 20, 16, 12);
        this.isLeaving = false;
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

    createBlockers() {
        [
            [0, 0, 960, 70],
            [0, 0, 58, 960],
            [902, 0, 58, 960],
            [0, 882, 390, 78],
            [570, 882, 390, 78],
            [70, 82, 248, 296],
            [380, 136, 260, 188],
            [690, 174, 246, 286],
            [26, 420, 146, 278],
            [620, 384, 144, 174],
            [596, 602, 270, 160],
            [812, 430, 120, 238],
            [0, 730, 250, 132],
            [800, 700, 154, 170]
        ].forEach(([x, y, w, h]) => this.addBlocker(x + w / 2, y + h / 2, w, h));
    }

    update() {
        if (this.isLeaving) return;
        this.updatePlayer();

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
            const animDir = dir === 'left' ? 'left' : dir;
            const animKey = `lab_walk_${animDir}`;
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
            this.scene.resume(this.returnScene);
        });
    }
}
