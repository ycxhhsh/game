import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isInventoryOpen: false,
    isDiaryOpen: false,
    isHeartTreeOpen: false,
    isMailboxOpen: false,
    isDialogOpen: false,
    currentTool: 1,
    currentSeed: 'carrot',
    dialogue: {
      text: '',
      name: '林奶奶',
      avatar: 'grandma_portrait'
    }
  }),
  actions: {
    toggleInventory() {
      this.isInventoryOpen = !this.isInventoryOpen;
      if (this.isInventoryOpen) {
        this.isDiaryOpen = false;
        this.isHeartTreeOpen = false;
        this.isMailboxOpen = false;
      }
    },
    openInventory() {
      this.isInventoryOpen = true;
      this.isDiaryOpen = false;
      this.isHeartTreeOpen = false;
      this.isMailboxOpen = false;
    },
    toggleDiary() {
      this.isDiaryOpen = !this.isDiaryOpen;
      if (this.isDiaryOpen) {
        this.isInventoryOpen = false;
        this.isHeartTreeOpen = false;
        this.isMailboxOpen = false;
      }
    },
    openDiary() {
      this.isDiaryOpen = true;
      this.isInventoryOpen = false;
      this.isHeartTreeOpen = false;
      this.isMailboxOpen = false;
    },
    toggleHeartTree() {
      this.isHeartTreeOpen = !this.isHeartTreeOpen;
      if (this.isHeartTreeOpen) {
        this.isInventoryOpen = false;
        this.isDiaryOpen = false;
        this.isMailboxOpen = false;
      }
    },
    openHeartTree() {
      this.isHeartTreeOpen = true;
      this.isInventoryOpen = false;
      this.isDiaryOpen = false;
      this.isMailboxOpen = false;
    },
    toggleMailbox() {
      this.isMailboxOpen = !this.isMailboxOpen;
      if (this.isMailboxOpen) {
        this.isInventoryOpen = false;
        this.isDiaryOpen = false;
        this.isHeartTreeOpen = false;
      }
    },
    openMailbox() {
      this.isMailboxOpen = true;
      this.isInventoryOpen = false;
      this.isDiaryOpen = false;
      this.isHeartTreeOpen = false;
    },
    closeAll() {
      this.isInventoryOpen = false;
      this.isDiaryOpen = false;
      this.isHeartTreeOpen = false;
      this.isMailboxOpen = false;
    },
    setTool(toolId) {
      this.currentTool = toolId;
    },
    setSeed(seedId) {
      this.currentSeed = seedId;
    },
    showDialogue(text, name = '林奶奶', avatar = 'grandma_portrait') {
      this.dialogue = { text, name, avatar };
      this.isDialogOpen = true;
      this.closeAll();
    },
    closeDialogue() {
      this.isDialogOpen = false;
    }
  }
});
