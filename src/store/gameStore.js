import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({
    time: '06:00',
    weather: 'sunny', // 'sunny', 'rainy', 'foggy'
    tomorrowWeather: 'sunny',
    carrotCount: 0,
    tomatoCount: 0,
    sunflowerCount: 0,
    blueberryCount: 0,
    carrotSeedCount: 15, // 测试赠送的初始种子
    tomatoSeedCount: 15,
    sunflowerSeedCount: 15,
    blueberrySeedCount: 15,
    grandmaAffection: 0
  }),
  actions: {
    addCrop(type) {
      if (type === 'carrot') this.carrotCount++;
      else if (type === 'tomato') this.tomatoCount++;
      else if (type === 'sunflower') this.sunflowerCount++;
      else if (type === 'blueberry') this.blueberryCount++;
    },
    useCrop(type) {
      if (type === 'carrot' && this.carrotCount > 0) { this.carrotCount--; return true; }
      if (type === 'tomato' && this.tomatoCount > 0) { this.tomatoCount--; return true; }
      if (type === 'sunflower' && this.sunflowerCount > 0) { this.sunflowerCount--; return true; }
      if (type === 'blueberry' && this.blueberryCount > 0) { this.blueberryCount--; return true; }
      return false;
    },
    useSeed(type) {
      if (type === 'carrot' && this.carrotSeedCount > 0) { this.carrotSeedCount--; return true; }
      if (type === 'tomato' && this.tomatoSeedCount > 0) { this.tomatoSeedCount--; return true; }
      if (type === 'sunflower' && this.sunflowerSeedCount > 0) { this.sunflowerSeedCount--; return true; }
      if (type === 'blueberry' && this.blueberrySeedCount > 0) { this.blueberrySeedCount--; return true; }
      return false;
    },
    updateTime(newTime) {
      this.time = newTime;
    },
    setTomorrowWeather(newWeather) {
      this.tomorrowWeather = newWeather;
    },
    addAffection() {
      this.grandmaAffection++;
    }
  }
});
