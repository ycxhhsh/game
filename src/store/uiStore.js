import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isInventoryOpen: false,
    isDiaryOpen: false,
    isDialogOpen: false,
    currentTool: 1, // 1: hoe, 2: water, 3: seed
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
      if (this.isInventoryOpen) this.isDiaryOpen = false;
    },
    toggleDiary() {
      this.isDiaryOpen = !this.isDiaryOpen;
      if (this.isDiaryOpen) this.isInventoryOpen = false;
    },
    closeAll() {
      this.isInventoryOpen = false;
      this.isDiaryOpen = false;
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
