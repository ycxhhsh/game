export const TILE = 64;

export const TILE_KEYS = [
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

export const WORLD_OBJECT_KEYS = [
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

export const TOOL_SHEETS = [
    { key: 'lab_tool_hoe', anim: 'lab_tool_hoe', path: 'player_hoe_sheet_unified.png?v=style-lab-v2', frameWidth: 320, frameHeight: 460, frameRate: 8 },
    { key: 'lab_tool_water', anim: 'lab_tool_water', path: 'player_water_sheet_unified.png?v=style-lab-v2', frameWidth: 320, frameHeight: 460, frameRate: 8 },
    { key: 'lab_tool_seed', anim: 'lab_tool_seed', path: 'player_seed_sheet_unified.png?v=style-lab-v2', frameWidth: 320, frameHeight: 460, frameRate: 8 }
];

export const INTERIOR_BACKGROUND = ['sl_cottage_interior', 'assets/style-lab/interior/cottage-interior.png?v=style-lab-v2'];

export const PLAYER_SHEETS = [
    { key: 'lab_player_down', anim: 'lab_walk_down', path: 'asset/player_walk_down.png?v=style-lab-v2', frameWidth: 266, frameHeight: 431, frameRate: 6 },
    { key: 'lab_player_up', anim: 'lab_walk_up', path: 'asset/player_walk_up.png?v=style-lab-v2', frameWidth: 231, frameHeight: 394, frameRate: 6 },
    { key: 'lab_player_left', anim: 'lab_walk_left', path: 'asset/player_walk_left.png?v=style-lab-v2', frameWidth: 251, frameHeight: 446, frameRate: 6 },
    { key: 'lab_player_right', anim: 'lab_walk_right', path: 'asset/player_walk_right.png?v=style-lab-v2', frameWidth: 251, frameHeight: 446, frameRate: 6 }
];

export const MOMO_SHEETS = [
    { key: 'lab_momo_active', anim: 'lab_momo_run', path: 'concepts/current/momo-sheets/animated/momo-active-follow-animated-sheet.png?v=style-lab-v2', frameRate: 8 },
    { key: 'lab_momo_sleepy', anim: 'lab_momo_sleepy', path: 'concepts/current/momo-sheets/animated/momo-sleepy-yawn-animated-sheet.png?v=style-lab-v2', frameRate: 4 },
    { key: 'lab_momo_curled', anim: 'lab_momo_curled', path: 'concepts/current/momo-sheets/animated/momo-low-energy-curled-animated-sheet.png?v=style-lab-v2', frameRate: 4 },
    { key: 'lab_momo_silent', anim: 'lab_momo_silent', path: 'concepts/current/momo-sheets/animated/momo-silent-breathing-animated-sheet.png?v=style-lab-v2', frameRate: 5 },
    { key: 'lab_momo_hug', anim: 'lab_momo_hug', path: 'concepts/current/momo-sheets/animated/momo-hug-ready-animated-sheet.png?v=style-lab-v2', frameRate: 5 },
    { key: 'lab_momo_breath', anim: 'lab_momo_breath', path: 'concepts/current/momo-sheets/animated/momo-dandelion-breath-animated-sheet.png?v=style-lab-v2', frameRate: 5 }
];

export const GRANDMA_ROCKING_SHEET = {
    key: 'lab_grandma_rocking',
    anim: 'lab_grandma_idle',
    path: 'concepts/current/grandma/grandma-rocking-chair-sheet.png?v=style-lab-v2',
    frameWidth: 240,
    frameHeight: 320,
    frameRate: 4
};
