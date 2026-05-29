// A simple EventBus for Vue-Phaser communication
export const EMOTION_EVENTS = Object.freeze({
  OPEN_MOOD_CHECKIN: 'OPEN_MOOD_CHECKIN',
  OPEN_HEART_TREE: 'OPEN_HEART_TREE',
  OPEN_MAILBOX: 'OPEN_MAILBOX',
  MOMO_PROMPT: 'MOMO_PROMPT',
  MOMO_STATE_CHANGED: 'MOMO_STATE_CHANGED',
  SELF_CARE_DONE: 'SELF_CARE_DONE',
  MOOD_ENTRY_RECORDED: 'MOOD_ENTRY_RECORDED'
});

class EventBusClass {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(l => l(data));
  }
}
export const EventBus = new EventBusClass();
