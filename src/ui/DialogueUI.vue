<template>
  <div class="dialogue-overlay" @click.self="advanceOrClose">
    <div class="dialogue-bg" @click="advanceOrClose">
      <div class="dialogue-content">
        <div class="name-tag">{{ uiStore.dialogue.name }}</div>
        <div class="text-body">{{ displayedText }}</div>
      </div>
      <div class="avatar" v-if="uiStore.dialogue.avatar">
        <!-- Abstract representation if real icon is missing -->
        <div class="avatar-placeholder">👵</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useUiStore } from '../store/uiStore';
import { EventBus } from '../events/EventBus';

const uiStore = useUiStore();
const displayedText = ref('');
let charIndex = 0;
let typingInterval = null;
let isTyping = false;

const startTyping = () => {
  charIndex = 0;
  displayedText.ref = '';
  isTyping = true;
  if(typingInterval) clearInterval(typingInterval);
  
  typingInterval = setInterval(() => {
    displayedText.value = uiStore.dialogue.text.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex >= uiStore.dialogue.text.length) {
      clearInterval(typingInterval);
      isTyping = false;
    }
  }, 50);
};

const advanceOrClose = () => {
  if (isTyping) {
    clearInterval(typingInterval);
    displayedText.value = uiStore.dialogue.text;
    isTyping = false;
  } else {
    uiStore.closeDialogue();
  }
};

onMounted(() => {
  startTyping();
  EventBus.on('ADVANCE_DIALOGUE', advanceOrClose);
});

onUnmounted(() => {
  if (typingInterval) clearInterval(typingInterval);
  EventBus.off('ADVANCE_DIALOGUE', advanceOrClose);
});

watch(() => uiStore.dialogue.text, () => {
  startTyping();
});
</script>

<style scoped>
.dialogue-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.15);
  pointer-events: auto;
}
.dialogue-bg {
  position: absolute;
  bottom: 40px; left: 50%; transform: translateX(-50%);
  width: 600px; height: 140px;
  background: rgba(255, 226, 226, 0.95);
  border: 4px solid #d35d6e;
  border-radius: 16px;
  display: flex;
  box-sizing: border-box;
  padding: 20px;
  cursor: pointer;
}
.dialogue-content {
  flex: 1; display: flex; flex-direction: column;
}
.name-tag {
  color: #d35d6e; font-size: 22px; font-weight: bold; margin-bottom: 8px;
}
.text-body {
  color: #5c5470; font-size: 18px; font-weight: bold; line-height: 1.5;
  white-space: pre-wrap;
}
.avatar {
  width: 100px; display: flex; justify-content: center; align-items: center;
}
.avatar-placeholder {
  font-size: 60px;
}
</style>
