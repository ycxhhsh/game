<template>
  <div class="diary-overlay" @click.self="uiStore.closeAll">
    <section class="diary-book">
      <button class="close-btn" type="button" @click="uiStore.closeAll">×</button>

      <div class="book-page left-page">
        <header class="diary-head">
          <span class="day-chip">第 {{ gameStore.currentDay }} 天</span>
          <div>
            <h2>心屿手账</h2>
            <p>选出最接近此刻感受的 1-2 个图景。</p>
          </div>
        </header>

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
      </div>

      <div class="book-page right-page">
        <div class="weather-stamp" :class="weatherTone">
          <span>明天天气</span>
          <strong>{{ weatherPreview }}</strong>
        </div>

        <div class="selected-note">
          <h3>今天纸页上留下的</h3>
          <p>{{ selectedSummary }}</p>
        </div>

        <div class="recent-box">
          <h3>最近的手账</h3>
          <ol v-if="recentEntries.length">
            <li v-for="entry in recentEntries" :key="entry.id">
              <span>第 {{ entry.day }} 天</span>
              <strong>{{ entry.emotions.map((emotion) => emotion.label).join('、') }}</strong>
              <em v-if="entry.note">“{{ entry.note }}”</em>
            </li>
          </ol>
          <p v-else class="empty-recent">还没有旧纸页。第一句会从这里开始。</p>
        </div>

        <div class="footer-row">
          <p class="soft-hint">记录会轻轻影响明天的天气、心情树和墨墨状态。</p>
          <button class="submit-btn" type="button" :disabled="!selectedIds.length" @click="submitMood">
            记下这一刻
          </button>
        </div>
      </div>
    </section>
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

const weatherTone = computed(() => {
  if (weatherPreview.value === '薄雾') return 'foggy';
  if (weatherPreview.value === '治愈阵雨') return 'rainy';
  if (weatherPreview.value === '晴空') return 'sunny';
  return 'idle';
});

const selectedSummary = computed(() => {
  if (!selectedEmotions.value.length) return '还没有选图景。可以先从最靠近身体的那一个开始。';
  const labels = selectedEmotions.value.map((emotion) => emotion.label).join('、');
  if (note.value.trim()) return `${labels}。你写下：“${note.value.trim()}”`;
  return `${labels}，强度 ${intensity.value}。这一页已经足够。`;
});

const recentEntries = computed(() => gameStore.moodEntries.slice(0, 3));

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
  inset: 0;
  background: rgba(32, 26, 31, 0.42);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.diary-book {
  position: relative;
  width: 830px;
  min-height: 472px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 12px;
  color: #5c4b45;
  filter: drop-shadow(0 20px 34px rgba(35, 25, 20, 0.24));
}

.diary-book::after {
  content: '';
  position: absolute;
  top: 22px;
  bottom: 22px;
  left: 50%;
  width: 10px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(95, 68, 49, 0.18), rgba(255, 250, 238, 0.7), rgba(95, 68, 49, 0.14));
  z-index: 3;
}

.book-page {
  min-height: 472px;
  padding: 24px 28px;
  box-sizing: border-box;
  background: #fff7e8;
  border: 4px solid #b98062;
}

.left-page {
  border-right: 0;
  border-radius: 12px 0 0 12px;
  background:
    radial-gradient(circle at 18% 14%, rgba(244, 199, 110, 0.16), transparent 28%),
    repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(185, 128, 98, 0.13) 32px),
    #fff7e8;
}

.right-page {
  border-left: 0;
  border-radius: 0 12px 12px 0;
  background:
    radial-gradient(circle at 85% 10%, rgba(139, 178, 149, 0.18), transparent 26%),
    repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(185, 128, 98, 0.12) 32px),
    #fffaf0;
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: #f0d7c2;
  color: #6a4d42;
  font-size: 24px;
  cursor: pointer;
}

.diary-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.day-chip {
  min-width: 58px;
  padding: 8px 9px;
  border-radius: 8px;
  background: #f0d7c2;
  color: #6a4d42;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  color: #5c5470;
  font-size: 27px;
}

.diary-head p {
  margin-top: 5px;
  color: #8b6b58;
  font-size: 14px;
  font-weight: 800;
}

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.emotion-card {
  min-height: 67px;
  border: 2px solid #ead3ba;
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.88);
  color: #5c5470;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
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
  font-size: 17px;
  font-weight: 900;
}

.emotion-label {
  font-size: 13px;
  font-weight: 800;
}

.intensity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 17px 0 13px;
  font-weight: 900;
}

.intensity-row span {
  white-space: nowrap;
}

.intensity-row input {
  flex: 1;
  accent-color: #d35d6e;
}

.note {
  width: 100%;
  height: 78px;
  resize: none;
  border: 2px solid #ead3ba;
  border-radius: 8px;
  padding: 11px 12px;
  box-sizing: border-box;
  color: #5c5470;
  background: rgba(255, 253, 248, 0.9);
  font: 15px sans-serif;
  line-height: 1.5;
  outline: none;
}

.note:focus {
  border-color: #d35d6e;
}

.weather-stamp {
  width: 150px;
  min-height: 78px;
  margin: 4px 0 20px auto;
  border: 3px solid rgba(116, 99, 86, 0.18);
  border-radius: 10px;
  transform: rotate(3deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #5c5470;
  background: #fffdf8;
}

.weather-stamp span {
  font-size: 13px;
  font-weight: 900;
  color: #8b6b58;
}

.weather-stamp strong {
  font-size: 21px;
}

.weather-stamp.sunny {
  background: #fff0c9;
}

.weather-stamp.rainy {
  background: #e9f5fb;
}

.weather-stamp.foggy {
  background: #eef1f5;
}

.selected-note,
.recent-box {
  border: 2px dashed rgba(185, 128, 98, 0.42);
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.58);
  padding: 13px 14px;
  margin-bottom: 13px;
}

.selected-note h3,
.recent-box h3 {
  color: #6a4d42;
  font-size: 17px;
  margin-bottom: 8px;
}

.selected-note p,
.empty-recent,
.soft-hint {
  color: #80675d;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
}

ol {
  margin: 0;
  padding-left: 18px;
}

li {
  margin-bottom: 7px;
  color: #80675d;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
}

li span {
  color: #a2785f;
  margin-right: 6px;
}

li strong {
  color: #5c5470;
}

li em {
  display: block;
  color: #9b7360;
  font-style: normal;
  margin-top: 2px;
}

.footer-row {
  display: grid;
  grid-template-columns: 1fr 128px;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.submit-btn {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: #d35d6e;
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #c9b6ae;
  cursor: not-allowed;
}
</style>
