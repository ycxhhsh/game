import Phaser from 'phaser';

const TILE = 64;

const TILE_KEYS = [
    ['tile_grass_a', 'assets/style-lab/tiles/grass_a.png'],
    ['tile_grass_b', 'assets/style-lab/tiles/grass_b.png'],
    ['tile_grass_c', 'assets/style-lab/tiles/grass_c.png'],
    ['tile_dirt_a', 'assets/style-lab/tiles/dirt_a.png'],
    ['tile_dirt_b', 'assets/style-lab/tiles/dirt_b.png'],
    ['tile_tilled_a', 'assets/style-lab/tiles/tilled_a.png'],
    ['tile_tilled_b', 'assets/style-lab/tiles/tilled_b.png'],
    ['tile_water_1', 'assets/style-lab/tiles/water_1.png'],
    ['tile_water_2', 'assets/style-lab/tiles/water_2.png'],
    ['tile_path_a', 'assets/style-lab/tiles/path_a.png'],
    ['tile_path_b', 'assets/style-lab/tiles/path_b.png']
];

const OBJECT_KEYS = [
    ['obj_tree_broadleaf', 'assets/style-lab/objects/tree_broadleaf.png'],
    ['obj_tree_pine', 'assets/style-lab/objects/tree_pine.png'],
    ['obj_tree_flowering', 'assets/style-lab/objects/tree_flowering.png'],
    ['obj_tree_fruit', 'assets/style-lab/objects/tree_fruit.png'],
    ['obj_tree_shrub', 'assets/style-lab/objects/tree_shrub.png'],
    ['obj_cottage', 'assets/style-lab/objects/cottage.png'],
    ['obj_heart_tree', 'assets/style-lab/objects/heart_tree.png'],
    ['fol_grass_tuft', 'assets/style-lab/foliage/grass_tuft.png'],
    ['fol_wildflower_white', 'assets/style-lab/foliage/wildflower_white.png'],
    ['fol_dandelion', 'assets/style-lab/foliage/dandelion.png'],
    ['fol_mushroom', 'assets/style-lab/foliage/mushroom.png'],
    ['fol_fern', 'assets/style-lab/foliage/fern.png'],
    ['fol_stone_edge_grass', 'assets/style-lab/foliage/stone_edge_grass.png'],
    ['fol_flower_pink', 'assets/style-lab/foliage/flower_pink.png'],
    ['fol_flower_yellow', 'assets/style-lab/foliage/flower_yellow.png'],
    ['prop_rock', 'assets/style-lab/props/rock.png'],
    ['prop_fence', 'assets/style-lab/props/fence.png'],
    ['prop_sign', 'assets/style-lab/props/sign.png'],
    ['prop_bucket', 'assets/style-lab/props/bucket.png'],
    ['soft_shadow', 'assets/style-lab/soft_shadow.png']
];

export default class StyleLabScene extends Phaser.Scene {
    constructor() {
        super('StyleLabScene');
        this.mapCols = 34;
        this.mapRows = 24;
        this.lastNatureKeys = [];
        this.playerDirection = 'down';
    }

    preload() {
        TILE_KEYS.forEach(([key, path]) => this.load.image(key, path));
        OBJECT_KEYS.forEach(([key, path]) => this.load.image(key, path));

        this.load.spritesheet('lab_player_down', 'asset/player_walk_down.png', {
            frameWidth: 266,
            frameHeight: 431
        });
        this.load.spritesheet('lab_player_up', 'asset/player_walk_up.png', {
            frameWidth: 231,
            frameHeight: 394
        });
        this.load.spritesheet('lab_player_left', 'asset/player_walk_left.png', {
            frameWidth: 251,
            frameHeight: 446
        });
        this.load.spritesheet('lab_player_right', 'asset/player_walk_right.png', {
            frameWidth: 251,
            frameHeight: 446
        });
        this.load.spritesheet('lab_momo_active', 'concepts/current/momo-sheets/momo-active-follow-sheet.png', {
            frameWidth: 160,
            frameHeight: 160
        });
        this.load.spritesheet('lab_grandma_rocking', 'concepts/current/grandma/grandma-rocking-chair-sheet.png', {
            frameWidth: 240,
            frameHeight: 320
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
        [
            ['lab_walk_down', 'lab_player_down'],
            ['lab_walk_up', 'lab_player_up'],
            ['lab_walk_left', 'lab_player_left'],
            ['lab_walk_right', 'lab_player_right'],
            ['lab_momo_run', 'lab_momo_active'],
            ['lab_grandma_idle', 'lab_grandma_rocking']
        ].forEach(([animKey, textureKey]) => {
            if (this.anims.exists(animKey)) this.anims.remove(animKey);
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                frameRate: animKey === 'lab_grandma_idle' ? 4 : 6,
                repeat: -1
            });
        });
    }

