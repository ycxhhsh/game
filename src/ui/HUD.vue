<template>
  <div class="hud">
    <!-- Time Panel (Top Left) -->
    <div class="time-panel">
      <span class="time-text">{{ gameStore.time }}</span>
    </div>

    <!-- Crop Counts (Top Right) -->
    <div class="crop-panel">
      <span>🥕: {{ gameStore.carrotCount }}</span>
      <span>🍅: {{ gameStore.tomatoCount }}</span>
      <span>🌻: {{ gameStore.sunflowerCount }}</span>
      <span>🍇: {{ gameStore.blueberryCount }}</span>
    </div>

    <!-- Tool Bar (Bottom Center) -->
    <div class="toolbar">
      <div class="tool-slot" :class="{ active: uiStore.currentTool === 1 }" @click="uiStore.setTool(1)">
        <img src="/asset/icon_hoe.png" alt="Hoe" />
      </div>
      <div class="tool-slot" :class="{ active: uiStore.currentTool === 2 }" @click="uiStore.setTool(2)">
        <img src="/asset/icon_water.png" alt="Watering Can" />
      </div>
      <div class="tool-slot seed-slot" :class="{ active: uiStore.currentTool === 3 }" @click="uiStore.setTool(3)" @dblclick="uiStore.toggleInventory()">
        <img :src="`/asset/icon_bag_${uiStore.currentSeed}.png`" alt="Seeds" />
        <span class="seed-badge">{{ gameStore[`${uiStore.currentSeed}SeedCount`] }}</span>
      </div>
      <div class="hint">
        (按 Q 唤出手账记录 / 多次按 3 或 E 键打开包裹)
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';

const gameStore = useGameStore();
const uiStore = useUiStore();
</script>

<style scoped>
.hud {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.time-panel {
  position: absolute;
  top: 16px; left: 16px;
  background: rgba(255, 226, 226, 0.95);
  border-radius: 20px;
  padding: 10px 30px;
  pointer-events: auto;
}
.time-text {
  font-weight: bold; font-size: 18px; color: #5c5470;
}

.crop-panel {
  position: absolute;
  top: 16px; right: 16px;
  background: rgba(255, 226, 226, 0.85);
  border-radius: 20px;
  padding: 10px 20px;
  display: flex; gap: 20px;
  font-weight: bold; font-size: 18px; color: #5c5470;
  pointer-events: auto;
}

.toolbar {
  position: absolute;
  bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 16px;
  align-items: center;
  pointer-events: auto;
}
.tool-slot {
  width: 48px; height: 48px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  transition: all 0.2s;
  display: flex; justify-content: center; align-items: center;
  cursor: pointer;
  border: 2px solid transparent;
}
.tool-slot.active {
  border-color: #ffd700;
  box-shadow: 0 0 10px #ffd700;
  background: rgba(255, 255, 255, 0.2);
}
.tool-slot img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated; /* 农场大像素 */
}
.seed-slot {
  position: relative;
}
.seed-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: #ff5722;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 4px;
  line-height: 1;
}
.hint {
  position: absolute;
  top: -30px; left: 50%; transform: translateX(-50%);
  font-size: 13px; color: #5c5470; font-weight: bold;
  white-space: nowrap;
  background: rgba(255,255,255,0.7);
  padding: 2px 8px; border-radius: 4px;
}
</style>
