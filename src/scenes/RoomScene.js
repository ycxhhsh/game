import Phaser from 'phaser';
import { useGameStore } from '../store/gameStore';

export default class RoomScene extends Phaser.Scene {
    constructor() {
        super('RoomScene');
    }

    create(data) {
        this.gameStore = useGameStore();

        // Enable 2D lights for a cozy atmosphere
        this.lights.enable().setAmbientColor(0x333333);

        // --- Environment Setup ---
        // Black background outside the room
        this.add.rectangle(0, 0, 960, 540, 0x000000).setOrigin(0);

        // The Room boundaries (Centered: 480, 270. Size: 600x400)
        const roomW = 600;
        const roomH = 400;
        const rx = (960 - roomW) / 2;
        const ry = (540 - roomH) / 2;

        // Wooden Floor
        const floor = this.add.rectangle(rx, ry, roomW, roomH, 0x5c4033).setOrigin(0);
        floor.setPipeline('Light2D');

        // Rug near the door (Exit Zone)
        const rug = this.add.rectangle(rx + roomW / 2, ry + roomH - 20, 120, 40, 0xa52a2a).setOrigin(0.5);
        rug.setPipeline('Light2D');

        this.exitZone = new Phaser.Geom.Rectangle(rx + roomW / 2 - 60, ry + roomH - 40, 120, 80);

        // Fireplace (Top center)
        const fireplace = this.add.rectangle(rx + roomW / 2, ry + 20, 100, 60, 0x222222).setOrigin(0.5);
        
        // Fireplace Lights
        this.fireLight = this.lights.addLight(rx + roomW / 2, ry + 40, 250).setColor(0xffa500).setIntensity(2);
        
        // Flicker effect
        this.tweens.add({
            targets: this.fireLight,
            radius: 280,
            intensity: 2.5,
            duration: 150 + Math.random() * 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Fire particles
        const fireParticles = this.add.particles(rx + roomW / 2, ry + 30, '__WHITE', {
            tint: 0xffaa00,
            speed: { min: 10, max: 40 },
            angle: { min: 250, max: 290 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 800,
            blendMode: 'ADD'
        });

        // --- Player Setup ---
        this.playerSpeed = 160;
        // Spawn near the door
        this.player = this.physics.add.sprite(rx + roomW / 2, ry + roomH - 60, 'player_down');
        this.player.setCollideWorldBounds(true);
        this.player.setPipeline('Light2D');

        // Constrain player to the room
        this.physics.world.setBounds(rx, ry, roomW, roomH);

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');

        // Transition Screen Overlay
        this.transitionOverlay = this.add.rectangle(0, 0, 960, 540, 0x000000).setOrigin(0).setDepth(9999);
        this.tweens.add({
            targets: this.transitionOverlay,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.isTransitioning = false;
            }
        });

        // Add an 'Exit' prompt text
        this.exitText = this.add.text(rx + roomW / 2, ry + roomH - 50, '[E] 返回外边', { font: 'bold 16px sans-serif', fill: '#ffffff' })
            .setOrigin(0.5).setAlpha(0).setDepth(100);

        this.createSelfCareHotspots(rx, ry, roomW, roomH);

        this.isTransitioning = true;
    }

    createSelfCareHotspots(rx, ry, roomW, roomH) {
        const hotspots = [
            { type: 'listen', x: rx + 120, y: ry + 110, w: 110, h: 58, label: '听风角落', prompt: '[E] 听一会儿风' },
            { type: 'rest', x: rx + roomW - 120, y: ry + 118, w: 112, h: 62, label: '软垫', prompt: '[E] 休息一下' },
            { type: 'hugMomo', x: rx + roomW - 124, y: ry + roomH - 128, w: 116, h: 58, label: '墨墨窝', prompt: '[E] 抱抱墨墨' },
            { type: 'realityEcho', x: rx + 126, y: ry + roomH - 128, w: 126, h: 58, label: '小书桌', prompt: '[E] 记录回响' }
        ];

        this.selfCareHotspots = hotspots.map((hotspot) => {
            const rect = this.add.rectangle(hotspot.x, hotspot.y, hotspot.w, hotspot.h, 0xf4d8ae, 0.82)
                .setStrokeStyle(2, 0xfff1d6, 0.9)
                .setDepth(20);
            rect.setPipeline('Light2D');
            const label = this.add.text(hotspot.x, hotspot.y, hotspot.label, {
                font: 'bold 15px sans-serif',
                fill: '#4f372b'
            }).setOrigin(0.5).setDepth(21);
            const zone = new Phaser.Geom.Rectangle(hotspot.x - hotspot.w / 2, hotspot.y - hotspot.h / 2, hotspot.w, hotspot.h);
            return { ...hotspot, rect, label, zone };
        });

        this.selfCareText = this.add.text(rx + roomW / 2, ry + roomH - 88, '', {
            font: 'bold 16px sans-serif',
            fill: '#fff8e8',
            backgroundColor: 'rgba(55, 37, 28, 0.65)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setAlpha(0).setDepth(120);
    }

    performRoomSelfCare(hotspot) {
        const note = hotspot.type === 'realityEcho'
            ? '在小屋里记下了一点现实回响。'
            : '';
        this.gameStore.performSelfCare(hotspot.type, { note });
        this.selfCareText.setText('墨墨轻轻点头：我们慢一点也没关系。');
        this.tweens.add({
            targets: this.selfCareText,
            alpha: 1,
            duration: 160,
            yoyo: true,
            hold: 1200
        });
        this.time.delayedCall(1800, () => {
            if (this.selfCareText && this.selfCareText.text.includes('墨墨')) this.selfCareText.setAlpha(0);
        });
    }

    update() {
        if (this.isTransitioning) return;

        // Movement
        this.player.setVelocity(0);
        let dx = 0, dy = 0;

        if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;

        if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx*dx + dy*dy); dx /= len; dy /= len; }

        this.player.setVelocityX(dx * this.playerSpeed);
        this.player.setVelocityY(dy * this.playerSpeed);

        if(!this.player.currentDir) this.player.currentDir = 'down';

        if (dx !== 0 || dy !== 0) {
            if (dx > 0) { this.player.currentDir = 'right'; }
            else if (dx < 0) { this.player.currentDir = 'left'; }
            else if (dy > 0) { this.player.currentDir = 'down'; }
            else if (dy < 0) { this.player.currentDir = 'up'; }

            this.player.setFlipX(this.player.currentDir === 'left');
            const animDir = this.player.currentDir === 'left' ? 'right' : this.player.currentDir;
            this.player.play(`walk-${animDir}`, true);
        } else {
            this.player.stop();
            const animDir = this.player.currentDir === 'left' ? 'right' : this.player.currentDir;
            this.player.setTexture(`player_${animDir}`);
            this.player.setFlipX(this.player.currentDir === 'left');
        }

        this.player.setDepth(this.player.y + 16);

        const activeCare = this.selfCareHotspots.find((hotspot) => Phaser.Geom.Rectangle.Contains(hotspot.zone, this.player.x, this.player.y));
        if (activeCare) {
            this.selfCareText.setText(activeCare.prompt).setAlpha(1);
            if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
                this.performRoomSelfCare(activeCare);
            }
        } else if (this.selfCareText.alpha > 0 && !this.selfCareText.text.includes('墨墨')) {
            this.selfCareText.setAlpha(0);
        }

        // Check Exit Zone
        if (Phaser.Geom.Rectangle.Contains(this.exitZone, this.player.x, this.player.y)) {
            this.exitText.setAlpha(1);
            if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
                this.exitRoom();
            }
        } else {
            this.exitText.setAlpha(0);
        }
    }

    exitRoom() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.player.setVelocity(0);
        
        this.tweens.add({
            targets: this.transitionOverlay,
            alpha: 1,
            duration: 400,
            onComplete: () => {
                this.scene.sleep('RoomScene');
                this.scene.wake('GameScene');
            }
        });
    }
}
