<template>
  <div class="tree-overlay" @click.self="uiStore.closeAll">
    <section class="tree-panel">
      <div class="panel-head">
        <div>
          <h2>心情树</h2>
          <p>它记录的是你有没有把温柔也留给自己。</p>
        </div>
        <button class="close-btn" type="button" @click="uiStore.closeAll">×</button>
      </div>

      <div class="tree-summary">
        <div class="tree-visual" :class="gameStore.heartTree.stage">
          <div class="crown"></div>
          <div class="trunk"></div>
          <span
            v-for="(blossom, index) in visibleBlossoms"
            :key="`${blossom.createdAt}-${index}`"
            class="blossom"
            :style="{ background: blossom.color, left: blossomPositions[index].left, top: blossomPositions[index].top }"
          ></span>
        </div>

        <div class="stats">
          <div class="stage-line">
            <strong>{{ gameStore.heartTreeStageInfo.label }}</strong>
            <span>树根深度 {{ gameStore.heartTree.roots }}</span>
          </div>
          <Meter label="健康度" :value="gameStore.heartTree.health" />
          <Meter label="水分" :value="gameStore.heartTree.water" tone="water" />
          <div class="mini-grid">
            <span>杂草 {{ gameStore.heartTree.weeds }}</span>
            <span>连续照护 {{ gameStore.heartTree.careStreak }} 天</span>
            <span>情绪词 {{ gameStore.emotionGranularity }} 个</span>
            <span>复合记录 {{ gameStore.compoundMoodRatio }}%</span>
          </div>
        </div>
      </div>

      <div class="care-grid">
        <button
          v-for="action in careActions"
          :key="action.type"
          class="care-card"
          type="button"
          @click="performCare(action.type)"
        >
          <span class="care-title">{{ action.title }}</span>
          <span class="care-desc">{{ action.desc }}</span>
        </button>
      </div>

      <div class="echo-box">
        <textarea
          v-model="realityNote"
          maxlength="60"
          placeholder="现实里有没有一个小小的温柔时刻？"
        ></textarea>
        <button type="button" @click="performCare('realityEcho')">记录现实回响</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';

const gameStore = useGameStore();
const uiStore = useUiStore();
const realityNote = ref('');

const careActions = [
  { type: 'weed', title: '除草', desc: '清理一株杂乱念头' },
  { type: 'water', title: '浇水', desc: '做一件让自己舒服的小事' },
  { type: 'listen', title: '听风', desc: '在树下安静待一会儿' },
  { type: 'rest', title: '休息', desc: '把任务先放在门外' },
  { type: 'hugMomo', title: '抱抱墨墨', desc: '允许自己被陪着' }
];

const blossomPositions = [
  { left: '45%', top: '16%' },
  { left: '29%', top: '31%' },
  { left: '62%', top: '32%' },
  { left: '39%', top: '44%' },
  { left: '55%', top: '48%' },
  { left: '48%', top: '29%' }
];

const visibleBlossoms = computed(() => gameStore.heartTree.blossoms.slice(0, blossomPositions.length));

const performCare = (type) => {
  gameStore.performSelfCare(type, { note: realityNote.value.trim() });
  if (type === 'realityEcho') realityNote.value = '';
};

const Meter = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    tone: { type: String, default: 'health' }
  },
  setup(props) {
    return () => h('div', { class: 'meter' }, [
      h('div', { class: 'meter-label' }, [
        h('span', props.label),
        h('strong', `${Math.round(props.value)}%`)
      ]),
      h('div', { class: 'meter-track' }, [
        h('div', {
          class: ['meter-fill', props.tone],
          style: { width: `${Math.max(0, Math.min(100, props.value))}%` }
        })
      ])
    ]);
  }
});
</script>

<style scoped>
.tree-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 23, 29, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.tree-panel {
  width: 650px;
  min-height: 455px;
  padding: 20px 24px;
  box-sizing: border-box;
  border: 4px solid #80956c;
  border-radius: 14px;
  background: #f7f5e8;
  color: #4f5848;
  box-shadow: 0 14px 34px rgba(21, 38, 20, 0.24);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

h2 {
  margin: 0 0 4px;
  color: #4e644c;
  font-size: 26px;
}

p {
  margin: 0;
  color: #718067;
  font-weight: 700;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: #dfe7cf;
  color: #4e644c;
  font-size: 24px;
  cursor: pointer;
}

.tree-summary {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 18px;
}

.tree-visual {
  position: relative;
  height: 190px;
  border-radius: 10px;
  background: linear-gradient(#e7f3ef, #ede2c8);
  overflow: hidden;
}

.tree-visual::after {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 22px;
  height: 12px;
  border-radius: 50%;
  background: rgba(92, 77, 50, 0.16);
}

.crown {
  position: absolute;
  left: 46px;
  top: 20px;
  width: 98px;
  height: 95px;
  border-radius: 46% 54% 45% 55%;
  background: #9fbd72;
  box-shadow: -24px 24px 0 #88aa66, 26px 20px 0 #abc87a;
}

.trunk {
  position: absolute;
  left: 88px;
  top: 98px;
  width: 22px;
  height: 62px;
  border-radius: 10px 10px 4px 4px;
  background: #9c7650;
}

.wilted .crown {
  background: #8c907b;
  box-shadow: -24px 24px 0 #767d69, 26px 20px 0 #9fa08d;
}

.recovering .crown {
  background: #a9c67b;
}

.healthy .crown {
  background: #82bf75;
  box-shadow: -24px 24px 0 #74aa67, 26px 20px 0 #9fd48b;
}

.blooming .crown {
  background: #96c77d;
  box-shadow: -24px 24px 0 #80b86e, 26px 20px 0 #f2b0c1;
}

.blossom {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.85);
  z-index: 2;
}

.stage-line,
.meter-label,
.mini-grid {
  display: flex;
  align-items: center;
}

.stage-line {
  justify-content: space-between;
  margin-bottom: 10px;
}

.stage-line strong {
  font-size: 22px;
  color: #4e644c;
}

.stage-line span {
  font-weight: 800;
  color: #7b6e55;
}

.meter {
  margin-bottom: 10px;
}

.meter-label {
  justify-content: space-between;
  font-weight: 800;
  margin-bottom: 5px;
}

.meter-track {
  height: 12px;
  border-radius: 999px;
  background: #ddd8c4;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: #7bbf72;
}

.meter-fill.water {
  background: #76bad4;
}

.mini-grid {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.mini-grid span {
  padding: 6px 9px;
  border-radius: 7px;
  background: #ebe5ce;
  font-size: 13px;
  font-weight: 800;
}

.care-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 9px;
  margin-bottom: 14px;
}

.care-card {
  min-height: 78px;
  border: 2px solid #d8d0b8;
  border-radius: 8px;
  background: #fffdf4;
  color: #4f5848;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.care-card:hover {
  border-color: #80956c;
  background: #f1f4df;
}

.care-title {
  font-size: 16px;
  font-weight: 900;
}

.care-desc {
  max-width: 88px;
  font-size: 12px;
  line-height: 1.3;
  color: #718067;
}

.echo-box {
  display: grid;
  grid-template-columns: 1fr 128px;
  gap: 10px;
}

.echo-box textarea {
  height: 54px;
  resize: none;
  border: 2px solid #d8d0b8;
  border-radius: 8px;
  padding: 9px 11px;
  box-sizing: border-box;
  background: #fffdf4;
  color: #4f5848;
  font: 14px sans-serif;
}

.echo-box button {
  border: 0;
  border-radius: 8px;
  background: #80956c;
  color: white;
  font-weight: 900;
  cursor: pointer;
}
</style>
