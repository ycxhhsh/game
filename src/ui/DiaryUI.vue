<template>
  <div class="diary-overlay" @click.self="uiStore.closeAll">
    <div class="diary-bg">
      <div class="panel-head">
        <div>
          <h2 class="title">心屿手账</h2>
          <p class="prompt">选出最接近此刻感受的 1-2 个图景。</p>
        </div>
        <button class="close-btn" type="button" @click="uiStore.closeAll">×</button>
      </div>

      <div class="emotion-grid">
        <button
          v-for="emotion in emotions"
          :key="emotion.id"
          class="emotion-card"
          :class="{ selected: selectedIds.includes(emotion.id), negative: emotion.valence === 'negative' }"
          type="button"
          @click="toggleEmotion(emotion.id)"
        >
          <span class="emotion-image">{{ emotion.image }}</span>
          <span class="emotion-label">{{ emotion.label }}</span>
        </button>
      </div>

      <label class="intensity-row">
        <span>感觉强度</span>
        <input v-model.number="intensity" type="range" min="1" max="5" />
        <strong>{{ intensity }}</strong>
      </label>

      <textarea
        v-model="note"
        class="note"
        maxlength="80"
        placeholder="也可以写一句：现在的身体或心里像什么？"
      ></textarea>

      <div class="footer-row">
        <div class="weather-preview">明天天气：{{ weatherPreview }}</div>
        <button class="submit-btn" type="button" :disabled="!selectedIds.length" @click="submitMood">
          记下这一刻
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useUiStore } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';

const uiStore = useUiStore();
const gameStore = useGameStore();

const emotions = [
  { id: 'cloud', label: '胸口有灰云', image: '灰云', valence: 'negative', weather: 'foggy' },
  { id: 'tangle', label: '像毛线缠住', image: '线团', valence: 'negative', weather: 'foggy' },
  { id: 'heavy', label: '身体沉沉的', image: '石头', valence: 'negative', weather: 'rainy' },
  { id: 'spark', label: '有点烦躁', image: '火花', valence: 'negative', weather: 'rainy' },
  { id: 'rain', label: '想安静一会儿', image: '细雨', valence: 'negative', weather: 'rainy' },
  { id: 'tired', label: '电量很低', image: '小灯', valence: 'negative', weather: 'foggy' },
  { id: 'warm', label: '心里暖暖的', image: '灯火', valence: 'positive', weather: 'sunny' },
  { id: 'clear', label: '轻了一点', image: '晴空', valence: 'positive', weather: 'sunny' },
  { id: 'hope', label: '有点期待', image: '嫩芽', valence: 'positive', weather: 'sunny' }
];

const selectedIds = ref([]);
const intensity = ref(3);
const note = ref('');

const selectedEmotions = computed(() => (
  selectedIds.value.map((id) => emotions.find((emotion) => emotion.id === id)).filter(Boolean)
));

const weatherPreview = computed(() => {
  if (!selectedEmotions.value.length) return '等待你的手账';
  if (selectedEmotions.value.some((emotion) => emotion.weather === 'foggy') && intensity.value >= 4) return '薄雾';
  if (selectedEmotions.value.some((emotion) => emotion.valence === 'negative')) return '治愈阵雨';
  return '晴空';
});

const toggleEmotion = (id) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
    return;
  }
  if (selectedIds.value.length >= 2) {
    selectedIds.value = [selectedIds.value[1], id];
    return;
  }
  selectedIds.value.push(id);
};

const submitMood = () => {
  gameStore.recordMoodEntry({
    emotions: selectedEmotions.value,
    note: note.value,
    intensity: intensity.value
  });
  selectedIds.value = [];
  intensity.value = 3;
  note.value = '';
  uiStore.closeAll();
};
</script>

<style scoped>
.diary-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(28, 23, 32, 0.42);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.diary-bg {
  width: 620px;
  min-height: 430px;
  background: #fff7e8;
  border: 4px solid #b98062;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(44, 28, 18, 0.25);
  padding: 20px 24px 22px;
  box-sizing: border-box;
  color: #5c4b45;
}

.panel-head,
.footer-row,
.intensity-row {
  display: flex;
  align-items: center;
}

.panel-head {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.title {
  margin: 0 0 4px;
  color: #5c5470;
  font-size: 26px;
}

.prompt {
  margin: 0;
  color: #8b6b58;
  font-size: 15px;
  font-weight: 700;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: #f0d7c2;
  color: #6a4d42;
  font-size: 24px;
  cursor: pointer;
}

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.emotion-card {
  min-height: 74px;
  border: 2px solid #ead3ba;
  border-radius: 8px;
  background: #fffdf8;
  color: #5c5470;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}

.emotion-card:hover {
  transform: translateY(-2px);
}

.emotion-card.selected {
  background: #ffe7d8;
  border-color: #d35d6e;
}

.emotion-card.negative.selected {
  background: #edf0f7;
  border-color: #7d91b5;
}

.emotion-image {
  font-size: 18px;
  font-weight: 800;
}

.emotion-label {
  font-size: 14px;
  font-weight: 700;
}

.intensity-row {
  gap: 14px;
  margin: 16px 0 12px;
  font-weight: 800;
}

.intensity-row input {
  flex: 1;
  accent-color: #d35d6e;
}

.note {
  width: 100%;
  height: 74px;
  resize: none;
  border: 2px solid #ead3ba;
  border-radius: 8px;
  padding: 10px 12px;
  box-sizing: border-box;
  color: #5c5470;
  background: #fffdf8;
  font: 15px sans-serif;
  outline: none;
}

.note:focus {
  border-color: #d35d6e;
}

.footer-row {
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.weather-preview {
  color: #7d665d;
  font-weight: 800;
}

.submit-btn {
  border: 0;
  border-radius: 8px;
  background: #d35d6e;
  color: white;
  font-weight: 800;
  padding: 10px 18px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #c9b6ae;
  cursor: not-allowed;
}
</style>