    buildGround() {
        const farm = new Set();
        for (let y = 13; y <= 18; y += 1) {
            for (let x = 5; x <= 13; x += 1) farm.add(`${x},${y}`);
        }

        const path = new Set([
            '15,15', '16,15', '17,15', '18,14', '19,14', '20,13', '21,12', '22,11', '23,10', '24,9',
            '14,15', '13,15', '12,15', '11,15', '10,14', '9,13', '8,12', '8,11', '8,10',
            '17,16', '18,16', '19,16', '20,16', '21,15', '22,15', '23,15', '24,15', '25,15'
        ]);

        for (let y = 0; y < this.mapRows; y += 1) {
            for (let x = 0; x < this.mapCols; x += 1) {
                const px = x * TILE;
                const py = y * TILE;
                const key = `${x},${y}`;
                let tile = this.pickGrassTile(x, y);

                if (this.isWaterCell(x, y)) tile = 'tile_water_1';
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
        this.addObject(24 * TILE + 12, 9 * TILE + 42, 'obj_cottage', 1, {
            shadow: [240, 50],
            block: [260, 56, 0, -20]
        });

        this.addObject(8 * TILE + 24, 9 * TILE + 22, 'obj_heart_tree', 1, {
            shadow: [128, 38],
            block: [96, 52, 0, -16]
        });

        this.addObject(4 * TILE + 10, 12 * TILE + 12, 'prop_sign', 0.9);
        this.addObject(14 * TILE + 20, 18 * TILE + 42, 'prop_bucket', 0.86);
        this.addObject(13 * TILE + 14, 12 * TILE + 34, 'prop_fence', 0.85);
        this.addObject(4 * TILE + 8, 19 * TILE + 6, 'prop_fence', 0.85);
    }

    placeNature() {
        const treePool = ['obj_tree_broadleaf', 'obj_tree_pine', 'obj_tree_flowering', 'obj_tree_fruit', 'obj_tree_shrub'];
        const treeSpots = [
            [2, 4], [5, 3], [12, 4], [16, 5], [28, 4], [31, 7],
            [3, 20], [18, 21], [24, 20], [30, 19], [1, 12], [32, 14]
        ];
        treeSpots.forEach(([x, y], index) => {
            const key = this.pickVariant(treePool);
            const scale = key === 'obj_tree_shrub' ? 0.95 : 1;
            this.addObject(x * TILE + 32, y * TILE + 56, key, scale, {
                shadow: [112, 34],
                block: [78, 46, 0, -18],
                flip: index % 3 === 0
            });
        });

        const floraPool = [
            'fol_grass_tuft', 'fol_wildflower_white', 'fol_dandelion', 'fol_mushroom',
            'fol_fern', 'fol_flower_pink', 'fol_flower_yellow'
        ];
        const floraSpots = [
            [6, 9], [7, 10], [10, 9], [11, 11], [2, 9], [3, 11], [15, 9], [18, 10],
            [21, 18], [22, 19], [24, 17], [27, 16], [30, 15], [31, 16], [16, 20], [8, 20],
            [5, 7], [13, 8], [19, 6], [29, 9], [26, 11], [12, 20], [3, 16], [2, 17]
        ];
        floraSpots.forEach(([x, y], index) => {
            const key = this.pickVariant(floraPool);
            this.addObject(x * TILE + 20 + (index % 3) * 12, y * TILE + 38, key, 0.75 + (index % 2) * 0.1);
        });

        [
            [3, 7], [14, 10], [22, 13], [28, 13], [7, 19], [20, 7]
        ].forEach(([x, y], index) => {
            this.addObject(x * TILE + 32, y * TILE + 46, index % 2 ? 'prop_rock' : 'fol_stone_edge_grass', 0.86);
        });
    }

    createCharacters() {
        this.grandma = this.physics.add.sprite(25 * TILE + 24, 13 * TILE + 20, 'lab_grandma_rocking')
            .setOrigin(0.5, 0.94)
            .setScale(0.72)
            .setDepth(13 * TILE + 20);
        this.grandma.play('lab_grandma_idle');
        this.grandma.body.setImmovable(true);
        this.grandma.body.setSize(128, 48);
        this.grandma.body.setOffset(56, 246);
        this.addShadow(this.grandma.x, this.grandma.y + 2, 142, 30, this.grandma.depth - 1);
        this.physics.add.collider(this.grandma, this.blockers);

        this.player = this.physics.add.sprite(15 * TILE + 12, 16 * TILE + 12, 'lab_player_down')
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
        this.updatePlayer();
        this.updateMomo(delta);
    }

    updatePlayer() {
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up = this.cursors.up.isDown || this.keys.W.isDown;
        const down = this.cursors.down.isDown || this.keys.S.isDown;
        const vx = (right ? 1 : 0) - (left ? 1 : 0);
        const vy = (down ? 1 : 0) - (up ? 1 : 0);
        const speed = 210;

        if (vx || vy) {
            const len = Math.hypot(vx, vy) || 1;
            this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
            const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
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

    pickGrassTile(x, y) {
        const mod = (x * 11 + y * 17) % 10;
        if (mod < 2) return 'tile_grass_b';
        if (mod > 7) return 'tile_grass_c';
        return 'tile_grass_a';
    }

    pickVariant(pool) {
        const available = pool.filter((key) => !(this.lastNatureKeys[0] === key && this.lastNatureKeys[1] === key));
        const key = available[(this.lastNatureKeys.length * 3 + pool.length + Math.floor(Math.random() * available.length)) % available.length];
        this.lastNatureKeys.unshift(key);
        this.lastNatureKeys = this.lastNatureKeys.slice(0, 2);
        return key;
    }

    isWaterCell(x, y) {
        return x >= 30 || y >= 22 || (x >= 27 && y >= 20) || (x <= 1 && y >= 8);
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
            styleLabGrandma: this.grandma?.anims?.currentAnim?.key ?? '',
            styleLabWaterTiles: (this.waterTiles?.length ?? 0).toString(),
            styleLabBlockers: (this.blockers?.getChildren?.().length ?? 0).toString(),
            styleLabTreeVariants: uniqueTrees.size.toString(),
            styleLabFoliageVariants: uniqueFoliage.size.toString()
        });
    }
}
