import { defineStore } from 'pinia';
import { EventBus, EMOTION_EVENTS } from '../events/EventBus';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const HEART_TREE_STAGES = {
  wilted: { label: '枯萎', min: 0, color: '#8b8f7a' },
  recovering: { label: '恢复中', min: 30, color: '#a9c67b' },
  healthy: { label: '健康', min: 60, color: '#7bbf72' },
  blooming: { label: '开花', min: 85, color: '#f0a6b7' }
};

const SELF_CARE = {
  weed: {
    metric: 'weed',
    battery: 10,
    health: 12,
    water: 0,
    prompt: '这株杂草被你轻轻拔掉了。心里乱乱的地方，好像也松开了一点。'
  },
  water: {
    metric: 'water',
    battery: 8,
    health: 10,
    water: 22,
    prompt: '心情树喝到水了。照顾它的时候，你也在照顾自己。'
  },
  listen: {
    metric: 'listen',
    battery: 14,
    health: 8,
    water: 4,
    prompt: '我们先听一会儿风。很多感觉不用马上说清楚。'
  },
  rest: {
    metric: 'rest',
    battery: 20,
    health: 6,
    water: 0,
    prompt: '停下来不是退后，是给自己重新蓄一点光。'
  },
  hugMomo: {
    metric: 'hugMomo',
    battery: 12,
    health: 5,
    water: 0,
    prompt: '墨墨安静地贴近你。它没有催你，只是在这里。'
  },
  realityEcho: {
    metric: 'realityEcho',
    battery: 6,
    health: 14,
    water: 3,
    prompt: '这一点真实发生过的温柔，慢慢落进了树根。'
  }
};

const NEGATIVE_EMOTIONS = new Set(['cloud', 'tangle', 'heavy', 'spark', 'rain', 'tired']);

const createInitialEmotionState = () => ({
  currentDay: 1,
  socialBattery: 100,
  moodEntries: [],
  heartTree: {
    health: 55,
    stage: 'recovering',
    water: 35,
    weeds: 2,
    careToday: 0,
    careStreak: 0,
    lastCareDay: null,
    roots: 1,
    blossoms: [],
    recoveryStartedAt: null,
    negativeCareCount: 0,
    negativeRecoveryDurations: [],
    realityEchoes: []
  },
  momo: {
    mood: 'green',
    color: '#74c77b',
    pose: 'active',
    languageLevel: 'normal',
    silent: false,
    lastPromptAt: 0,
    promptCooldownMs: 14000,
    currentPrompt: ''
  },
  emotionMetrics: {
    selfCareCounts: {
      weed: 0,
      water: 0,
      listen: 0,
      rest: 0,
      hugMomo: 0,
      realityEcho: 0
    },
    totalSelfCareActions: 0,
    proactiveCareCount: 0,
    moodEntriesCount: 0,
    negativeMoodCount: 0,
    compoundEntries: 0,
    moodWordSet: [],
    weatherClears: 0,
    aiPromptAcceptedCount: 0
  }
});

const getHeartTreeStage = (health) => {
  if (health >= HEART_TREE_STAGES.blooming.min) return 'blooming';
  if (health >= HEART_TREE_STAGES.healthy.min) return 'healthy';
  if (health >= HEART_TREE_STAGES.recovering.min) return 'recovering';
  return 'wilted';
};

