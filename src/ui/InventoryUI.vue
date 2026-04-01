<template>
  <div class="inventory-overlay" @click.self="uiStore.closeAll">
    <div class="inventory-bg">
      <h2 class="title">= 种子包裹 =</h2>
      <div class="seeds-container">
        <div 
          v-for="seed in seeds" 
          :key="seed.id" 
          class="seed-box"
          :class="{ active: uiStore.currentSeed === seed.id }"
          @click="selectSeed(seed.id)"
        >
          <img :src="`/asset/icon_bag_${seed.id}.png`" class="icon-image" />
          <div class="seed-name">[{{ seed.name }}]</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../store/uiStore';

const uiStore = useUiStore();

const seeds = [
  { id: 'carrot', name: '胡萝卜' },
  { id: 'tomato', name: '红番茄' },
  { id: 'sunflower', name: '向日葵' },
  { id: 'blueberry', name: '蓝莓' }
];

const selectSeed = (id) => {
  uiStore.setSeed(id);
  uiStore.setTool(3);
  uiStore.closeAll();
};
</script>

<style scoped>
.inventory-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.3);
  display: flex; justify-content: center; align-items: center;
  pointer-events: auto;
}
.inventory-bg {
  background: #fff;
  border-radius: 20px;
  width: 560px; height: 240px;
  display: flex; flex-direction: column; align-items: center;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.title {
  color: #5c5470; margin-top: 10px; margin-bottom: 20px;
}
.seeds-container {
  display: flex; gap: 25px;
}
.seed-box {
  width: 100px; height: 100px;
  background: #fde5e5;
  border-radius: 16px;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}
.seed-box:hover {
  transform: scale(1.05);
}
.seed-box.active {
  background: #ffc3a0;
  border: 2px solid #5c5470;
}
.icon-image {
  width: 48px; height: 48px; margin-bottom: 8px; image-rendering: pixelated;
}
.seed-name {
  color: #5c5470; font-size: 14px;
}
</style>
