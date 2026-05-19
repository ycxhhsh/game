<template>
  <transition name="momo-pop">
    <aside v-if="visible" class="momo-toast" :class="prompt.mood">
      <div class="momo-face" :style="{ background: prompt.color }">
        <span></span>
      </div>
      <p>{{ prompt.text }}</p>
    </aside>
  </transition>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { EventBus, EMOTION_EVENTS } from '../events/EventBus';

const visible = ref(false);
const prompt = reactive({
  text: '',
  mood: 'green',
  color: '#74c77b'
});

let hideTimer = null;

const showPrompt = (data) => {
  prompt.text = data.text;
  prompt.mood = data.mood || 'green';
  prompt.color = data.color || '#74c77b';
  visible.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    visible.value = false;
  }, data.quiet ? 5200 : 4200);
};

onMounted(() => {
  EventBus.on(EMOTION_EVENTS.MOMO_PROMPT, showPrompt);
});

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
  EventBus.off(EMOTION_EVENTS.MOMO_PROMPT, showPrompt);
});
</script>

<style scoped>
.momo-toast {
  position: absolute;
  left: 18px;
  bottom: 108px;
  width: 292px;
  min-height: 72px;
  padding: 12px 14px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  align-items: center;
  border: 3px solid rgba(92, 84, 112, 0.35);
  border-radius: 10px;
  background: rgba(255, 250, 242, 0.96);
  box-shadow: 0 8px 20px rgba(36, 30, 26, 0.18);
  color: #5c5470;
  pointer-events: none;
}

.momo-toast.yellow {
  border-color: rgba(207, 178, 86, 0.55);
}

.momo-toast.red {
  border-color: rgba(211, 93, 110, 0.55);
}

.momo-face {
  width: 46px;
  height: 38px;
  border-radius: 42% 58% 48% 52%;
  position: relative;
  box-shadow: inset -6px -5px 0 rgba(0, 0, 0, 0.09);
}

.momo-face::before,
.momo-face::after {
  content: '';
  position: absolute;
  top: 12px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2f3a32;
}

.momo-face::before {
  left: 13px;
}

.momo-face::after {
  right: 13px;
}

.momo-face span {
  position: absolute;
  left: 18px;
  bottom: 9px;
  width: 10px;
  height: 4px;
  border-radius: 0 0 999px 999px;
  border-bottom: 2px solid #2f3a32;
}

p {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 800;
}

.momo-pop-enter-active,
.momo-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.momo-pop-enter-from,
.momo-pop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
