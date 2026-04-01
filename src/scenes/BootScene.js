import Phaser from 'phaser';
import { PALETTE, SPRITES_DATA } from '../utils/constants';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // 在内存中一次性把 ASCII 画布转换为 Phaser 的原生 WebGL Textures
        this.generateTextures();
        // 加载预设纯色块材质
        this.load.image('__WHITE', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVrvw8DEQQEGBsAgwAFAAEEAAA418k8VwAAAABJRU5ErkJggg==');
        this.load.image('grandma_portrait', 'grandma_portrait.png');
        this.load.image('grandma_hd', 'grandma_hd.png');
        this.load.image('house_hd', 'house_hd.png');
        this.load.image('tree_hd', 'tree_hd.png');
        this.load.image('tree_oak', 'tree_oak.png');
        this.load.image('tree_pine', 'tree_pine.png');
        this.load.image('flower_hd', 'flower_hd.png');
        this.load.image('flower_tulip', 'flower_tulip.png');
        this.load.image('grass_hd', 'grass_hd.png');
        this.load.image('grass_weed', 'grass_weed.png');
        this.load.image('player_hd', 'player_hd.png');
        this.load.image('player_hd_up', 'player_hd_up.png');
        this.load.image('hat_straw', 'hat_straw.png');
        this.load.image('hoe_tool', 'hoe_tool.png');

        // 加载泰拉瑞亚骨骼拆解散件
        this.load.image('rig_head', 'comp_0_head_or_torso_200x179.png');
        this.load.image('rig_torso', 'comp_1_head_or_torso_231x182.png');
        
        // 修正用户反馈的镜像左右手脚反向问题
        this.load.image('rig_arm_l', 'comp_2_leg_or_arm_64x191.png');
        this.load.image('rig_arm_r', 'comp_3_leg_or_arm_85x231.png');
        this.load.image('rig_leg_r', 'comp_5_leg_or_arm_139x248.png');
        this.load.image('rig_leg_l', 'comp_6_leg_or_arm_139x247.png');
    }

    create() {
        this.generateTextures();
        this.createAnimations();
        this.scene.start('GameScene');
    }

    generateTextures() {
        for (const [key, spriteLines] of Object.entries(SPRITES_DATA)) {
            // Constrain all pixel art scale to 2x for global unity
            const h = spriteLines.length;
            const w = spriteLines[0] ? spriteLines[0].length : 16;
            const scaleX = 2; 
            const scaleY = 2;
            
            const canvas = document.createElement('canvas');
            canvas.width = w * scaleX; 
            canvas.height = h * scaleY;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let y = 0; y < h; y++) {
                if (!spriteLines[y]) continue;
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

    createAnimations() {
        const dirs = ['down', 'up', 'right'];
        dirs.forEach(dir => {
            if (this.anims.exists(`walk-${dir}`)) this.anims.remove(`walk-${dir}`);
            this.anims.create({
                key: `walk-${dir}`,
                frames: [
                    { key: `player_${dir}` },
                    { key: `player_${dir}_w1` },
                    { key: `player_${dir}` },
                    { key: `player_${dir}_w2` }
                ],
                frameRate: 6, repeat: -1
            });
        });
    }
}