export const useGameStore = defineStore('game', {
  state: () => ({
    time: '06:00',
    weather: 'sunny',
    tomorrowWeather: 'sunny',
    carrotCount: 0,
    tomatoCount: 0,
    sunflowerCount: 0,
    blueberryCount: 0,
    carrotSeedCount: 15,
    tomatoSeedCount: 15,
    sunflowerSeedCount: 15,
    blueberrySeedCount: 15,
    grandmaAffection: 0,
    ...createInitialEmotionState()
  }),
  getters: {
    heartTreeStageInfo: (state) => HEART_TREE_STAGES[state.heartTree.stage] || HEART_TREE_STAGES.recovering,
    latestMoodEntry: (state) => state.moodEntries[0] || null,
    emotionGranularity: (state) => state.emotionMetrics.moodWordSet.length,
    compoundMoodRatio: (state) => {
      if (!state.emotionMetrics.moodEntriesCount) return 0;
      return Math.round((state.emotionMetrics.compoundEntries / state.emotionMetrics.moodEntriesCount) * 100);
    },
    selfCareConsistency: (state) => {
      const denominator = Math.min(7, Math.max(1, state.currentDay));
      return Math.round((Math.min(state.heartTree.careStreak, 7) / denominator) * 100);
    }
  },
  actions: {
    addCrop(type) {
      if (type === 'carrot') this.carrotCount++;
      else if (type === 'tomato') this.tomatoCount++;
      else if (type === 'sunflower') this.sunflowerCount++;
      else if (type === 'blueberry') this.blueberryCount++;
    },
    useCrop(type) {
      if (type === 'carrot' && this.carrotCount > 0) { this.carrotCount--; return true; }
      if (type === 'tomato' && this.tomatoCount > 0) { this.tomatoCount--; return true; }
      if (type === 'sunflower' && this.sunflowerCount > 0) { this.sunflowerCount--; return true; }
      if (type === 'blueberry' && this.blueberryCount > 0) { this.blueberryCount--; return true; }
      return false;
    },
    useSeed(type) {
      if (type === 'carrot' && this.carrotSeedCount > 0) { this.carrotSeedCount--; return true; }
      if (type === 'tomato' && this.tomatoSeedCount > 0) { this.tomatoSeedCount--; return true; }
      if (type === 'sunflower' && this.sunflowerSeedCount > 0) { this.sunflowerSeedCount--; return true; }
      if (type === 'blueberry' && this.blueberrySeedCount > 0) { this.blueberrySeedCount--; return true; }
      return false;
    },
    updateTime(newTime) {
      this.time = newTime;
    },
    setTomorrowWeather(newWeather) {
      this.tomorrowWeather = newWeather;
      this.persistEmotionState();
    },
    addAffection() {
      this.grandmaAffection++;
      this.adjustSocialBattery(-4, 'npcGift');
    },
    hydrateEmotionState() {
      if (typeof window === 'undefined') return;
      try {
        const raw = window.localStorage.getItem('heartIslandEmotionState');
        if (!raw) return;
        const saved = JSON.parse(raw);
        const initial = createInitialEmotionState();
        this.currentDay = saved.currentDay ?? initial.currentDay;
        this.socialBattery = saved.socialBattery ?? initial.socialBattery;
        this.moodEntries = Array.isArray(saved.moodEntries) ? saved.moodEntries : initial.moodEntries;
        this.heartTree = { ...initial.heartTree, ...(saved.heartTree || {}) };
        this.momo = { ...initial.momo, ...(saved.momo || {}) };
        this.emotionMetrics = {
          ...initial.emotionMetrics,
          ...(saved.emotionMetrics || {}),
          selfCareCounts: {
            ...initial.emotionMetrics.selfCareCounts,
            ...((saved.emotionMetrics && saved.emotionMetrics.selfCareCounts) || {})
          }
        };
        this.weather = saved.weather || this.weather;
        this.tomorrowWeather = saved.tomorrowWeather || this.tomorrowWeather;
        this.syncHeartTreeStage();
        this.evaluateMomoState(false);
      } catch (error) {
        console.warn('Unable to hydrate emotion state', error);
      }
    },
    persistEmotionState() {
      if (typeof window === 'undefined') return;
      const payload = {
        currentDay: this.currentDay,
        socialBattery: this.socialBattery,
        moodEntries: this.moodEntries.slice(0, 30),
        heartTree: this.heartTree,
        momo: this.momo,
        emotionMetrics: this.emotionMetrics,
        weather: this.weather,
        tomorrowWeather: this.tomorrowWeather
      };
      window.localStorage.setItem('heartIslandEmotionState', JSON.stringify(payload));
    },
    recordMoodEntry({ emotions = [], note = '', intensity = 3, createdAt = Date.now() }) {
      const normalized = emotions.map((emotion) => ({
        id: emotion.id,
        label: emotion.label,
        image: emotion.image,
        valence: emotion.valence || (NEGATIVE_EMOTIONS.has(emotion.id) ? 'negative' : 'positive')
      }));
      if (!normalized.length) return null;

      const hasNegative = normalized.some((emotion) => emotion.valence === 'negative');
      const entry = {
        id: `mood-${createdAt}-${this.moodEntries.length}`,
        emotions: normalized,
        note: note.trim(),
        intensity: Number(intensity),
        createdAt,
        day: this.currentDay,
        hasNegative
      };

      this.moodEntries = [entry, ...this.moodEntries].slice(0, 30);
      this.emotionMetrics.moodEntriesCount += 1;
      if (normalized.length > 1) this.emotionMetrics.compoundEntries += 1;
      normalized.forEach((emotion) => {
        if (emotion.label && !this.emotionMetrics.moodWordSet.includes(emotion.label)) {
          this.emotionMetrics.moodWordSet.push(emotion.label);
        }
      });

      if (hasNegative) {
        this.emotionMetrics.negativeMoodCount += 1;
        this.heartTree.recoveryStartedAt = createdAt;
        this.heartTree.negativeCareCount = 0;
        this.heartTree.weeds = clamp(this.heartTree.weeds + 1, 0, 8);
        this.heartTree.health = clamp(this.heartTree.health - Number(intensity) * 2);
        this.adjustSocialBattery(-Math.max(4, Number(intensity) * 2), 'moodCheckin', false);
        this.setTomorrowWeather(Number(intensity) >= 4 ? 'foggy' : 'rainy');
      } else {
        this.heartTree.health = clamp(this.heartTree.health + 3);
        this.adjustSocialBattery(3 + Number(intensity), 'moodCheckin', false);
        this.setTomorrowWeather('sunny');
      }

      this.syncHeartTreeStage();
      this.evaluateMomoState();
      EventBus.emit(EMOTION_EVENTS.MOOD_ENTRY_RECORDED, entry);
      this.showMomoPrompt(
        hasNegative
          ? '这团感觉被你看见了。我们可以慢慢呼吸一下，或者去心情树旁坐坐。'
          : '这个小小的记录会留在今天的光里。',
        { quiet: hasNegative }
      );
      this.persistEmotionState();
      return entry;
    },
    performSelfCare(type, payload = {}) {
      const config = SELF_CARE[type];
      if (!config) return null;

      const beforeBattery = this.socialBattery;
      const wasRecovering = Boolean(this.heartTree.recoveryStartedAt);
      const proactive = beforeBattery >= 20 && beforeBattery <= 50;
      const recoveryBonus = proactive ? 4 : 0;

      this.emotionMetrics.selfCareCounts[config.metric] += 1;
      this.emotionMetrics.totalSelfCareActions += 1;
      if (proactive) this.emotionMetrics.proactiveCareCount += 1;
      if (type === 'hugMomo') this.emotionMetrics.aiPromptAcceptedCount += 1;

      this.adjustSocialBattery(config.battery + (proactive ? 4 : 0), type, false);
      this.heartTree.health = clamp(this.heartTree.health + config.health + recoveryBonus);
      this.heartTree.water = clamp(this.heartTree.water + config.water);
      this.heartTree.careToday += 1;
      this.updateCareStreak();

      if (type === 'weed') {
        this.heartTree.weeds = clamp(this.heartTree.weeds - 1, 0, 8);
      }

      if (type === 'realityEcho') {
        const echo = {
          text: payload.note || '今天也有一点真实的小小回响。',
          day: this.currentDay,
          createdAt: Date.now()
        };
        this.heartTree.realityEchoes = [echo, ...this.heartTree.realityEchoes].slice(0, 12);
        this.heartTree.roots = clamp(this.heartTree.roots + 1, 1, 12);
      }

      if (wasRecovering) {
        this.heartTree.negativeCareCount += 1;
        this.addHealingBlossom(type);
        if (this.heartTree.negativeCareCount >= 3 && this.tomorrowWeather !== 'sunny') {
          this.tomorrowWeather = 'sunny';
          this.emotionMetrics.weatherClears += 1;
        }
        if (this.heartTree.health >= 60 || this.heartTree.negativeCareCount >= 3) {
          const duration = Date.now() - this.heartTree.recoveryStartedAt;
          this.heartTree.negativeRecoveryDurations.push(duration);
          this.heartTree.recoveryStartedAt = null;
        }
      }

      this.syncHeartTreeStage();
      this.evaluateMomoState();
      const result = { type, payload, proactive, tree: this.heartTree, battery: this.socialBattery };
      EventBus.emit(EMOTION_EVENTS.SELF_CARE_DONE, result);
      this.showMomoPrompt(config.prompt, { quiet: this.momo.silent });
      this.persistEmotionState();
      return result;
    },
    adjustSocialBattery(delta, reason = 'unknown', shouldEvaluate = true) {
      this.socialBattery = clamp(this.socialBattery + delta);
      if (shouldEvaluate) {
        this.evaluateMomoState();
        this.persistEmotionState();
      }
      return { value: this.socialBattery, reason };
    },
    evaluateMomoState(emit = true) {
      const previousMood = this.momo.mood;
      const lowTree = this.heartTree.health < 30;
      const overloaded = this.socialBattery <= 15 || (lowTree && this.heartTree.weeds >= 4);

      if (overloaded || this.socialBattery < 30 || lowTree) {
        this.momo.mood = 'red';
        this.momo.color = '#d96a6a';
        this.momo.pose = overloaded ? 'silent' : 'curled';
        this.momo.languageLevel = overloaded ? 'silent' : 'low';
        this.momo.silent = overloaded;
      } else if (this.socialBattery < 80 || this.heartTree.health < 60) {
        this.momo.mood = 'yellow';
        this.momo.color = '#dfc45f';
        this.momo.pose = 'sleepy';
        this.momo.languageLevel = 'soft';
        this.momo.silent = false;
      } else {
        this.momo.mood = 'green';
        this.momo.color = '#74c77b';
        this.momo.pose = 'active';
        this.momo.languageLevel = 'normal';
        this.momo.silent = false;
      }

      if (emit && previousMood !== this.momo.mood) {
        EventBus.emit(EMOTION_EVENTS.MOMO_STATE_CHANGED, { ...this.momo });
        if (this.momo.mood === 'red') {
          this.showMomoPrompt('墨墨慢慢靠近你。也许我们可以先给自己一点时间。', { quiet: true });
        }
      }
      return this.momo;
    },
    advanceEmotionDay() {
      this.currentDay += 1;
      this.weather = this.tomorrowWeather;
      this.tomorrowWeather = 'sunny';

      if (this.heartTree.careToday === 0) {
        this.heartTree.health = clamp(this.heartTree.health - 7);
        this.heartTree.weeds = clamp(this.heartTree.weeds + 1, 0, 8);
      } else if (this.heartTree.careToday >= 2) {
        this.heartTree.health = clamp(this.heartTree.health + 2);
      }

      this.heartTree.water = clamp(this.heartTree.water - 16);
      if (this.heartTree.water < 20) {
        this.heartTree.health = clamp(this.heartTree.health - 4);
      }
      this.heartTree.careToday = 0;

      this.syncHeartTreeStage();
      this.evaluateMomoState();
      this.persistEmotionState();
      return { weather: this.weather, tree: this.heartTree };
    },
    updateCareStreak() {
      if (this.heartTree.lastCareDay === this.currentDay) return;
      if (this.heartTree.lastCareDay === this.currentDay - 1) {
        this.heartTree.careStreak += 1;
      } else {
        this.heartTree.careStreak = 1;
      }
      this.heartTree.lastCareDay = this.currentDay;
    },
    addHealingBlossom(type) {
      const colors = {
        weed: '#f4a6b8',
        water: '#9ad7eb',
        listen: '#d9c1f2',
        rest: '#ffd59a',
        hugMomo: '#b2e5c7',
        realityEcho: '#fff0a8'
      };
      this.heartTree.blossoms = [
        { type, color: colors[type] || '#f4a6b8', day: this.currentDay, createdAt: Date.now() },
        ...this.heartTree.blossoms
      ].slice(0, 12);
    },
    syncHeartTreeStage() {
      this.heartTree.stage = getHeartTreeStage(this.heartTree.health);
    },
    showMomoPrompt(text, options = {}) {
      const now = Date.now();
      const force = Boolean(options.force);
      if (!force && now - this.momo.lastPromptAt < this.momo.promptCooldownMs) return false;
      this.momo.currentPrompt = text;
      this.momo.lastPromptAt = now;
      EventBus.emit(EMOTION_EVENTS.MOMO_PROMPT, {
        text,
        mood: this.momo.mood,
        color: this.momo.color,
        pose: this.momo.pose,
        quiet: Boolean(options.quiet),
        createdAt: now
      });
      this.persistEmotionState();
      return true;
    }
  }
});
