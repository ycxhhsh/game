<template>
  <div class="diary-overlay" @click.self="uiStore.closeAll">
    <div class="diary-bg">
      <div class="spine"></div>
      <h2 class="title">💌 心屿手账本</h2>
      <p class="prompt">
        给今天的心情记录一个专属贴纸：<br/>
        你的每一次手账祈愿，会决定明天小镇的天气
      </p>
      
      <div class="stickers-container">
        <div class="sticker-box" v-for="mood in moods" :key="mood.weather" @click="setTomorrowWeather(mood.weather)">
          <div class="sticker-text">{{ mood.txt }}</div>
        </div>
      </div>
      
      <div class="weather-indicator" v-if="gameStore.tomorrowWeather">
        你已为明天写下祈愿贴纸：[{{ weatherText(gameStore.tomorrowWeather) }}]
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';

const uiStore = useUiStore();
const gameStore = useGameStore();

const moods = [
  { txt: '☀️ 晴空', weather: 'sunny' },
  { txt: '🌧️ 治愈阵雨', weather: 'rainy' },
  { txt: '🌫️ 奇幻薄雾', weather: 'foggy' }
];

const weatherText = (w) => {
  return moods.find(m => m.weather === w)?.txt || '☀️ 晴空';
};

const setTomorrowWeather = (w) => {
  gameStore.setTomorrowWeather(w);
  setTimeout(() => {
    uiStore.closeAll();
  }, 800);
};
</script>

<style scoped>
.diary-overlay {
  position: absolute; top:0; left:0; width:100%; height:100%;
  background: rgba(0,0,0,0.4);
  display: flex; justify-content: center; align-items: center;
  pointer-events: auto;
}
.diary-bg {
  position: relative;
  background: #f4e4c1;
  width: 480px; height: 320px;
  border: 4px solid #8b5a2b;
  border-radius: 16px;
  display: flex; flex-direction: column; align-items: center;
  box-sizing: border-box;
}
.spine {
  position: absolute; left: 15px; top: 0; bottom: 0; width: 30px;
  background: #cdae82;
  border-radius: 12px 0 0 12px;
}
.title {
  color: #5c5470; font-size: 26px; margin: 20px 0 10px 0; z-index: 2;
}
.prompt {
  color: #8b5a2b; font-size: 18px; text-align: center;
  font-weight: bold; line-height: 1.5; z-index: 2; margin-bottom: 20px;
}
.stickers-container {
  display: flex; gap: 40px; z-index: 2;
}
.sticker-box {
  width: 90px; height: 90px;
  background: rgba(255,255,255,0.8);
  border-radius: 12px;
  display: flex; justify-content: center; align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}
.sticker-box:hover {
  transform: translateY(-5px);
}
.sticker-text {
  color: #5c5470; font-weight: bold; font-size: 15px; text-align: center;
}
.weather-indicator {
  margin-top: 20px; color: #d35d6e; font-weight: bold; font-size: 15px; z-index: 2;
}
</style>
