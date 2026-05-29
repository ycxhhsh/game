<template>
  <div class="mail-overlay" @click.self="uiStore.closeAll">
    <section class="mail-panel">
      <header class="panel-head">
        <div>
          <h2>海风信箱</h2>
          <p>{{ letters.length ? '今天也有人认真回信。' : '信箱里暂时只有风声。' }}</p>
        </div>
        <button class="close-btn" type="button" @click="uiStore.closeAll">×</button>
      </header>

      <div class="mail-layout">
        <aside class="letter-list" aria-label="信件列表">
          <button
            v-for="letter in letters"
            :key="letter.id"
            class="letter-tab"
            :class="{ active: letter.id === selectedId, unread: !letter.read }"
            type="button"
            @click="selectLetter(letter.id)"
          >
            <span class="stamp" :class="letter.tone"></span>
            <span class="letter-title">{{ letter.title }}</span>
            <small>第 {{ letter.day }} 天</small>
          </button>
          <div v-if="!letters.length" class="empty-mail">
            明天也许会有一封很轻的信，慢慢来。
          </div>
        </aside>

        <article v-if="selectedLetter" class="letter-paper" :class="selectedLetter.tone">
          <div class="paper-stamp">{{ toneLabel }}</div>
          <h3>{{ selectedLetter.title }}</h3>
          <p class="letter-body">{{ selectedLetter.body }}</p>
        </article>

        <article v-else class="letter-paper placeholder">
          <div class="paper-stamp">MAIL</div>
          <h3>还没有新信</h3>
          <p class="letter-body">写下一点今天的感受，或在小屋里照顾自己，第二天再来看看。</p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';

const gameStore = useGameStore();
const uiStore = useUiStore();

const selectedId = ref('');
const letters = computed(() => gameStore.mailbox?.letters || []);
const selectedLetter = computed(() => letters.value.find((letter) => letter.id === selectedId.value) || letters.value[0] || null);
const toneLabel = computed(() => {
  if (!selectedLetter.value) return 'MAIL';
  if (selectedLetter.value.tone === 'mist') return '薄雾';
  if (selectedLetter.value.tone === 'rain') return '阵雨';
  if (selectedLetter.value.tone === 'care') return '照护';
  return '晴空';
});

const selectLetter = (id) => {
  selectedId.value = id;
};

watch(letters, (nextLetters) => {
  if (!nextLetters.length) {
    selectedId.value = '';
    return;
  }
  if (!nextLetters.some((letter) => letter.id === selectedId.value)) {
    selectedId.value = nextLetters[0].id;
  }
}, { immediate: true });

watch(selectedLetter, (letter) => {
  if (letter && !letter.read) gameStore.markMailboxRead(letter.id);
}, { immediate: true });
</script>

<style scoped>
.mail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(32, 27, 31, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.mail-panel {
  width: 730px;
  min-height: 444px;
  padding: 20px 22px 22px;
  box-sizing: border-box;
  border: 4px solid #9e7560;
  border-radius: 12px;
  background: #fff4de;
  color: #5b473f;
  box-shadow: 0 18px 38px rgba(37, 27, 20, 0.24);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  color: #6b4b3f;
  font-size: 26px;
}

.panel-head p {
  margin-top: 4px;
  color: #92705d;
  font-size: 14px;
  font-weight: 800;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: #ead1b9;
  color: #6b4b3f;
  font-size: 24px;
  cursor: pointer;
}

.mail-layout {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 18px;
}

.letter-list {
  min-height: 326px;
  border: 2px solid #ead1b9;
  border-radius: 8px;
  background: rgba(255, 253, 247, 0.72);
  padding: 10px;
  box-sizing: border-box;
}

.letter-tab {
  width: 100%;
  min-height: 62px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #fffaf1;
  color: #5b473f;
  display: grid;
  grid-template-columns: 30px 1fr;
  grid-template-rows: auto auto;
  gap: 2px 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 9px;
  text-align: left;
  cursor: pointer;
}

.letter-tab.active {
  border-color: #d38b67;
  background: #fff1dc;
}

.letter-tab.unread .letter-title::after {
  content: ' 新';
  color: #d35d6e;
  font-size: 12px;
}

.stamp {
  grid-row: 1 / 3;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #e7b970;
  box-shadow: inset -3px -3px 0 rgba(89, 58, 34, 0.12);
}

.stamp.rain {
  background: #8fc4d9;
}

.stamp.mist {
  background: #b8c4d6;
}

.stamp.care {
  background: #a6c77a;
}

.letter-title {
  font-size: 14px;
  font-weight: 900;
}

.letter-tab small {
  color: #92705d;
  font-weight: 800;
}

.empty-mail {
  color: #92705d;
  font-weight: 800;
  line-height: 1.6;
  padding: 18px 10px;
}

.letter-paper {
  min-height: 326px;
  position: relative;
  border: 2px solid #ead1b9;
  border-radius: 8px;
  background: linear-gradient(180deg, #fffdf8, #fff3dd);
  padding: 28px 30px 26px;
  box-sizing: border-box;
  overflow: hidden;
}

.letter-paper::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 70px;
  bottom: 24px;
  background: repeating-linear-gradient(to bottom, transparent, transparent 25px, rgba(154, 117, 91, 0.13) 26px);
  pointer-events: none;
}

.paper-stamp {
  position: absolute;
  right: 24px;
  top: 20px;
  width: 58px;
  height: 40px;
  border: 2px solid rgba(107, 75, 63, 0.26);
  border-radius: 8px;
  color: #8b6654;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  transform: rotate(5deg);
}

.letter-paper h3 {
  max-width: 300px;
  color: #6b4b3f;
  font-size: 23px;
  margin-bottom: 18px;
}

.letter-body {
  position: relative;
  color: #5b473f;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.75;
  white-space: pre-wrap;
}

.letter-paper.rain {
  background: linear-gradient(180deg, #f8fcff, #e9f4f6);
}

.letter-paper.mist {
  background: linear-gradient(180deg, #fbfcff, #eef1f5);
}

.letter-paper.care {
  background: linear-gradient(180deg, #fbfff4, #edf5dc);
}

.placeholder {
  opacity: 0.86;
}
</style>
