import { TILE } from './styleLabAssets';

export const MAP_COLS = 34;
export const MAP_ROWS = 24;

export const LANDMARKS = {
    playerSpawn: { x: 15 * TILE + 12, y: 16 * TILE + 12 },
    cottage: { x: 24 * TILE + 12, y: 9 * TILE + 42 },
    heartTree: { x: 8 * TILE + 24, y: 9 * TILE + 22 },
    grandma: { x: 25 * TILE + 24, y: 13 * TILE + 20 }
};

export const LANDMARK_PROPS = [
    { x: 4 * TILE + 10, y: 12 * TILE + 12, key: 'prop_sign', scale: 0.9 },
    { x: 14 * TILE + 20, y: 18 * TILE + 42, key: 'prop_bucket', scale: 0.86 },
    { x: 13 * TILE + 14, y: 12 * TILE + 34, key: 'prop_fence', scale: 0.85 },
    { x: 4 * TILE + 8, y: 19 * TILE + 6, key: 'prop_fence', scale: 0.85 }
];

export const TREE_POOL = ['obj_tree_broadleaf', 'obj_tree_pine', 'obj_tree_flowering', 'obj_tree_fruit', 'obj_tree_shrub'];

export const TREE_SPOTS = [
    [2, 4], [5, 3], [12, 4], [16, 5], [28, 4], [31, 7],
    [3, 20], [18, 21], [24, 20], [30, 19], [1, 12], [32, 14]
];

export const FLORA_POOL = [
    'fol_grass_tuft', 'fol_wildflower_white', 'fol_dandelion', 'fol_mushroom',
    'fol_fern', 'fol_stone_edge_grass', 'fol_flower_pink', 'fol_flower_yellow'
];

export const FLORA_SPOTS = [
    [6, 9], [7, 10], [10, 9], [11, 11], [2, 9], [3, 11], [15, 9], [18, 10],
    [21, 18], [22, 19], [24, 17], [27, 16], [30, 15], [31, 16], [16, 20], [8, 20],
    [5, 7], [13, 8], [19, 6], [29, 9], [26, 11], [12, 20], [3, 16], [2, 17]
];

export const GROUND_DETAIL_SPOTS = [
    [3, 7], [14, 10], [22, 13], [28, 13], [7, 19], [20, 7]
];

export function createFarmCells() {
    const farm = new Set();
    for (let y = 13; y <= 18; y += 1) {
        for (let x = 5; x <= 13; x += 1) farm.add(`${x},${y}`);
    }
    return farm;
}

export function createPathCells() {
    return new Set([
        '15,15', '16,15', '17,15', '18,14', '19,14', '20,13', '21,12', '22,11', '23,10', '24,9',
        '14,15', '13,15', '12,15', '11,15', '10,14', '9,13', '8,12', '8,11', '8,10',
        '17,16', '18,16', '19,16', '20,16', '21,15', '22,15', '23,15', '24,15', '25,15'
    ]);
}

export function pickGrassTile(x, y) {
    const mod = (x * 11 + y * 17) % 10;
    if (mod < 2) return 'tile_grass_b';
    if (mod > 7) return 'tile_grass_c';
    return 'tile_grass_a';
}

export function isWaterCell(x, y) {
    return x >= 30 || y >= 22 || (x >= 27 && y >= 20) || (x <= 1 && y >= 8);
}
