import Phaser from 'phaser';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './ui/App.vue';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import RoomScene from './scenes/RoomScene';

const config = {
    type: Phaser.AUTO,
    parent: 'app',
    pixelArt: true, // 极其重要：关闭所有 WebGL/Canvas 抗锯齿
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 540 // 改为 16:9 的原生 PC 视野比例
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, GameScene, RoomScene]
};

// 实例化 Vue 组件及 Pinia 状态管理
const vueApp = createApp(App);
const pinia = createPinia();
vueApp.use(pinia);
vueApp.mount('#vue-app');

// 实例化游戏
const game = new Phaser.Game(config);

// Resize Vue overlay to match Phaser canvas scaling
game.scale.on('resize', (gameSize, baseSize, displaySize, resolution) => {
    const vueApp = document.getElementById('vue-app');
    if (vueApp) {
        const scaleX = displaySize.width / baseSize.width;
        const scaleY = displaySize.height / baseSize.height;
        vueApp.style.transform = `scale(${scaleX}, ${scaleY})`;
    }
});

