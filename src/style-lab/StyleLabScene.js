import Phaser from 'phaser';
import {
    MOMO_SHEETS,
    PLAYER_SHEETS,
    STONE_GRANDMA_IMAGE_KEYS,
    TILE,
    TILE_KEYS,
    TOOL_SHEETS,
    WORLD_OBJECT_KEYS
} from './styleLabAssets';
import {
    QUEST_COPY,
    QUEST_STATUS,
    REAL_WORLD_TASKS,
    StoneGrandmaQuest
} from './StoneGrandmaQuest';
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
        this.lastQuestActionAt = 0;
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
        STONE_GRANDMA_IMAGE_KEYS.forEach(([key, path]) => this.load.image(key, path));
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
    }

    create(data = {}) {
        this.createAnimations();
        this.quest = new StoneGrandmaQuest();
        this.blockers = this.physics.add.staticGroup();
        this.groundTiles = new Map();
        this.farmStates = new Map();
        this.waterTiles = [];
        this.buildGround();
        this.placeLandmarks();
        this.placeNature();
        this.createCharacters(data);
        this.setupCamera();
        this.createQuestUi();
        this.updateQuestVisuals();
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
            }))
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

        this.placeStoneGrandmaRiverbank();
    }

    placeStoneGrandmaRiverbank() {
        const { x, y } = LANDMARKS.grandma;
        this.add.rectangle(x + 72, y + 10, 118, 30, 0x8a6742, 0.9)
            .setDepth(y - 4)
            .setAngle(-4);
        this.add.rectangle(x + 72, y - 12, 112, 10, 0xc99a63, 0.95)
            .setDepth(y - 3)
            .setAngle(-4);
        this.add.rectangle(x + 72, y + 28, 112, 10, 0xc99a63, 0.95)
            .setDepth(y - 3)
            .setAngle(-4);
        this.addObject(x - 86, y + 8, 'fol_stone_edge_grass', 0.78);
        this.addObject(x - 56, y + 24, 'prop_rock', 0.78, {
            shadow: [42, 14]
        });
        this.addObject(x + 118, y + 24, 'prop_rock', 0.74, {
            shadow: [42, 14]
        });
        this.addObject(x + 70, y + 50, 'fol_wildflower_white', 0.68);
        this.addObject(x - 112, y + 42, 'fol_grass_tuft', 0.7);
    }

    placeNature() {
        const farm = createFarmCells();
        const path = createPathCells();
        const grandmaCell = {
            x: Math.floor(LANDMARKS.grandma.x / TILE),
            y: Math.floor(LANDMARKS.grandma.y / TILE)
        };
        const isStoneGrandmaBuffer = (x, y) => Math.abs(x - grandmaCell.x) <= 2 && Math.abs(y - grandmaCell.y) <= 2;
        TREE_SPOTS.forEach(([x, y], index) => {
            if (isStoneGrandmaBuffer(x, y)) return;
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
            if (isStoneGrandmaBuffer(x, y)) return;
            if (!canPlaceNaturalObject(x, y, { farm, path, avoidDoor: true })) return;
            const key = FLORA_POOL[index % FLORA_POOL.length];
            const [ox, oy] = FLOWER_CLUSTER_OFFSETS[index % FLOWER_CLUSTER_OFFSETS.length];
            this.addObject(x * TILE + 24 + ox, y * TILE + 34 + oy, key, 0.72 + (index % 2) * 0.08);
        });

        GROUND_DETAIL_SPOTS.forEach(([x, y], index) => {
            if (isStoneGrandmaBuffer(x, y)) return;
            if (!canPlaceNaturalObject(x, y, { farm, path, avoidWaterBuffer: index % 2 === 1 })) return;
            const key = index % 2 ? 'prop_rock' : 'fol_stone_edge_grass';
            this.addObject(x * TILE + 32, y * TILE + 46, key, 0.86, {
                shadow: [54, 18],
                block: key === 'prop_rock' ? [58, 34, 0, -14] : [96, 28, 0, -14]
            });
        });
    }

    createCharacters(data = {}) {
        this.grandma = this.physics.add.image(LANDMARKS.grandma.x, LANDMARKS.grandma.y, this.quest.getGrandmaTexture())
            .setOrigin(0.5, 0.94)
            .setScale(0.5)
            .setDepth(LANDMARKS.grandma.y);
        this.grandma.body.setImmovable(true);
        this.grandma.body.setSize(92, 42);
        this.grandma.body.setOffset(74, 254);
        this.addShadow(this.grandma.x, this.grandma.y + 2, 108, 25, this.grandma.depth - 1);
        this.physics.add.collider(this.grandma, this.blockers);

        this.grandmaPoint = new Phaser.Math.Vector2(this.grandma.x, this.grandma.y);
        this.grandmaNameplate = this.add.text(this.grandma.x, this.grandma.y - 178, '石头奶奶', {
            fontFamily: 'sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#5c4a4a',
            backgroundColor: 'rgba(255, 241, 221, 0.8)',
            padding: { x: 7, y: 3 }
        }).setOrigin(0.5).setDepth(this.grandma.y + 120);
        this.grandmaPrompt = this.add.text(this.grandma.x, this.grandma.y - 148, '按 E 互动', {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#fffaf0',
            backgroundColor: 'rgba(92, 64, 70, 0.8)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(this.grandma.y + 121).setAlpha(0);

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
        this.updateMindMirror(delta);
        this.updateQuestKeyboard();
        this.updateToolSelection();
        this.updateInteractions();
        if (this.isActing || this.isQuestUiBlocking()) {
            this.player.setVelocity(0, 0);
            this.updateQuestAffordances();
            this.updateMomo(delta);
            return;
        }
        this.updatePlayer(delta);
        this.updateQuestAffordances();
        this.updateMomo(delta);
    }

    updateToolSelection() {
        if (this.isQuestUiBlocking()) return;
        if (Phaser.Input.Keyboard.JustDown(this.keyOne)) this.currentTool = 1;
        if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) this.currentTool = 2;
        if (Phaser.Input.Keyboard.JustDown(this.keyThree)) this.currentTool = 3;
    }

    updateInteractions() {
        if (!this.player || this.isActing || this.isQuestUiBlocking()) return;
        if (Phaser.Input.Keyboard.JustDown(this.keyEnter) && Phaser.Geom.Rectangle.Contains(this.cottageDoorZone, this.player.x, this.player.y)) {
            this.enterCottage();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            if (this.tryQuestInteract()) return;
            this.handleFarmInteract();
        }
    }

    updateQuestKeyboard() {
        if (this.time.now - this.lastQuestActionAt < 120) return;
        if (this.questDialog) {
            const confirmDown = Phaser.Input.Keyboard.JustDown(this.keyEnter)
                || Phaser.Input.Keyboard.JustDown(this.keySpace)
                || Phaser.Input.Keyboard.JustDown(this.keys.E);
            if (this.questDialogOptions?.length === 1 && confirmDown) {
                this.handleQuestAction(this.questDialogOptions[0].action);
                return;
            }
            if (Phaser.Input.Keyboard.JustDown(this.keyOne) && this.questDialogOptions?.[0]) {
                this.handleQuestAction(this.questDialogOptions[0].action);
                return;
            }
            if (Phaser.Input.Keyboard.JustDown(this.keyTwo) && this.questDialogOptions?.[1]) {
                this.handleQuestAction(this.questDialogOptions[1].action);
                return;
            }
            if (Phaser.Input.Keyboard.JustDown(this.keyThree) && this.questDialogOptions?.[2]) {
                this.handleQuestAction(this.questDialogOptions[2].action);
            }
        } else if (this.realityUi) {
            const confirmDown = Phaser.Input.Keyboard.JustDown(this.keyEnter)
                || Phaser.Input.Keyboard.JustDown(this.keySpace)
                || Phaser.Input.Keyboard.JustDown(this.keys.E);
            if (!confirmDown) return;
            this.closeRealityTaskModal();
        } else if (this.mazeUi?.rewardShown) {
            const confirmDown = Phaser.Input.Keyboard.JustDown(this.keyEnter)
                || Phaser.Input.Keyboard.JustDown(this.keySpace)
                || Phaser.Input.Keyboard.JustDown(this.keys.E);
            if (!confirmDown) return;
            this.collectToleranceGrass();
        }
    }

    updateQuestAffordances() {
        if (!this.grandma || !this.grandmaPrompt || !this.player) return;
        const distanceToGrandma = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandma.x, this.grandma.y);
        this.grandmaNameplate
            .setPosition(this.grandma.x, this.grandma.y - 178)
            .setDepth(this.grandma.y + 120);
        this.grandmaPrompt
            .setPosition(this.grandma.x, this.grandma.y - 148)
            .setDepth(this.grandma.y + 121)
            .setAlpha(distanceToGrandma < 150 && !this.isQuestUiBlocking() ? 0.92 : 0);
    }

    createQuestUi() {
        this.questDialog = null;
        this.questTray = null;
        this.mindMirrorUi = null;
        this.mazeUi = null;
        this.realityUi = null;
        this.lightOrb = null;
        this.mindMirrorHoldMs = 0;
        this.mindMirrorHolding = false;

        this.input.on('drag', this.handleQuestDrag, this);
        this.input.on('dragend', this.handleQuestDragEnd, this);
        this.events.once('shutdown', () => {
            this.input.off('drag', this.handleQuestDrag, this);
            this.input.off('dragend', this.handleQuestDragEnd, this);
        });
    }

    isQuestUiBlocking() {
        return Boolean(this.questDialog || this.mindMirrorUi || this.mazeUi || this.realityUi);
    }

    tryQuestInteract() {
        const distanceToOrb = this.lightOrb?.visible
            ? Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lightOrb.x, this.lightOrb.y)
            : Infinity;
        if (distanceToOrb < 110) {
            this.openMemoryMaze();
            return true;
        }

        const distanceToHeartTree = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heartTreePoint.x, this.heartTreePoint.y);
        if (distanceToHeartTree < 170 && [QUEST_STATUS.NOT_STARTED, QUEST_STATUS.HANGING].includes(this.quest.status)) {
            this.showQuestDialog(QUEST_COPY.intro);
            return true;
        }

        const distanceToGrandma = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.grandma.x, this.grandma.y);
        if (distanceToGrandma < 160) {
            this.handleGrandmaQuestInteract();
            return true;
        }

        return false;
    }

    handleGrandmaQuestInteract() {
        if ([QUEST_STATUS.NOT_STARTED, QUEST_STATUS.HANGING].includes(this.quest.status)) {
            if (this.quest.status === QUEST_STATUS.HANGING) {
                this.quest.accept();
                this.triggerGrandmaFirstContact();
                return;
            }
            this.showQuestDialog({
                name: '墨墨',
                text: '这就是石头奶奶。她坐在水边好久了，像一块不愿开口的石头。我们要试着靠近吗？',
                options: [
                    { label: '靠近看看', action: 'acceptFromGrandma' },
                    { label: '先离开', action: 'hangQuest' }
                ]
            });
            return;
        }

        if (this.quest.status === QUEST_STATUS.ACCEPTED) {
            this.triggerGrandmaFirstContact();
            return;
        }

        if (this.quest.status === QUEST_STATUS.FIRST_CONTACT) {
            this.showQuestDialog(QUEST_COPY.firstContact);
            return;
        }

        if ([QUEST_STATUS.MIND_MIRROR_PROMPTED, QUEST_STATUS.MIND_READ_FAILED].includes(this.quest.status)) {
            this.showMindMirrorTray();
            this.showQuestDialog(QUEST_COPY.mindMirrorPrompt);
            return;
        }

        if ([QUEST_STATUS.MIND_READ_SUCCESS, QUEST_STATUS.NEED_RETRY_DIALOGUE].includes(this.quest.status)) {
            this.showQuestDialog(QUEST_COPY.mindReadSuccess);
            return;
        }

        if (this.quest.status === QUEST_STATUS.MAZE_UNLOCKED) {
            this.showQuestDialog(QUEST_COPY.unlockMaze, [
                { label: '进入光球', action: 'openMaze' },
                { label: '先准备一下', action: 'close' }
            ]);
            return;
        }

        if ([QUEST_STATUS.TOLERANCE_GRASS_OBTAINED, QUEST_STATUS.GIFT_WRONG_ITEM].includes(this.quest.status)) {
            this.showGiftTray();
            this.showQuestDialog({
                name: '墨墨',
                text: '宽容草已经在背包里了。把它拖给石头奶奶试试看。'
            });
            return;
        }

        if ([QUEST_STATUS.COMPLETED, QUEST_STATUS.DELAYED_REWARD_SENT].includes(this.quest.status)) {
            this.showRealityTaskModal();
        }
    }

    triggerGrandmaFirstContact() {
        this.quest.firstContact();
        this.updateQuestVisuals();
        this.playGrandmaReject();
        this.showQuestDialog(QUEST_COPY.firstContact);
    }

    playGrandmaReject() {
        const shock = this.add.circle(this.grandma.x, this.grandma.y - 94, 12, 0xd44a45, 0.24)
            .setDepth(5000);
        this.tweens.add({
            targets: shock,
            radius: 120,
            alpha: 0,
            duration: 520,
            ease: 'Sine.easeOut',
            onComplete: () => shock.destroy()
        });
        this.tweens.add({
            targets: this.player,
            x: this.player.x - Math.sign(this.grandma.x - this.player.x || 1) * 16,
            duration: 80,
            yoyo: true,
            repeat: 1
        });
    }

    showQuestDialog(copy, optionsOverride = null) {
        this.closeQuestDialog();
        const width = this.scale.width;
        const height = this.scale.height;
        const panelWidth = Math.min(width - 32, 760);
        const options = optionsOverride ?? copy.options ?? [{ label: '知道了', action: 'close' }];
        this.questDialogOptions = options;
        const panelHeight = 128 + options.length * 48;
        const panelX = width / 2;
        const panelY = height - panelHeight / 2 - 24;
        const container = this.add.container(0, 0).setDepth(9400).setScrollFactor(0);
        const bg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xfff0d8, 0.96)
            .setStrokeStyle(4, 0x8b5d52, 0.95);
        if (options.length === 1) {
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => this.handleQuestAction(options[0].action));
        }
        const name = this.add.text(panelX - panelWidth / 2 + 26, panelY - panelHeight / 2 + 18, copy.name ?? '墨墨', {
            fontFamily: 'sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#7b3f54'
        });
        const text = this.add.text(panelX - panelWidth / 2 + 26, panelY - panelHeight / 2 + 52, copy.text, {
            fontFamily: 'sans-serif',
            fontSize: '17px',
            color: '#513f3b',
            lineSpacing: 5,
            wordWrap: { width: panelWidth - 52 }
        });
        container.add([bg, name, text]);
        options.forEach((option, index) => {
            const buttonY = panelY + panelHeight / 2 - 32 - (options.length - 1 - index) * 46;
            this.addQuestButton(container, panelX, buttonY, Math.min(panelWidth - 54, 320), 34, option.label, () => {
                this.handleQuestAction(option.action);
            });
        });
        this.questDialog = container;
    }

    addQuestButton(container, x, y, width, height, label, callback) {
        const bg = this.add.rectangle(x, y, width, height, 0x7fb177, 0.96)
            .setStrokeStyle(2, 0x416a4a, 0.95);
        const text = this.add.text(x, y, label, {
            fontFamily: 'sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#fffaf0',
            wordWrap: { width: width - 18 }
        }).setOrigin(0.5);
        const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => bg.setFillStyle(0x91c982, 1));
        zone.on('pointerout', () => bg.setFillStyle(0x7fb177, 0.96));
        zone.on('pointerdown', callback);
        container.add([bg, text, zone]);
        return zone;
    }

    handleQuestAction(action) {
        this.lastQuestActionAt = this.time.now;
        if (action === 'close') {
            this.closeQuestDialog();
            return;
        }
        if (action === 'acceptFromGrandma') {
            this.quest.accept();
            this.triggerGrandmaFirstContact();
            return;
        }
        if (action === 'acceptQuest') {
            this.quest.accept();
            this.updateQuestVisuals();
            this.showQuestDialog({
                name: '墨墨',
                text: '河边很安静。我们慢慢靠近，不用急着把她变好。'
            });
            return;
        }
        if (action === 'hangQuest') {
            this.quest.hang();
            this.updateQuestVisuals();
            this.showQuestDialog(QUEST_COPY.hanging);
            return;
        }
        if (action === 'leaveGrandma') {
            this.quest.hang();
            this.updateQuestVisuals();
            this.hideQuestTray();
            this.showQuestDialog(QUEST_COPY.leave);
            return;
        }
        if (action === 'tryAgain') {
            this.quest.promptMindMirror();
            this.updateQuestVisuals();
            this.showMindMirrorTray();
            this.showQuestDialog(QUEST_COPY.mindMirrorPrompt);
            return;
        }
        if (action === 'answerAnger') {
            this.quest.retryDialogue();
            this.updateQuestVisuals();
            this.showQuestDialog(QUEST_COPY.wrongAnswer, [
                { label: '再想想', action: 'showMindAnswer' }
            ]);
            return;
        }
        if (action === 'showMindAnswer') {
            this.showQuestDialog(QUEST_COPY.mindReadSuccess);
            return;
        }
        if (action === 'answerLoneliness') {
            this.quest.unlockMaze();
            this.updateQuestVisuals();
            this.showQuestDialog(QUEST_COPY.unlockMaze, [
                { label: '进入光球', action: 'openMaze' },
                { label: '先准备一下', action: 'close' }
            ]);
            return;
        }
        if (action === 'openMaze') {
            this.closeQuestDialog();
            this.openMemoryMaze();
            return;
        }
        if (action === 'collectGrass') {
            this.collectToleranceGrass();
            return;
        }
        if (action === 'showReality') {
            this.showRealityTaskModal();
            return;
        }
        if (action === 'simulateNextDay') {
            this.showDelayedRewardModal();
            return;
        }
        if (action === 'closeReality') {
            this.closeRealityTaskModal();
        }
    }

    closeQuestDialog() {
        this.questDialog?.destroy();
        this.questDialog = null;
        this.questDialogOptions = null;
    }

    showMindMirrorTray() {
        this.hideQuestTray();
        const width = this.scale.width;
        const height = this.scale.height;
        const bg = this.add.rectangle(width - 96, height - 82, 132, 116, 0xfff0d8, 0.92)
            .setScrollFactor(0)
            .setDepth(8500)
            .setStrokeStyle(3, 0x8b5d52, 0.85);
        const item = this.add.image(width - 96, height - 88, 'sg_mind_mirror')
            .setScale(0.72)
            .setScrollFactor(0)
            .setDepth(8501)
            .setInteractive({ useHandCursor: true });
        const label = this.add.text(width - 96, height - 34, '读心镜', {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#513f3b'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(8501);
        this.input.setDraggable(item);
        item.setData('questDragType', 'mindMirror');
        item.setData('homeX', item.x);
        item.setData('homeY', item.y);
        this.questTray = { bg, label, items: [item] };
    }

    showGiftTray() {
        this.hideQuestTray();
        const width = this.scale.width;
        const height = this.scale.height;
        const bg = this.add.rectangle(width - 142, height - 82, 224, 116, 0xfff0d8, 0.92)
            .setScrollFactor(0)
            .setDepth(8500)
            .setStrokeStyle(3, 0x8b5d52, 0.85);
        const items = [
            { key: 'sg_ordinary_crop', id: 'ordinary_crop', label: '普通作物', x: width - 188 },
            { key: 'sg_tolerance_grass', id: 'tolerance_grass', label: '宽容草', x: width - 96 }
        ].map((entry) => {
            const icon = this.add.image(entry.x, height - 90, entry.key)
                .setScale(0.62)
                .setScrollFactor(0)
                .setDepth(8501)
                .setInteractive({ useHandCursor: true });
            const label = this.add.text(entry.x, height - 34, entry.label, {
                fontFamily: 'sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#513f3b'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(8501);
            this.input.setDraggable(icon);
            icon.setData('questDragType', 'gift');
            icon.setData('itemId', entry.id);
            icon.setData('homeX', icon.x);
            icon.setData('homeY', icon.y);
            icon.setData('label', label);
            return icon;
        });
        this.questTray = { bg, items, labels: items.map((item) => item.getData('label')) };
    }

    hideQuestTray() {
        if (!this.questTray) return;
        this.questTray.bg?.destroy();
        this.questTray.label?.destroy();
        this.questTray.labels?.forEach((label) => label.destroy());
        this.questTray.items?.forEach((item) => item.destroy());
        this.questTray = null;
    }

    handleQuestDrag(pointer, gameObject) {
        if (!gameObject.getData('questDragType')) return;
        gameObject.setPosition(pointer.x, pointer.y);
    }

    handleQuestDragEnd(pointer, gameObject) {
        const type = gameObject.getData('questDragType');
        if (!type) return;

        if (type === 'memoryBall') {
            this.handleMemoryBallDrop(pointer, gameObject);
            return;
        }

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const distanceToGrandma = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, this.grandma.x, this.grandma.y);
        if (type === 'mindMirror' && distanceToGrandma < 130) {
            this.openMindMirrorPanel();
            return;
        }
        if (type === 'gift' && distanceToGrandma < 130) {
            this.handleGiftDrop(gameObject.getData('itemId'));
            return;
        }
        this.resetDraggableToHome(gameObject);
    }

    resetDraggableToHome(gameObject) {
        this.tweens.add({
            targets: gameObject,
            x: gameObject.getData('homeX'),
            y: gameObject.getData('homeY'),
            duration: 150,
            ease: 'Sine.easeOut'
        });
    }

    openMindMirrorPanel() {
        this.hideQuestTray();
        this.closeQuestDialog();
        this.mindMirrorHoldMs = 0;
        this.mindMirrorHolding = false;
        const width = this.scale.width;
        const height = this.scale.height;
        const panelWidth = Math.min(width - 48, 520);
        const panelHeight = 300;
        const x = width / 2;
        const y = height / 2;
        const container = this.add.container(0, 0).setDepth(9600).setScrollFactor(0);
        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1618, 0.42);
        const bg = this.add.rectangle(x, y, panelWidth, panelHeight, 0xf7e4d0, 0.98)
            .setStrokeStyle(4, 0x6c4b58, 1);
        const mirror = this.add.image(x, y - 78, 'sg_mind_mirror').setScale(0.9);
        const title = this.add.text(x, y - 128, '读心镜', {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#6c3e55'
        }).setOrigin(0.5);
        const surface = this.add.text(x, y - 24, '表层情绪：愤怒', {
            fontFamily: 'sans-serif',
            fontSize: '18px',
            color: '#a4443e'
        }).setOrigin(0.5);
        const hint = this.add.text(x, y + 8, '按住 Space 继续聚焦', {
            fontFamily: 'sans-serif',
            fontSize: '15px',
            color: '#5b4a4a'
        }).setOrigin(0.5);
        const progressBg = this.add.rectangle(x, y + 48, panelWidth - 96, 14, 0x8f7774, 0.35);
        const progressFill = this.add.rectangle(x - (panelWidth - 96) / 2, y + 48, 1, 14, 0x7bc1e8, 0.9)
            .setOrigin(0, 0.5);
        const holdZone = this.add.zone(x, y - 78, 120, 120).setInteractive({ useHandCursor: true });
        holdZone.on('pointerdown', () => {
            this.mindMirrorHolding = true;
            hint.setText('扫描中……不要松手');
        });
        holdZone.on('pointerup', () => this.interruptMindMirrorScan(hint));
        holdZone.on('pointerout', () => this.interruptMindMirrorScan(hint));
        container.add([dim, bg, title, mirror, surface, hint, progressBg, progressFill, holdZone]);
        this.addQuestButton(container, x, y + 116, 156, 34, '放弃', () => {
            this.closeMindMirrorPanel(true);
        });
        this.mindMirrorUi = { container, progressFill, progressWidth: panelWidth - 96, hint };
    }

    interruptMindMirrorScan(hint) {
        if (!this.mindMirrorUi || this.mindMirrorHoldMs <= 0) return;
        if (this.mindMirrorHoldMs >= 2500) return;
        this.mindMirrorHolding = false;
        if (this.keySpace?.isDown) return;
        this.mindMirrorHoldMs = 0;
        this.quest.failMindRead();
        this.updateMindMirrorProgress();
        hint.setText('扫描中断，请重新按住 Space');
        this.updateQuestVisuals();
    }

    updateMindMirror(delta) {
        if (!this.mindMirrorUi) return;
        const isHolding = this.mindMirrorHolding || this.keySpace?.isDown;
        if (!isHolding) {
            if (this.mindMirrorHoldMs > 0) this.interruptMindMirrorScan(this.mindMirrorUi.hint);
            return;
        }
        this.mindMirrorUi.hint.setText(this.keySpace?.isDown ? '按住 Space 扫描中……' : '扫描中……不要松手');
        this.mindMirrorHoldMs += delta;
        this.updateMindMirrorProgress();
        if (this.mindMirrorHoldMs >= 2500) {
            this.completeMindMirrorScan();
        }
    }

    updateMindMirrorProgress() {
        if (!this.mindMirrorUi) return;
        const ratio = Math.min(1, this.mindMirrorHoldMs / 2500);
        this.mindMirrorUi.progressFill.setSize(Math.max(1, this.mindMirrorUi.progressWidth * ratio), 14);
    }

    completeMindMirrorScan() {
        this.mindMirrorHolding = false;
        this.lastQuestActionAt = this.time.now;
        this.keySpace?.reset?.();
        this.closeMindMirrorPanel(false);
        this.quest.completeMindRead();
        this.updateQuestVisuals();
        this.showQuestDialog(QUEST_COPY.mindReadSuccess);
    }

    closeMindMirrorPanel(abandoned) {
        this.mindMirrorUi?.container.destroy();
        this.mindMirrorUi = null;
        this.mindMirrorHolding = false;
        this.mindMirrorHoldMs = 0;
        if (abandoned) {
            this.quest.failMindRead();
            this.updateQuestVisuals();
            this.showMindMirrorTray();
            this.showQuestDialog(QUEST_COPY.mindReadInterrupted);
        }
    }

    openMemoryMaze() {
        if (this.quest.status !== QUEST_STATUS.MAZE_UNLOCKED) return;
        this.closeQuestDialog();
        this.hideQuestTray();
        const width = this.scale.width;
        const height = this.scale.height;
        const panelWidth = Math.min(width - 36, 980);
        const panelHeight = Math.min(height - 36, 620);
        const panelX = width / 2;
        const panelY = height / 2;
        const leftZone = new Phaser.Geom.Rectangle(panelX - panelWidth / 2 + 30, panelY - panelHeight / 2 + 86, 220, panelHeight - 172);
        const rightZone = new Phaser.Geom.Rectangle(panelX + panelWidth / 2 - 250, panelY - panelHeight / 2 + 86, 220, panelHeight - 172);
        const container = this.add.container(0, 0).setDepth(9700).setScrollFactor(0);
        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x15121c, 0.62);
        const bg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x271f35, 0.98)
            .setStrokeStyle(4, 0x8a77a6, 1);
        const title = this.add.text(panelX, panelY - panelHeight / 2 + 26, '内心迷宫：整理记忆球', {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#fff0c8'
        }).setOrigin(0.5);
        const painRect = this.add.rectangle(leftZone.centerX, leftZone.centerY, leftZone.width, leftZone.height, 0x17151d, 0.95)
            .setStrokeStyle(3, 0x6b5664, 1);
        const warmRect = this.add.rectangle(rightZone.centerX, rightZone.centerY, rightZone.width, rightZone.height, 0x4b3515, 0.92)
            .setStrokeStyle(3, 0xd0a441, 1);
        const painText = this.add.text(leftZone.centerX, leftZone.y + 20, '痛苦区', {
            fontFamily: 'sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#c7becd'
        }).setOrigin(0.5);
        const warmText = this.add.text(rightZone.centerX, rightZone.y + 20, '温馨区', {
            fontFamily: 'sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffe08f'
        }).setOrigin(0.5);
        const storyBg = this.add.rectangle(panelX, panelY + panelHeight / 2 - 68, panelWidth - 330, 84, 0xfff0d8, 0.95)
            .setStrokeStyle(2, 0x8b5d52, 0.9);
        const storyTitle = this.add.text(panelX - (panelWidth - 390) / 2, panelY + panelHeight / 2 - 96, '先点击一个记忆球', {
            fontFamily: 'sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#6c3e55'
        });
        const storyText = this.add.text(panelX - (panelWidth - 390) / 2, panelY + panelHeight / 2 - 70, '查看故事后，再把它拖到左侧或右侧。', {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#513f3b',
            wordWrap: { width: panelWidth - 390 }
        });
        const countText = this.add.text(panelX, panelY - panelHeight / 2 + 58, '已整理 0 / 6，错误 0', {
            fontFamily: 'sans-serif',
            fontSize: '15px',
            color: '#d8d1e5'
        }).setOrigin(0.5);
        container.add([dim, bg, title, painRect, warmRect, painText, warmText, storyBg, storyTitle, storyText, countText]);

        const centerX = panelX;
        const centerY = panelY - 32;
        const homes = [
            [centerX - 88, centerY - 78], [centerX, centerY - 78], [centerX + 88, centerY - 78],
            [centerX - 88, centerY + 18], [centerX, centerY + 18], [centerX + 88, centerY + 18]
        ];
        const balls = this.quest.memoryBalls.map((ball, index) => {
            const [x, y] = homes[index];
            const icon = this.add.image(x, y, ball.color === 'black' ? 'sg_memory_pain' : 'sg_memory_warmth')
                .setScale(0.66)
                .setScrollFactor(0)
                .setDepth(9702)
                .setInteractive({
                    hitArea: new Phaser.Geom.Circle(48, 48, 48),
                    hitAreaCallback: Phaser.Geom.Circle.Contains,
                    useHandCursor: true
                });
            icon.setData('questDragType', 'memoryBall');
            icon.setData('ballId', ball.id);
            icon.setData('homeX', x);
            icon.setData('homeY', y);
            this.input.setDraggable(icon);
            icon.on('pointerdown', () => {
                icon.setData('viewedBeforePress', ball.viewed);
                this.showMemoryBallStory(ball.id);
            });
            return icon;
        });
        this.mazeUi = { container, leftZone, rightZone, balls, storyTitle, storyText, countText, rewardShown: false };
        this.updateMazeCountText();
    }

    showMemoryBallStory(ballId) {
        if (!this.mazeUi) return;
        const ball = this.quest.viewBall(ballId);
        if (!ball) return;
        this.mazeUi.storyTitle.setText(ball.title);
        this.mazeUi.storyText.setText(ball.storyText);
    }

    handleMemoryBallDrop(pointer, gameObject) {
        if (!this.mazeUi) return;
        const zone = Phaser.Geom.Rectangle.Contains(this.mazeUi.leftZone, pointer.x, pointer.y)
            ? 'pain'
            : Phaser.Geom.Rectangle.Contains(this.mazeUi.rightZone, pointer.x, pointer.y)
                ? 'warmth'
                : null;
        if (!zone) {
            this.resetDraggableToHome(gameObject);
            return;
        }
        const ballId = gameObject.getData('ballId');
        if (!gameObject.getData('viewedBeforePress')) {
            this.showMemoryBallStory(ballId);
            this.mazeUi.storyText.setText('先读完这段记忆，再帮它找位置。');
            this.resetDraggableToHome(gameObject);
            return;
        }
        const result = this.quest.classifyBall(ballId, zone);
        if (!result.ok && result.reason === 'not_viewed') {
            this.showMemoryBallStory(ballId);
            this.mazeUi.storyText.setText('先看清这段记忆，再帮它找位置。');
            this.resetDraggableToHome(gameObject);
            return;
        }
        if (!result.ok) {
            this.mazeUi.storyTitle.setText('好像放错地方了');
            this.mazeUi.storyText.setText('墨墨轻轻提醒：这个记忆也许属于另一边。再试试？');
            this.emitMazeThorns(pointer.x, pointer.y);
            this.resetDraggableToHome(gameObject);
            this.updateMazeCountText();
            return;
        }
        gameObject.disableInteractive();
        this.tweens.add({
            targets: gameObject,
            scale: 0,
            alpha: 0,
            duration: 220,
            ease: 'Back.easeIn',
            onComplete: () => gameObject.destroy()
        });
        this.mazeUi.storyTitle.setText('咔哒');
        this.mazeUi.storyText.setText('这段记忆安静地落到了合适的位置。');
        this.updateMazeCountText();
        if (this.quest.classifiedCount >= this.quest.memoryBalls.length) {
            this.time.delayedCall(260, () => this.showMazeReward());
        }
    }

    emitMazeThorns(x, y) {
        if (!this.mazeUi) return;
        const thorns = [];
        for (let i = 0; i < 5; i += 1) {
            const line = this.add.line(x, y, -16 + i * 8, 14, -4 + i * 6, -14, 0x5b2f42, 0.9)
                .setLineWidth(3);
            this.mazeUi.container.add(line);
            thorns.push(line);
        }
        this.tweens.add({
            targets: thorns,
            alpha: 0,
            duration: 520,
            onComplete: () => thorns.forEach((line) => line.destroy())
        });
    }

    updateMazeCountText() {
        if (!this.mazeUi) return;
        this.mazeUi.countText.setText(`已整理 ${this.quest.classifiedCount} / ${this.quest.memoryBalls.length}，错误 ${this.quest.wrongCount}`);
        this.updateQuestVisuals();
    }

    showMazeReward() {
        if (!this.mazeUi || this.mazeUi.rewardShown) return;
        this.mazeUi.rewardShown = true;
        const width = this.scale.width;
        const height = this.scale.height;
        const resultType = this.quest.getMazeResultType();
        const bg = this.add.rectangle(width / 2, height / 2, 360, 230, resultType === 'perfect' ? 0xfff1bf : 0xf1dfd6, 0.98)
            .setScrollFactor(0)
            .setDepth(9710)
            .setStrokeStyle(4, resultType === 'perfect' ? 0xc9972f : 0x8b5d52, 1);
        const grass = this.add.image(width / 2, height / 2 - 34, 'sg_tolerance_grass')
            .setScale(0.82)
            .setScrollFactor(0)
            .setDepth(9711);
        const title = this.add.text(width / 2, height / 2 - 104, resultType === 'perfect' ? '迷宫亮了起来' : '慢慢整理好了', {
            fontFamily: 'sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#6c3e55'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(9711);
        const text = this.add.text(width / 2, height / 2 + 36, resultType === 'perfect'
            ? '宽容草长出来了。墨墨变得金灿灿的。'
            : '宽容草长出来了。墨墨说：没关系，我们慢慢来。', {
            fontFamily: 'sans-serif',
            fontSize: '15px',
            color: '#513f3b',
            wordWrap: { width: 300 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(9711);
        const buttonBg = this.add.rectangle(width / 2, height / 2 + 88, 180, 34, 0x7fb177, 0.96)
            .setScrollFactor(0)
            .setDepth(9712)
            .setStrokeStyle(2, 0x416a4a, 0.95);
        const buttonText = this.add.text(width / 2, height / 2 + 88, '摘取宽容草', {
            fontFamily: 'sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#fffaf0'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(9713);
        const buttonZone = this.add.zone(width / 2, height / 2 + 88, 190, 44)
            .setScrollFactor(0)
            .setDepth(9714)
            .setInteractive({ useHandCursor: true });
        buttonZone.on('pointerover', () => buttonBg.setFillStyle(0x91c982, 1));
        buttonZone.on('pointerout', () => buttonBg.setFillStyle(0x7fb177, 0.96));
        buttonZone.on('pointerdown', () => this.collectToleranceGrass());
        this.mazeUi.rewardItems = [bg, grass, title, text, buttonBg, buttonText, buttonZone];
    }

    collectToleranceGrass() {
        this.quest.obtainToleranceGrass();
        this.closeMemoryMaze();
        this.updateQuestVisuals();
        this.showGiftTray();
        this.showQuestDialog({
            name: '墨墨',
            text: '宽容草已经进背包了。回到河边，把它拖给石头奶奶吧。'
        });
    }

    closeMemoryMaze() {
        this.mazeUi?.balls?.forEach((ball) => {
            if (ball?.scene) ball.destroy();
        });
        this.mazeUi?.rewardItems?.forEach((item) => {
            if (item?.scene) item.destroy();
        });
        this.mazeUi?.container.destroy();
        this.mazeUi = null;
    }

    handleGiftDrop(itemId) {
        if (itemId !== 'tolerance_grass') {
            this.quest.giftWrongItem();
            this.updateQuestVisuals();
            this.showGiftTray();
            this.showQuestDialog(QUEST_COPY.wrongGift);
            return;
        }
        const resultType = this.quest.getMazeResultType();
        this.quest.complete();
        this.updateQuestVisuals();
        this.hideQuestTray();
        this.emitQuestSparkles(this.grandma.x, this.grandma.y - 110, 0xffe59a, 9);
        this.showQuestDialog(resultType === 'perfect' ? QUEST_COPY.completedPerfect : QUEST_COPY.completedLow, [
            { label: '查看陪伴记录卡', action: 'showReality' }
        ]);
    }

    showRealityTaskModal() {
        this.closeQuestDialog();
        this.closeRealityTaskModal();
        const width = this.scale.width;
        const height = this.scale.height;
        const panelWidth = Math.min(width - 44, 760);
        const panelHeight = Math.min(height - 44, 520);
        const x = width / 2;
        const y = height / 2;
        const container = this.add.container(0, 0).setDepth(9800).setScrollFactor(0);
        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x231c1c, 0.5);
        const bg = this.add.rectangle(x, y, panelWidth, panelHeight, 0xfff1dd, 0.98)
            .setStrokeStyle(4, 0x8b5d52, 1);
        const card = this.add.image(x - panelWidth / 2 + 116, y - panelHeight / 2 + 130, 'sg_record_card').setScale(0.9);
        const title = this.add.text(x, y - panelHeight / 2 + 26, '现实陪伴任务', {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#7b3f54'
        }).setOrigin(0.5);
        const quote = this.add.text(x - panelWidth / 2 + 228, y - panelHeight / 2 + 72, '有时候一个人看起来很凶，其实只是心里有点难过。', {
            fontFamily: 'sans-serif',
            fontSize: '17px',
            color: '#513f3b',
            wordWrap: { width: panelWidth - 270 }
        });
        container.add([dim, bg, card, title, quote]);
        REAL_WORLD_TASKS.forEach((task, index) => {
            const rowY = y - panelHeight / 2 + 128 + index * 70;
            const taskTitle = this.add.text(x - panelWidth / 2 + 228, rowY, task.title, {
                fontFamily: 'sans-serif',
                fontSize: '17px',
                fontStyle: 'bold',
                color: '#6c3e55'
            });
            const taskText = this.add.text(x - panelWidth / 2 + 228, rowY + 24, task.text, {
                fontFamily: 'sans-serif',
                fontSize: '14px',
                color: '#513f3b',
                wordWrap: { width: panelWidth - 270 }
            });
            container.add([taskTitle, taskText]);
        });
        this.addQuestButton(container, x - 94, y + panelHeight / 2 - 42, 170, 36, '模拟次日', () => {
            this.handleQuestAction('simulateNextDay');
        });
        this.addQuestButton(container, x + 104, y + panelHeight / 2 - 42, 170, 36, '继续待一会儿', () => {
            this.handleQuestAction('closeReality');
        });
        this.realityUi = container;
    }

    showDelayedRewardModal() {
        this.quest.sendDelayedReward();
        this.updateQuestVisuals();
        this.closeRealityTaskModal();
        const width = this.scale.width;
        const height = this.scale.height;
        const container = this.add.container(0, 0).setDepth(9800).setScrollFactor(0);
        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x231c1c, 0.48);
        const bg = this.add.rectangle(width / 2, height / 2, 470, 300, 0xfff1dd, 0.98)
            .setStrokeStyle(4, 0x8b5d52, 1);
        const seed = this.add.image(width / 2, height / 2 - 68, 'sg_companion_vine_seed').setScale(0.92);
        const title = this.add.text(width / 2, height / 2 - 128, '次日邮箱', {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#7b3f54'
        }).setOrigin(0.5);
        const text = this.add.text(width / 2, height / 2 + 22, '石头奶奶寄来感谢信：谢谢你的陪伴。\n附件：陪伴藤种子 x1\n第三章已解锁：夏之喧嚣——当刺猬遇到风暴', {
            fontFamily: 'sans-serif',
            fontSize: '16px',
            color: '#513f3b',
            align: 'center',
            lineSpacing: 6,
            wordWrap: { width: 390 }
        }).setOrigin(0.5);
        container.add([dim, bg, seed, title, text]);
        this.addQuestButton(container, width / 2, height / 2 + 116, 170, 36, '收下', () => {
            this.handleQuestAction('closeReality');
        });
        this.realityUi = container;
    }

    closeRealityTaskModal() {
        this.realityUi?.destroy();
        this.realityUi = null;
    }

    updateQuestVisuals() {
        if (!this.quest || !this.grandma) return;
        this.grandma.setTexture(this.quest.getGrandmaTexture());
        this.grandma.clearTint();
        if (this.quest.status === QUEST_STATUS.FIRST_CONTACT) this.grandma.setTint(0xb9aaa0);
        if (this.quest.status === QUEST_STATUS.MAZE_UNLOCKED) this.showLightOrb();
        else this.hideLightOrb();

        if (this.momo) {
            this.momo.clearTint();
            if ([QUEST_STATUS.FIRST_CONTACT, QUEST_STATUS.MIND_READ_FAILED].includes(this.quest.status)) {
                this.momo.setTint(0xdedede);
            } else if (this.quest.status === QUEST_STATUS.MIND_MIRROR_PROMPTED) {
                this.momo.setTint(0xffe79a);
            } else if ([QUEST_STATUS.MAZE_COMPLETED_PERFECT, QUEST_STATUS.COMPLETED, QUEST_STATUS.DELAYED_REWARD_SENT].includes(this.quest.status)) {
                this.momo.setTint(0xffd76c);
            }
        }
    }

    showLightOrb() {
        if (this.lightOrb) return;
        this.lightOrb = this.add.image(this.grandma.x - 112, this.grandma.y - 74, 'sg_light_orb')
            .setDepth(this.grandma.y + 80)
            .setScale(0.82)
            .setInteractive({ useHandCursor: true });
        this.lightOrb.on('pointerdown', () => this.openMemoryMaze());
        this.tweens.add({
            targets: this.lightOrb,
            y: this.lightOrb.y - 10,
            alpha: 0.72,
            duration: 950,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    hideLightOrb() {
        if (!this.lightOrb) return;
        this.lightOrb.destroy();
        this.lightOrb = null;
    }

    emitQuestSparkles(x, y, color, count) {
        const emitter = this.add.particles(x, y, '__WHITE', {
            tint: color,
            speed: { min: 18, max: 70 },
            angle: { min: 0, max: 360 },
            gravityY: -30,
            scale: { start: 1.6, end: 0 },
            lifespan: 560,
            quantity: count,
            maxParticles: count
        });
        emitter.setDepth(6200);
        this.time.delayedCall(760, () => emitter.destroy());
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
            styleLabGrandma: this.grandma?.texture?.key ?? '',
            styleLabQuestStatus: this.quest?.status ?? '',
            styleLabQuestWrongCount: (this.quest?.wrongCount ?? 0).toString(),
            styleLabQuestCompleted: [QUEST_STATUS.COMPLETED, QUEST_STATUS.DELAYED_REWARD_SENT].includes(this.quest?.status) ? 'true' : 'false',
            styleLabQuestHasGrass: this.quest?.hasToleranceGrass ? 'true' : 'false',
            styleLabWaterTiles: (this.waterTiles?.length ?? 0).toString(),
            styleLabBlockers: (this.blockers?.getChildren?.().length ?? 0).toString(),
            styleLabTreeVariants: uniqueTrees.size.toString(),
            styleLabFoliageVariants: uniqueFoliage.size.toString()
        });
    }
}
