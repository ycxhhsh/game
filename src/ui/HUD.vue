<template>
  <div class="hud">
    <div class="top-left">
      <div class="time-panel">
        <span class="time-text">{{ gameStore.time }}</span>
        <span class="weather-text">{{ weatherLabel }}</span>
        <span v-if="gameStore.hasUnreadMail" class="mail-dot">信</span>
      </div>

      <button class="battery-panel" type="button" @click="openDiary">
        <div class="battery-head">
          <span>社交电池</span>
          <strong>{{ Math.round(gameStore.socialBattery) }}%</strong>
        </div>
        <div class="battery-track">
          <div class="battery-fill" :class="batteryClass" :style="{ width: `${gameStore.socialBattery}%` }"></div>
        </div>
      </button>
    </div>

    <button class="momo-panel" type="button" @click="openDiary">
      <div class="momo-icon" :class="gameStore.momo.mood">
        <span></span>
      </div>
      <div>
        <strong>墨墨</strong>
        <p>{{ momoLabel }}</p>
      </div>
    </button>

    <button class="tree-chip" type="button" @click="openHeartTree">
      <span class="tree-mark" :class="gameStore.heartTree.stage"></span>
      <span>心情树 {{ gameStore.heartTreeStageInfo.label }}</span>
      <strong>{{ gameStore.heartTree.health }}%</strong>
    </button>

    <div class="crop-panel">
      <span>胡萝卜: {{ gameStore.carrotCount }}</span>
      <span>番茄: {{ gameStore.tomatoCount }}</span>
      <span>向日葵: {{ gameStore.sunflowerCount }}</span>
      <span>蓝莓: {{ gameStore.blueberryCount }}</span>
    </div>

    <div class="toolbar">
      <div class="hint">
        Q 手账 / H 心情树 / M 信箱 / I 背包 / E 互动 / T 跳到明天
      </div>
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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { EventBus, EMOTION_EVENTS } from '../events/EventBus';

const gameStore = useGameStore();
const uiStore = useUiStore();

const batteryClass = computed(() => {
  if (gameStore.socialBattery < 30) return 'low';
  if (gameStore.socialBattery < 80) return 'mid';
  return 'high';
});

const weatherLabel = computed(() => {
  if (gameStore.weather === 'rainy') return '治愈阵雨';
  if (gameStore.weather === 'foggy') return '薄雾';
  return '晴空';
});

const momoLabel = computed(() => {
  if (gameStore.momo.silent) return '安静陪着你';
  if (gameStore.momo.mood === 'red') return '需要慢一点';
  if (gameStore.momo.mood === 'yellow') return '有点困了';
  return '轻轻跟着你';
});

const openDiary = () => {
  EventBus.emit(EMOTION_EVENTS.OPEN_MOOD_CHECKIN);
};

const openHeartTree = () => {
  EventBus.emit(EMOTION_EVENTS.OPEN_HEART_TREE);
};
</script>

<style scoped>
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.top-left {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}

.time-panel,
.battery-panel,
.momo-panel,
.tree-chip,
.crop-panel {
  background: rgba(255, 246, 236, 0.94);
  border: 2px solid rgba(92, 84, 112, 0.18);
  border-radius: 8px;
  color: #5c5470;
  box-shadow: 0 4px 12px rgba(35, 25, 20, 0.12);
}

.time-panel {
  min-width: 148px;
  padding: 9px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.time-text {
  font-weight: 900;
  font-size: 18px;
}

.weather-text {
  font-size: 13px;
  font-weight: 800;
  color: #826f63;
}

.mail-dot {
  min-width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #d35d6e;
  color: #fff8ec;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
}

.battery-panel {
  width: 182px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.battery-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 6px;
}

.battery-track {
  height: 10px;
  border-radius: 999px;
  background: rgba(92, 84, 112, 0.16);
  overflow: hidden;
}

.battery-fill {
  height: 100%;
  border-radius: inherit;
}

.battery-fill.high {
  background: #74c77b;
}

.battery-fill.mid {
  background: #dfc45f;
}

.battery-fill.low {
  background: #d96a6a;
}

.momo-panel {
  position: absolute;
  left: 214px;
  top: 14px;
  width: 168px;
  min-height: 62px;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 9px;
  align-items: center;
  padding: 9px 11px;
  pointer-events: auto;
  cursor: pointer;
  text-align: left;
}

.momo-panel strong {
  display: block;
  font-size: 15px;
  margin-bottom: 2px;
}

.momo-panel p {
  margin: 0;
  color: #786a62;
  font-size: 12px;
  font-weight: 800;
}

.momo-icon {
  width: 42px;
  height: 35px;
  border-radius: 44% 56% 48% 52%;
  background: #74c77b;
  position: relative;
  box-shadow: inset -6px -5px 0 rgba(0, 0, 0, 0.09);
}

.momo-icon.yellow {
  background: #dfc45f;
}

.momo-icon.red {
  background: #d96a6a;
}

.momo-icon::before,
.momo-icon::after {
  content: '';
  position: absolute;
  top: 11px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2f3a32;
}

.momo-icon::before {
  left: 12px;
}

.momo-icon::after {
  right: 12px;
}

.momo-icon span {
  position: absolute;
  left: 16px;
  bottom: 8px;
  width: 10px;
  height: 4px;
  border-bottom: 2px solid #2f3a32;
  border-radius: 0 0 999px 999px;
}

.tree-chip {
  position: absolute;
  left: 398px;
  top: 14px;
  min-width: 194px;
  height: 62px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  pointer-events: auto;
  cursor: pointer;
  font-weight: 900;
}

.tree-chip strong {
  margin-left: auto;
}

.tree-mark {
  width: 18px;
  height: 28px;
  border-radius: 50% 50% 30% 30%;
  background: #9fbd72;
  position: relative;
}

.tree-mark::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 21px;
  width: 4px;
  height: 12px;
  background: #9c7650;
}

.tree-mark.wilted {
  background: #8c907b;
}

.tree-mark.healthy {
  background: #82bf75;
}

.tree-mark.blooming {
  background: #f2b0c1;
}

.crop-panel {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 10px 14px;
  display: flex;
  gap: 14px;
  font-weight: 900;
  font-size: 14px;
  pointer-events: auto;
}

.toolbar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  align-items: center;
  pointer-events: auto;
}

.tool-slot {
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
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
  image-rendering: pixelated;
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
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: #5c5470;
  font-weight: 900;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.78);
  padding: 3px 8px;
  border-radius: 4px;
}
</style>
