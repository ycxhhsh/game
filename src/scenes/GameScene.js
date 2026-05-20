import Phaser from 'phaser';
import { TILE_SIZE, PALETTE, SPRITES_DATA } from '../utils/constants';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { EventBus, EMOTION_EVENTS } from '../events/EventBus';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.MAP_COLS = 60; // 从 40 大幅扩张至 60
        this.MAP_ROWS = 50; // 从 30 大幅扩张至 50，制造开阔的地图体量
    }

    create() {
        // 1. 基础系统
        this.buildMap();
        this.createPlayer();
        this.setupCamera();
        
        // 2. 交互逻辑状态
        this.farmStates = {};
        this.gameTime = 6 * 60;
        this.gameStore = useGameStore();
        this.uiStore = useUiStore();
        this.currentWeather = this.gameStore.weather;
        this.emotionDrainTimer = 0;
        
        // 5. 交互高光框输入控制
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,T,E');
        this.input.keyboard.on('keydown', (e) => {
            if (this.uiStore.isDialogOpen || this.uiStore.isInventoryOpen || this.uiStore.isDiaryOpen || this.uiStore.isHeartTreeOpen) return;
            if (e.key === ' ' || e.key === 'e' || e.key === 'E') this.handleInteract();
            if (e.key === 't' || e.key === 'T') this.passDay();
        });

        // 4. 环境光 (UI has been delegated to Vue via App.vue)
        this.createEnvironmentLight();
        this.createHeartTree();
        this.createMomoCompanion();
        this.bindEmotionEvents();

        // 5. 交互高光框
        this.highlightBox = this.add.graphics();
        
        // 状态相关
        this.isActing = false;
        
        // Timer
        this.gameTimer = 0;

        // 6. 生态小动物与精灵系统
        this.createEcosystem();
        
        // 7. 水流循环动画
        this.time.addEvent({
            delay: 600, loop: true,
            callback: () => {
                if (this.waterTiles && this.waterTiles.length > 0 && this.waterTiles[0].texture) {
                    const isW1 = this.waterTiles[0].texture.key === 'water_1';
                    this.waterTiles.forEach(w => w.setTexture(isW1 ? 'water_2' : 'water_1'));
                }
            }
        });

        // 【热更新兜底】装载全部贴图和帧动画循环
        this.fillMissingTextures();

        // 当从室内返回时，执行淡入及清理可能的按键残留
        this.events.on('wake', () => {
            this.cursors.up.reset();
            this.cursors.down.reset();
            this.cursors.left.reset();
            this.cursors.right.reset();
            this.keys.W.reset();
            this.keys.S.reset();
            this.keys.A.reset();
            this.keys.D.reset();
            this.cameras.main.fadeIn(400, 0, 0, 0);
            this.refreshHeartTreeVisual();
            this.updateMomoVisual();
        });
    }

    fillMissingTextures() {
        // 已全面替换为真实贴图动画，该原版 ASCII 补全在此仅补全通用方块图，不再管理动画


        for (const [key, spriteLines] of Object.entries(SPRITES_DATA)) {
            if (!this.textures.exists(key)) {
                let scaleX = 2, scaleY = 2;
                if (key === 'treeTop') { scaleX = 2; scaleY = 3; }
                else if (key.startsWith('icon_')) { scaleX = 1; scaleY = 1; }
                const canvas = document.createElement('canvas');
                const h = spriteLines.length;
                const w = spriteLines[0] ? spriteLines[0].length : 16;
                canvas.width = w * scaleX; canvas.height = h * scaleY;
                const ctx = canvas.getContext('2d');
                for (let y = 0; y < h; y++) {
                    if(!spriteLines[y]) continue;
                    const line = spriteLines[y];
                    for (let x = 0; x < line.length; x++) {
                        const char = line[x];
                        if (char && char !== ' ') {
                            ctx.fillStyle = PALETTE[char] || '#ff00ff';
                            ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
                        }
                    }
                }
                this.textures.addCanvas(key, canvas);
            }
        }
    }

    createEcosystem() {
        // 林奶奶的小屋 (原始像素绘制)
        // 获取实际坐标位置
        const hx = 6 * TILE_SIZE;
        const hy = (this.MAP_ROWS - 14) * TILE_SIZE;
        
        // Scale 设为 3，那么宽高等于 32(基础) * 2(BootScene缩放) * 3 = 192像素，即 6 格大小。
        this.grandmaHouse = this.add.image(hx, hy, 'spr_house').setOrigin(0, 0).setDepth(hy + 192).setScale(3);
        this.physics.add.existing(this.grandmaHouse, true); 
        // 碰撞体积高度定为屋子下半截墙体，防止穿模到屋脊
        this.grandmaHouse.body.setSize(160, 60);
        this.grandmaHouse.body.setOffset(16, 132); 
        this.physics.add.collider(this.player, this.grandmaHouse);

        // 门垫修正坐标到门前
        const doorMat = this.add.ellipse(hx + 96, hy + 196, 40, 20, 0xffa500).setDepth(hy + 192).setAlpha(0.5);
        this.tweens.add({ targets: doorMat, alpha: 0.1, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        
        // 调整奶奶位置偏离屋顶，移到屋外旁边
        const gx = hx + 230; const gy = hy + 160;
        
        this.rockingChair = this.add.image(gx, gy, 'spr_rocking_chair_1').setDepth(gy).setScale(1.2);
        this.rockingChair.setOrigin(0.5, 0.9);
        
        this.grandma = this.add.image(gx, gy - 4, 'spr_grandma_1').setDepth(gy + 2).setScale(1.2);
        this.grandma.setOrigin(0.5, 0.9);
        
        this.physics.add.existing(this.grandma, true);
        this.grandma.body.setSize(24, 16);
        this.grandma.body.setOffset(12, 40);
        this.physics.add.collider(this.player, this.grandma);
        
        // 原始帧动画互换替代生硬的旋转缓冲
        this.time.addEvent({
            delay: 800,
            loop: true,
            callback: () => {
                const isFrame2 = this.rockingChair.texture.key === 'spr_rocking_chair_2';
                this.rockingChair.setTexture(isFrame2 ? 'spr_rocking_chair_1' : 'spr_rocking_chair_2');
                this.grandma.setTexture(isFrame2 ? 'spr_grandma_1' : 'spr_grandma_2');
                this.grandma.y = isFrame2 ? gy - 10 : gy - 8; // 配合椅子后仰微微位移
            }
        });
        
        this.gameStore.grandmaAffection = 0;

        // 森林动物：小精灵
        this.fairies = this.physics.add.group();

        // 剧情设置：游玩初期兔子不会出没，直到后续好感度/季节触发，现清空兔子总数。
        const bunnyCount = 0; 
        for (let i = 0; i < bunnyCount; i++) {
            const rx = Phaser.Math.Between(5, this.MAP_COLS - 5) * TILE_SIZE;
            const ry = Phaser.Math.Between(10, this.MAP_ROWS - 10) * TILE_SIZE;
            const bunny = this.bunnies.create(rx, ry, 'spr_bunny_right_1').setDepth(ry);
            bunny.body.setSize(12, 10);
            bunny.body.setOffset(2, 6);
            bunny.setCollideWorldBounds(true);
            bunny.isRight = true;
            this.physics.add.collider(bunny, this.staticTiles);
            
            // 待机时的耳朵抽动机制 (Idle Animation)
            this.time.addEvent({
                delay: 300, loop: true,
                callback: () => {
                    if (bunny.body.velocity.x === 0 && bunny.body.velocity.y === 0) {
                        const twitch = Math.random() > 0.7; // 30% 概率抽动耳朵
                        bunny.setTexture(bunny.isRight ? (twitch ? 'spr_bunny_right_2' : 'spr_bunny_right_1') : (twitch ? 'spr_bunny_left_2' : 'spr_bunny_left_1'));
                    }
                }
            });

            // 远距跳跃状态机 AI
            this.time.addEvent({
                delay: Phaser.Math.Between(2000, 5000), loop: true,
                callback: () => {
                    bunny.isRight = Math.random() > 0.5;
                    bunny.setTexture(bunny.isRight ? 'spr_bunny_jump_right' : 'spr_bunny_jump_left');
                    bunny.setVelocity(bunny.isRight ? 60 : -60, Phaser.Math.Between(-40, 40)); 
                    
                    // 更长更缓的滞空感
                    this.tweens.add({ targets: bunny, y: bunny.y - 14, duration: 250, yoyo: true, ease: 'Sine.easeOut' });
                    
                    this.time.delayedCall(500, () => { 
                        bunny.setVelocity(0, 0); 
                        bunny.setTexture(bunny.isRight ? 'spr_bunny_right_1' : 'spr_bunny_left_1');
                    }); 
                }
            });
        }

        // 随机在场景中飘浮的发光小精灵
        const fairyCount = 0; // 按要求：暂存于后台，初期不出现
        for (let i = 0; i < fairyCount; i++) {
            const rx = Phaser.Math.Between(5, this.MAP_COLS - 5) * TILE_SIZE;
            const ry = Phaser.Math.Between(5, this.MAP_ROWS - 15) * TILE_SIZE;
            const fairy = this.fairies.create(rx, ry, 'spr_fairy').setDepth(ry + 16);
            fairy.setCollideWorldBounds(true);
            
            this.tweens.add({
                targets: fairy,
                y: ry - 16,
                duration: 1500 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Math.random() * 1000
            });
            
            this.time.addEvent({
                delay: Phaser.Math.Between(3000, 6000),
                loop: true,
                callback: () => fairy.setVelocityX(Phaser.Math.Between(-15, 15))
            });
        }
    }

    buildMap() {
        this.logicMap = [];
        this.staticTiles = this.physics.add.staticGroup();

        for (let y = 0; y < this.MAP_ROWS; y++) {
            const row = [];
            for (let x = 0; x < this.MAP_COLS; x++) {
                let id = 0; 
                if (x === 0 || x === this.MAP_COLS - 1 || y === 0 || y === this.MAP_ROWS - 1) id = 3;
                else if (y === 1) id = 4; // 顶部排界限树
                else {
                    const rx = Math.random();
                    // 极致净化地图：按照用户要求大幅度削减生发概率，确保留白平衡 (1%) 
                    if (rx < 0.008) id = 4; // 0.8% 树木
                    else if (rx < 0.013) id = 1; // 0.5% 花朵
                    else if (rx < 0.02) id = 6; // 0.7% 草丛
                    else if (x >= 15 && x <= 45 && y >= 15 && y <= 35) id = 2; // 中心大农庄
                }
                row.push(id);
                
                let base = 'grass';
                if (id === 1 || id === 6 || id === 4) base = 'grass';
                else if (id === 2) base = 'dirt'; 
                else if (id === 3) base = 'water_1'; 
                else if (id === 5) base = 'wood_floor';
                
                const px = x * TILE_SIZE; const py = y * TILE_SIZE;
                this.add.image(px, py, base).setOrigin(0, 0);
                
                // 绘制随机地表的原始像素级装饰物
                if (id === 1) {
                    this.add.image(px, py - 8, 'flower').setOrigin(0, 0).setDepth(py + 16).setScale(1.5); 
                } else if (id === 6) {
                    this.add.image(px, py, 'grass_tuft').setOrigin(0, 0).setDepth(py + 16).setScale(1.5);
                } else if (id === 4) {
                    // 彻底移除高清实拍树，采用 16x16 代码阵列绘制的复古树！
                    const rTex = Math.random();
                    let tKey = 'spr_tree_oak';
                    if (rTex > 0.75) tKey = 'spr_tree_cherry';
                    else if (rTex > 0.35) tKey = 'spr_tree_pine';
                    
                    const tree = this.add.image(px - 32, py - 64, tKey).setOrigin(0, 0);
                    tree.setDepth(py + 32).setScale(3); // 32 * 3 = 96px 大小的复古树
                    const trunk = this.add.rectangle(px + 16, py + 16, 24, 24);
                    this.physics.add.existing(trunk, true);
                    this.staticTiles.add(trunk);
                } else if (id === 3) {
                    // 水流动画追踪
                    if (!this.waterTiles) this.waterTiles = [];
                    const waterSprite = this.add.image(px, py, 'water_1').setOrigin(0, 0).setDepth(0);
                    this.waterTiles.push(waterSprite);
                    
                    const waterCollider = this.staticTiles.create(px, py, 'water_1').setOrigin(0, 0);
                    waterCollider.setVisible(false);
                }
            }
            this.logicMap.push(row);
        }
    }

    // 绘制农田动态精灵
    refreshFarmTile(x, y) {
        const key = `${x},${y}`;
        const farm = this.farmStates[key];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (farm.sprites) { farm.sprites.forEach(s => s.destroy()); }
        farm.sprites = [];

        if (farm.state === 'tilled' || farm.state === 'watered') {
            farm.sprites.push(this.add.image(px, py, farm.state).setOrigin(0, 0).setDepth(1));
        }
        
        if (farm.crop === 1 || farm.crop === 11) {
            const s = this.add.image(px, py, 'seeds').setOrigin(0,0).setDepth(2);
            if (farm.crop === 11) s.setTint(0xffb0b5); // 番茄种子带红色滤镜
            farm.sprites.push(s);
        } else if (farm.crop === 2 || farm.crop === 12) {
            farm.sprites.push(this.add.image(px, py, 'sprout').setOrigin(0, 0).setDepth(2));
        } else if (farm.crop === 3) {
            farm.sprites.push(this.add.image(px, py - 16, 'mature_carrot').setOrigin(0, 0).setDepth(2));
        } else if (farm.crop === 13) {
            farm.sprites.push(this.add.image(px, py - 16, 'mature_tomato').setOrigin(0, 0).setDepth(2));
        }
    }

    createPlayer() {
        // 退回原生像素模式
        this.player = this.physics.add.sprite(20 * TILE_SIZE, 15 * TILE_SIZE, 'player_down').setDepth(10);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.staticTiles);
        this.playerSpeed = 160; 
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.MAP_COLS * TILE_SIZE, this.MAP_ROWS * TILE_SIZE);
        // 【修复锁屏 Bug】原本物理世界边界继承了 960x540 分辨率，导致无法往下走超过 16 隔！现已强制物理边界跟随地图 60x50！
        this.physics.world.setBounds(0, 0, this.MAP_COLS * TILE_SIZE, this.MAP_ROWS * TILE_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    createEnvironmentLight() {
        this.nightOverlay = this.add.rectangle(0, 0, this.MAP_COLS * TILE_SIZE, this.MAP_ROWS * TILE_SIZE, 0x000000)
            .setOrigin(0, 0)
            .setDepth(2000) // 盖在玩家上方，低于 HUD
            .setAlpha(0);
            
        this.weatherEmitter = this.add.particles(0, 0, '__WHITE', {
            x: { min: 0, max: this.MAP_COLS * TILE_SIZE },
            y: { min: 0, max: this.MAP_ROWS * TILE_SIZE },
            scale: { start: 1, end: 1 },
            lifespan: 2000,
            quantity: 0,
            tint: 0xffffff
        });
        this.weatherEmitter.setDepth(1999);

        this.socialBatteryOverlay = this.add.rectangle(0, 0, this.MAP_COLS * TILE_SIZE, this.MAP_ROWS * TILE_SIZE, 0x777780)
            .setOrigin(0, 0)
            .setDepth(2001)
            .setAlpha(0);
    }

    createHeartTree() {
        const x = 18 * TILE_SIZE;
        const y = 12 * TILE_SIZE;
        this.heartTreeGlow = this.add.ellipse(x, y + 58, 112, 34, 0xf5b6c6, 0.22).setDepth(y + 64);
        this.heartTreeSprite = this.add.image(x, y, 'spr_tree_cherry').setOrigin(0.5, 0.85).setDepth(y + 70).setScale(3.3);
        this.heartTreeSprite.setInteractive({ useHandCursor: true });
        this.heartTreeSprite.on('pointerdown', () => EventBus.emit(EMOTION_EVENTS.OPEN_HEART_TREE));
        this.heartTreeWeeds = [];
        this.refreshHeartTreeVisual();
    }

    refreshHeartTreeVisual() {
        if (!this.heartTreeSprite) return;
        const stage = this.gameStore.heartTree.stage;
        const tintMap = {
            wilted: 0x888c75,
            recovering: 0xb0c77d,
            healthy: 0x88c978,
            blooming: 0xffb0c5
        };
        this.heartTreeSprite.setTint(tintMap[stage] || 0xb0c77d);
        this.heartTreeGlow.setFillStyle(stage === 'blooming' ? 0xf5b6c6 : 0xb6d58a, stage === 'wilted' ? 0.08 : 0.22);

        this.heartTreeWeeds.forEach((weed) => weed.destroy());
        this.heartTreeWeeds = [];
        const weedCount = Math.min(this.gameStore.heartTree.weeds, 6);
        for (let i = 0; i < weedCount; i++) {
            const weed = this.add.image(
                this.heartTreeSprite.x - 46 + i * 18,
                this.heartTreeSprite.y + 42 + (i % 2) * 5,
                'grass_tuft'
            ).setDepth(this.heartTreeSprite.depth + 1).setScale(1.4).setTint(0x7f8365);
            this.heartTreeWeeds.push(weed);
        }
    }

    createMomoCompanion() {
        const key = `spr_momo_${this.gameStore.momo.mood}`;
        this.momoSprite = this.add.sprite(this.player.x - 42, this.player.y + 28, key).setDepth(this.player.y + 12).setScale(2.2);
        this.momoAnchor = new Phaser.Math.Vector2(this.momoSprite.x, this.momoSprite.y);
        this.momoAnimTime = 0;
        this.momoSide = -1;
        this.momoBaseScale = 2.2;
        this.momoShadow = this.add.ellipse(this.momoSprite.x, this.momoSprite.y + 12, 36, 10, 0x1b1b1b, 0.18)
            .setDepth(this.momoSprite.depth - 1);
        this.momoBreathRing = this.add.ellipse(this.momoSprite.x, this.momoSprite.y, 38, 28)
            .setStrokeStyle(2, 0xa8e6cf, 0.4)
            .setDepth(this.momoSprite.depth + 1)
            .setVisible(false);
        this.updateMomoVisual();
    }

    updateMomoVisual() {
        if (!this.momoSprite) return;
        const key = `spr_momo_${this.gameStore.momo.mood}`;
        if (this.textures.exists(key)) this.momoSprite.setTexture(key);
        if (this.gameStore.momo.pose === 'silent') {
            this.momoBaseScale = 1.9;
            this.momoSprite.setAlpha(0.82);
        } else if (this.gameStore.momo.pose === 'sleepy') {
            this.momoBaseScale = 2.05;
            this.momoSprite.setAlpha(0.92);
        } else {
            this.momoBaseScale = 2.25;
            this.momoSprite.setAlpha(1);
        }
        this.momoSprite.setScale(this.momoBaseScale);
    }

    updateMomoFollower(delta, isPlayerMoving) {
        if (!this.momoSprite || !this.player) return;
        this.momoAnimTime += delta;

        if (this.player.currentDir === 'right') this.momoSide = -1;
        else if (this.player.currentDir === 'left') this.momoSide = 1;

        const offsetX = this.momoSide * 42;
        const offsetY = this.player.currentDir === 'up' ? 44 : 28;
        const targetX = this.player.x + offsetX;
        const targetY = this.player.y + offsetY;
        const distance = Phaser.Math.Distance.Between(this.momoAnchor.x, this.momoAnchor.y, targetX, targetY);
        const followLerp = distance > 180 ? 0.18 : (isPlayerMoving ? 0.105 : 0.065);

        if (distance > 320) {
            this.momoAnchor.set(targetX, targetY);
        } else {
            this.momoAnchor.x += (targetX - this.momoAnchor.x) * followLerp;
            this.momoAnchor.y += (targetY - this.momoAnchor.y) * followLerp;
        }

        const t = this.momoAnimTime;
        const pose = this.gameStore.momo.pose;
        const hop = isPlayerMoving && pose === 'active' ? Math.abs(Math.sin(t * 0.012)) * 8 : 0;
        const breath = pose === 'silent' ? Math.sin(t * 0.004) : Math.sin(t * 0.006);
        const idleBob = pose === 'curled' ? 0 : breath * (pose === 'silent' ? 1.5 : 2.5);
        const scalePulse = pose === 'silent' ? 1 + breath * 0.025 : 1 + Math.max(0, breath) * 0.012;
        const walkTilt = isPlayerMoving && pose === 'active' ? Math.sin(t * 0.012) * 4 : breath * 1.2;

        this.momoSprite.x = this.momoAnchor.x;
        this.momoSprite.y = this.momoAnchor.y + idleBob - hop;
        this.momoSprite.setScale(this.momoBaseScale * scalePulse);
        this.momoSprite.setAngle(walkTilt);
        this.momoSprite.setFlipX(this.momoSprite.x > this.player.x);
        this.momoSprite.setDepth(this.momoSprite.y + 12);

        if (this.momoShadow) {
            this.momoShadow.x = this.momoAnchor.x;
            this.momoShadow.y = this.momoAnchor.y + 16;
            this.momoShadow.setScale(1 + Math.min(distance / 260, 0.45), 1);
            this.momoShadow.setDepth(this.momoSprite.depth - 1);
            this.momoShadow.setAlpha(pose === 'silent' ? 0.1 : 0.18);
        }

        if (this.momoBreathRing) {
            const showRing = pose === 'silent';
            this.momoBreathRing.setVisible(showRing);
            if (showRing) {
                const ringScale = 1.05 + Math.max(0, breath) * 0.35;
                this.momoBreathRing.x = this.momoSprite.x;
                this.momoBreathRing.y = this.momoSprite.y + 2;
                this.momoBreathRing.setScale(ringScale);
                this.momoBreathRing.setAlpha(0.18 + Math.max(0, breath) * 0.28);
                this.momoBreathRing.setDepth(this.momoSprite.depth + 1);
            }
        }
    }

    bindEmotionEvents() {
        this.onEmotionChanged = () => {
            if (this.heartTreeSprite) this.refreshHeartTreeVisual();
            if (this.momoSprite) this.updateMomoVisual();
        };
        EventBus.on(EMOTION_EVENTS.SELF_CARE_DONE, this.onEmotionChanged);
        EventBus.on(EMOTION_EVENTS.MOOD_ENTRY_RECORDED, this.onEmotionChanged);
        EventBus.on(EMOTION_EVENTS.MOMO_STATE_CHANGED, this.onEmotionChanged);
        this.events.once('shutdown', () => {
            EventBus.off(EMOTION_EVENTS.SELF_CARE_DONE, this.onEmotionChanged);
            EventBus.off(EMOTION_EVENTS.MOOD_ENTRY_RECORDED, this.onEmotionChanged);
            EventBus.off(EMOTION_EVENTS.MOMO_STATE_CHANGED, this.onEmotionChanged);
        });
    }

    showEmote(target, emoteKey) {
        const emote = this.add.image(target.x, target.y - 48, emoteKey).setDepth(6000).setScale(0);
        this.tweens.add({
            targets: emote,
            scale: 2, y: target.y - 64,
            duration: 600, ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({ targets: emote, scale: 0, alpha: 0, duration: 300, onComplete: () => emote.destroy() });
                });
            }
        });
    }

    interactGrandma() {
        let dx = this.grandma.x - this.player.x;
        this.player.currentDir = dx > 0 ? 'right' : 'left'; 
        this.player.play(`walk-${this.player.currentDir}`, true); this.player.stop();

        if (this.gameStore.carrotCount > 0) {
            this.gameStore.useCrop('carrot');
            this.gameStore.addAffection();
            this.emitParticles(this.grandma.x, this.grandma.y, 0xff9900, 10);
            this.showEmote(this.grandma, 'emote_love');
            EventBus.emit('SHOW_DIALOGUE', { text: "带着土壤清香的胡萝卜...\n老婆子我太久没闻到这么新鲜的味道了。\n谢谢你，温柔的孩子。", name: '林奶奶', avatar: 'grandma_portrait' });
        } else if (this.gameStore.tomatoCount > 0) {
            this.gameStore.useCrop('tomato');
            this.gameStore.addAffection();
            this.emitParticles(this.grandma.x, this.grandma.y, 0xd35d6e, 10); 
            this.showEmote(this.grandma, 'emote_love');
            EventBus.emit('SHOW_DIALOGUE', { text: "这些红透的番茄真甜啊...\n让我仿佛回到了多年前的夏天。\n谢谢你的心意，孩子。", name: '林奶奶', avatar: 'grandma_portrait' });
        } else if (this.gameStore.sunflowerCount > 0) {
            this.gameStore.useCrop('sunflower');
            this.gameStore.addAffection();
            this.emitParticles(this.grandma.x, this.grandma.y, 0xffd700, 10); 
            this.showEmote(this.grandma, 'emote_love');
            EventBus.emit('SHOW_DIALOGUE', { text: "啊... 是向日葵！就像是太阳直接落进了我这片小露台。\n你的身上总是有那么多温暖呢。", name: '林奶奶', avatar: 'grandma_portrait' });
        } else if (this.gameStore.blueberryCount > 0) {
            this.gameStore.useCrop('blueberry');
            this.gameStore.addAffection();
            this.emitParticles(this.grandma.x, this.grandma.y, 0x6495ed, 10); 
            this.showEmote(this.grandma, 'emote_love');
            EventBus.emit('SHOW_DIALOGUE', { text: "这是酸酸甜甜的蓝莓呀... \n让海风里都带上了一股安静悠长的味道呢。", name: '林奶奶', avatar: 'grandma_portrait' });
        } else {
            if (this.gameStore.grandmaAffection === 0) {
                EventBus.emit('SHOW_DIALOGUE', { text: "呀，是来到心屿的新岛民吗？\n这里风很大，没事多来老奶奶这坐坐。", name: '林奶奶', avatar: 'grandma_portrait' });
            } else if (this.gameStore.grandmaAffection < 3) {
                EventBus.emit('SHOW_DIALOGUE', { text: "看见你这孩子，心里的风都能停一停呢。\n不用管我这个老骨头，去忙你的小天地吧。", name: '林奶奶', avatar: 'grandma_portrait' });
            } else {
                EventBus.emit('SHOW_DIALOGUE', { text: "海风又起了，记得多穿点衣服...\n今天的老奶奶也在这里一直看着你呢。", name: '林奶奶', avatar: 'grandma_portrait' });
            }
        }
    }

    passDay() {
        if (this.isActing) return;
        this.cameras.main.flash(500, 255, 255, 255);
        this.gameTime += 24 * 60; // 强制过夜跨天
        this.showEmote(this.player, 'emote_love');
    }

    handleInteract() {
        if (this.uiStore.isDialogOpen) { EventBus.emit('ADVANCE_DIALOGUE'); return; }
        if (this.isActing) return;

        let tx = Math.floor(this.player.x / TILE_SIZE);
        let ty = Math.floor(this.player.y / TILE_SIZE);
        
        if (this.player.currentDir === 'up') { ty -= 1; }
        else if (this.player.currentDir === 'down') { ty += 1; }
        else if (this.player.currentDir === 'left') { tx -= 1; }
        else if (this.player.currentDir === 'right') { tx += 1; }

        if (this.heartTreeSprite) {
            const treeDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heartTreeSprite.x, this.heartTreeSprite.y + 42);
            if (treeDist <= 100) {
                EventBus.emit(EMOTION_EVENTS.OPEN_HEART_TREE);
                return;
            }
        }

        // 门锁交互检测 (进门事件)
        let doorDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandmaHouse.x + 130, this.grandmaHouse.y + 330);
        if (doorDist <= 80 && this.player.currentDir === 'up') {
            this.isActing = true;
            this.player.setVelocity(0);
            this.player.stop();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.isActing = false;
                this.scene.sleep('GameScene');
                this.scene.launch('RoomScene');
            });
            return;
        }

        // 近距离检测林奶奶交互
        let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandma.x, this.grandma.y);
        if (dist <= 90) {
            this.interactGrandma();
            return;
        }

        let willChange = false;
        let farm = null;
        let key = `${tx},${ty}`;

        if (tx >= 0 && tx < this.MAP_COLS && ty >= 0 && ty < this.MAP_ROWS && this.logicMap[ty][tx] === 2) {
            farm = this.farmStates[key] || { state: 'normal', crop: 0, sprites: [] };
            
            // 一键丰收逻辑：无论何种工具都可立刻拾取成熟作物
            if (farm.crop === 3 || farm.crop === 13 || farm.crop === 23 || farm.crop === 33) {
                let pColor = 0xffffff;
                if (farm.crop === 3) { this.gameStore.addCrop('carrot'); pColor = 0xff9900; }
                else if (farm.crop === 13) { this.gameStore.addCrop('tomato'); pColor = 0xd35d6e; }
                else if (farm.crop === 23) { this.gameStore.addCrop('sunflower'); pColor = 0xffd700; }
                else if (farm.crop === 33) { this.gameStore.addCrop('blueberry'); pColor = 0x6495ed; }
                
                farm.crop = 0;
                farm.state = 'normal';
                this.farmStates[key] = farm;
                this.refreshFarmTile(tx, ty);
                this.emitParticles(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, pColor, 8);
                this.gameStore.adjustSocialBattery(-1, 'harvest');
                return; // 直接收走，不播普通动作
            }

            if (this.uiStore.currentTool === 1) { 
                if (farm.state === 'normal') willChange = true; 
            } else if (this.uiStore.currentTool === 2) { 
                if (farm.state === 'tilled') willChange = true; 
            } else if (this.uiStore.currentTool === 3) { 
                if ((farm.state === 'tilled' || farm.state === 'watered') && farm.crop === 0) {
                    if (this.gameStore.useSeed(this.uiStore.currentSeed)) {
                        willChange = true; 
                    } else {
                        // 缺少种子的提示
                        this.showEmote(this.player, 'emote_sweat');
                        return; // 终止行动硬直
                    }
                }
            }
        }

        // 播放动作硬直
        this.isActing = true;
        this.player.stop();
        this.player.setVelocity(0);
        
        if (this.uiStore.currentTool === 1) { // Hoe
            const animDir = this.player.currentDir === 'left' ? 'right' : this.player.currentDir;
            this.player.setTexture(`player_${animDir}_w1`);
            this.time.delayedCall(150, () => {
                const targetX = tx * TILE_SIZE + 16; const targetY = ty * TILE_SIZE + 16;
                this.emitParticles(targetX, targetY, 0xcc9977, 3);
            });
            this.time.delayedCall(300, () => {
                this.finishInteract(willChange, farm, key, tx, ty);
            });
        } else if (this.uiStore.currentTool === 3) { // Seed
            // 播种动作省略，暂时回落站手举姿态（用另一侧腿步帧代替动作）
            const animDir = this.player.currentDir === 'left' ? 'right' : this.player.currentDir;
            this.player.setTexture(`player_${animDir}_w2`);
            this.time.delayedCall(100, () => {
                const targetX = tx * TILE_SIZE + 16; const targetY = ty * TILE_SIZE + 16;
                let seedColor = 0xffffff;
                if (this.uiStore.currentSeed === 'carrot') seedColor = 0xff9900;
                else if (this.uiStore.currentSeed === 'tomato') seedColor = 0xd35d6e;
                else if (this.uiStore.currentSeed === 'sunflower') seedColor = 0xffd700;
                else if (this.uiStore.currentSeed === 'blueberry') seedColor = 0x6495ed;
                this.emitParticles(targetX, targetY, seedColor, 4);
                this.time.delayedCall(200, () => {
                    this.finishInteract(willChange, farm, key, tx, ty);
                });
            });
        } else if (this.uiStore.currentTool === 2) { // Water
            const animDir = this.player.currentDir === 'left' ? 'right' : this.player.currentDir;
            this.player.setTexture(`player_${animDir}_w1`);
            this.time.delayedCall(150, () => {
                const targetX = tx * TILE_SIZE + 16; const targetY = ty * TILE_SIZE + 16;
                this.emitParticles(targetX, targetY, 0xa2d5f2, 8);
                this.time.delayedCall(100, () => this.emitParticles(targetX, targetY, 0xa2d5f2, 6));
                this.time.delayedCall(200, () => {
                    this.finishInteract(willChange, farm, key, tx, ty);
                });
            });
        }
    }

    emitParticles(px, py, colorTint, count) {
        // 使用引擎必定存在的内部绝对白元材质 '__WHITE' (2x2)，100% 杜绝黑块错图
        const emitter = this.add.particles(px, py, '__WHITE', {
            tint: colorTint,
            speed: { min: 40, max: 90 },
            angle: { min: 200, max: 340 }, // 扇形向上方喷射
            gravityY: 400, // 极强的物理重力拉回地面
            scale: { start: 2, end: 0 }, // 起始放大到 4x4 然后逐渐溶解
            lifespan: 400,
            quantity: count,
            maxParticles: count // 喷射一次即刻停止
        });
        emitter.setDepth(2000); // 确保粒子在顶层
        
        // 自动垃圾回收发射器
        this.time.delayedCall(1000, () => {
            emitter.destroy();
        });
    }

    finishInteract(willChange, farm, key, tx, ty) {
        this.isActing = false;
        this.player.setAngle(0);
        const animDir = this.player.currentDir === 'left' ? 'right' : this.player.currentDir;
        this.player.setTexture(`player_${animDir}`);

        if (willChange && farm) {
            this.gameStore.adjustSocialBattery(-2, 'farmWork');
            if (this.uiStore.currentTool === 1) farm.state = 'tilled';
            else if (this.uiStore.currentTool === 2) farm.state = 'watered';
            else if (this.uiStore.currentTool === 3) {
                if (farm.state === 'tilled' || farm.state === 'watered') { // 播种
                    if (farm.crop === 0) {
                        if (this.uiStore.currentSeed === 'carrot') farm.crop = 1;
                        else if (this.uiStore.currentSeed === 'tomato') farm.crop = 11;
                        else if (this.uiStore.currentSeed === 'sunflower') farm.crop = 21;
                        else if (this.uiStore.currentSeed === 'blueberry') farm.crop = 31;
                    }
                }
            }

            this.farmStates[key] = farm;
            this.refreshFarmTile(tx, ty);
        }
    }

    update(time, delta) {
        if (this.isActing || this.uiStore.isInventoryOpen || this.uiStore.isDialogOpen || this.uiStore.isDiaryOpen || this.uiStore.isHeartTreeOpen) return;

        // --- 控制与移动 ---
        this.player.setVelocity(0);
        let dx = 0, dy = 0;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;

        if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx*dx + dy*dy); dx /= len; dy /= len; }

        const effectiveSpeed = this.gameStore.socialBattery < 30 ? 112 : this.playerSpeed;
        this.player.setVelocityX(dx * effectiveSpeed);
        this.player.setVelocityY(dy * effectiveSpeed);

        if(!this.player.currentDir) this.player.currentDir = 'down';

        if (dx !== 0 || dy !== 0) {
            this.player.setVelocity(dx * effectiveSpeed, dy * effectiveSpeed);
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

        // 动态深度计算
        this.player.setDepth(this.player.y + 16);
        this.updateMomoFollower(delta, dx !== 0 || dy !== 0);

        this.emotionDrainTimer += delta;
        if ((dx !== 0 || dy !== 0) && this.emotionDrainTimer > 5000) {
            this.gameStore.adjustSocialBattery(-1, 'walking');
            this.emotionDrainTimer = 0;
        }



        if (this.bunnies) {
            this.bunnies.getChildren().forEach(b => b.setDepth(b.y + 16));
        }

        // --- 交互高光框 ---
        let tx = Math.floor(this.player.x/TILE_SIZE), ty = Math.floor(this.player.y/TILE_SIZE);
        if(this.player.currentDir==='up') ty-=1; else if(this.player.currentDir==='down') ty+=1; else if(this.player.currentDir==='left') tx-=1; else tx+=1;
        
        this.highlightBox.clear();
        if (ty >= 0 && ty < this.MAP_ROWS && tx >= 0 && tx < this.MAP_COLS && this.logicMap[ty][tx] === 2) {
            this.highlightBox.lineStyle(2, 0xffffff, 0.5);
            this.highlightBox.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        // --- 时间流逝 (1秒=10分钟) ---
        this.gameTimer += delta;
        if (this.gameTimer > 1000) {
            this.gameTime += 10;
            this.gameTimer -= 1000;
            if (this.gameTime >= 24 * 60) { // 过夜生长逻辑
                this.gameTime -= 24 * 60; 
                this.gameStore.advanceEmotionDay();
                this.currentWeather = this.gameStore.weather;
                this.refreshHeartTreeVisual();
                this.updateMomoVisual();
                for (let key in this.farmStates) {
                    let farm = this.farmStates[key];
                    if (farm.state === 'watered') {
                        if (farm.crop === 1) farm.crop = 2;       // 萝卜发芽
                        else if (farm.crop === 2) farm.crop = 3;  // 萝卜成熟
                        else if (farm.crop === 11) farm.crop = 12; // 番茄发芽
                        else if (farm.crop === 12) farm.crop = 13; // 番茄成熟
                        else if (farm.crop === 21) farm.crop = 22; // 向日葵发芽
                        else if (farm.crop === 22) farm.crop = 23; // 向日葵成熟
                        else if (farm.crop === 31) farm.crop = 32; // 蓝莓发芽
                        else if (farm.crop === 32) farm.crop = 33; // 蓝莓成熟
                        farm.state = 'tilled';
                    }
                    const [fx, fy] = key.split(',');
                    this.refreshFarmTile(parseInt(fx), parseInt(fy));
                }
            }
        }

        // --- 更新 Vue 上的宏观状态与环境光效 ---
        let h = Math.floor(this.gameTime / 60) % 24; let m = Math.floor(this.gameTime % 60);
        let timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
        // Prevent constant updates to store unless it changed
        if (this._lastTimeStr !== timeStr) {
            this.gameStore.updateTime(timeStr);
            this._lastTimeStr = timeStr;
        }

        let hour = this.gameTime / 60;
        let overlayColor = 0; let overlayAlpha = 0;
        
        if (hour >= 18 && hour < 20) { overlayColor = 0xff7832; overlayAlpha = 0.2; } // Dusk
        else if (hour >= 20 || hour < 5) { overlayColor = 0x0a1432; overlayAlpha = 0.5; } // Night
        else {
            if (this.currentWeather === 'rainy') { overlayColor = 0x6080a0; overlayAlpha = 0.25; }
            else if (this.currentWeather === 'foggy') { overlayColor = 0xe0e0e0; overlayAlpha = 0.35; }
        }
        
        if (overlayAlpha > 0) {
            this.nightOverlay.setFillStyle(overlayColor, overlayAlpha);
            if (this.nightOverlay.alpha !== overlayAlpha) this.nightOverlay.setAlpha(overlayAlpha);
        } else {
            if (this.nightOverlay.alpha !== 0) this.nightOverlay.setAlpha(0);
        }

        if (this.socialBatteryOverlay) {
            const batteryAlpha = this.gameStore.socialBattery < 15 ? 0.2 : (this.gameStore.socialBattery < 30 ? 0.12 : 0);
            if (this.socialBatteryOverlay.alpha !== batteryAlpha) this.socialBatteryOverlay.setAlpha(batteryAlpha);
        }
        
        if (hour >= 5 && hour < 18) {
            if (this.currentWeather === 'rainy') {
                this.weatherEmitter.setQuantity(4);
                this.weatherEmitter.setGravityY(200);
                this.weatherEmitter.setParticleTint(0x80bce0);
                this.weatherEmitter.setParticleScale(0.5, 5);
                this.weatherEmitter.setAlpha(0.6);
            } else if (this.currentWeather === 'foggy') {
                this.weatherEmitter.setQuantity(2);
                this.weatherEmitter.setGravityY(0);
                this.weatherEmitter.setParticleTint(0xdcebc8);
                this.weatherEmitter.setParticleScale(8, 16);
                this.weatherEmitter.setAlpha(0.15);
            } else {
                this.weatherEmitter.setQuantity(0);
            }
        } else {
            this.weatherEmitter.setQuantity(0);
        }
    }
}
