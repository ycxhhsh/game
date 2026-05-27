<template>
  <div id="ui-layer" @mousedown="preventFocusLoss">
    <HUD />
    <InventoryUI v-if="uiStore.isInventoryOpen" />
    <DiaryUI v-if="uiStore.isDiaryOpen" />
    <HeartTreeUI v-if="uiStore.isHeartTreeOpen" />
    <MailboxUI v-if="uiStore.isMailboxOpen" />
    <DialogueUI v-if="uiStore.isDialogOpen" />
    <MomoToast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import HUD from './HUD.vue';
import InventoryUI from './InventoryUI.vue';
import DiaryUI from './DiaryUI.vue';
import HeartTreeUI from './HeartTreeUI.vue';
import MailboxUI from './MailboxUI.vue';
import DialogueUI from './DialogueUI.vue';
import MomoToast from './MomoToast.vue';
import { EventBus, EMOTION_EVENTS } from '../events/EventBus';

const uiStore = useUiStore();
const gameStore = useGameStore();

const preventFocusLoss = (e) => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
};

onMounted(() => {
  gameStore.hydrateEmotionState();

  EventBus.on('SHOW_DIALOGUE', (data) => {
    uiStore.showDialogue(data.text, data.name, data.avatar);
  });
  EventBus.on('TOGGLE_DIARY', () => {
    uiStore.toggleDiary();
  });
  EventBus.on(EMOTION_EVENTS.OPEN_MOOD_CHECKIN, () => {
    uiStore.openDiary();
  });
  EventBus.on(EMOTION_EVENTS.OPEN_HEART_TREE, () => {
    uiStore.openHeartTree();
  });
  EventBus.on(EMOTION_EVENTS.OPEN_MAILBOX, () => {
    uiStore.openMailbox();
  });

  window.addEventListener('keydown', (e) => {
    if (uiStore.isDialogOpen) {
      if (e.key === ' ' || e.key === 'Enter') {
        EventBus.emit('ADVANCE_DIALOGUE');
        uiStore.closeDialogue();
      }
      return;
    }

    if (e.key === '1') uiStore.setTool(1);
    if (e.key === '2') uiStore.setTool(2);
    if (e.key === '3') {
      if (uiStore.currentTool === 3) uiStore.toggleInventory();
      uiStore.setTool(3);
    }
    if (e.key === 'I' || e.key === 'i') uiStore.toggleInventory();
    if (e.key === 'Q' || e.key === 'q') uiStore.toggleDiary();
    if (e.key === 'H' || e.key === 'h') uiStore.toggleHeartTree();
    if (e.key === 'M' || e.key === 'm') uiStore.toggleMailbox();
    if (e.key === 'Escape') uiStore.closeAll();
  });
});
</script>

<style scoped>
#ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 960px;
  height: 540px;
  pointer-events: none;
  font-family: sans-serif;
  z-index: 1000;
}

#ui-layer > * {
  pointer-events: auto;
}
</style>
