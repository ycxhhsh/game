import Phaser from 'phaser';
import StyleLabScene from './StyleLabScene';
import StyleLabInteriorScene from './StyleLabInteriorScene';

window.addEventListener('error', (event) => {
    document.body.dataset.styleLabError = event.message;
});
window.addEventListener('unhandledrejection', (event) => {
    document.body.dataset.styleLabError = String(event.reason?.message ?? event.reason);
});

const startInside = new URLSearchParams(window.location.search).has('interior');

const config = {
    type: Phaser.AUTO,
    parent: 'style-lab-root',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#6fbf7b',
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    loader: {
        imageLoadType: 'HTMLImageElement',
        maxParallelDownloads: 128
    },
    scene: startInside ? [StyleLabInteriorScene, StyleLabScene] : [StyleLabScene, StyleLabInteriorScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
window.__STYLE_LAB_GAME__ = game;
document.body.dataset.styleLabBoot = 'true';
window.setInterval(() => {
    document.body.dataset.styleLabScenes = game.scene.scenes
        .map((scene) => `${scene.scene.key}:${scene.scene.settings.status}`)
        .join('|');
}, 500);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
