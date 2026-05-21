import Phaser from 'phaser';
import StyleLabScene from './StyleLabScene';

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
    scene: [StyleLabScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
window.__STYLE_LAB_GAME__ = game;

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
