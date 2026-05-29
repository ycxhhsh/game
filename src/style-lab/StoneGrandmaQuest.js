export const QUEST_STATUS = Object.freeze({
    NOT_STARTED: 'not_started',
    HANGING: 'hanging',
    ACCEPTED: 'accepted',
    FIRST_CONTACT: 'first_contact',
    MIND_MIRROR_PROMPTED: 'mind_mirror_prompted',
    MIND_READ_FAILED: 'mind_read_failed',
    MIND_READ_SUCCESS: 'mind_read_success',
    NEED_RETRY_DIALOGUE: 'need_retry_dialogue',
    MAZE_UNLOCKED: 'maze_unlocked',
    MAZE_COMPLETED_LOW: 'maze_completed_low',
    MAZE_COMPLETED_PERFECT: 'maze_completed_perfect',
    TOLERANCE_GRASS_OBTAINED: 'tolerance_grass_obtained',
    GIFT_WRONG_ITEM: 'gift_wrong_item',
    COMPLETED: 'completed',
    DELAYED_REWARD_SENT: 'delayed_reward_sent'
});

export const GRANDMA_STAGE_TEXTURES = Object.freeze({
    petrified: 'sg_grandma_petrified',
    cracked: 'sg_grandma_cracked',
    human: 'sg_grandma_human'
});

export const REAL_WORLD_TASKS = Object.freeze([
    { mode: 'observe', title: '观察一个人', text: '留意一个看起来心情不太好的人，猜猜他/她可能在想什么。不需要说话，只需要观察。' },
    { mode: 'stay_quietly', title: '安静待一会儿', text: '找一个家人，在旁边安静待 1-2 分钟，不需要说话。' },
    { mode: 'silent_companion', title: '安静的陪伴', text: '找一个看起来心情不太好的家人或同学，在旁边安静陪 3 分钟，可以什么都不说。' }
]);

export const MEMORY_BALLS = Object.freeze([
    {
        id: 'birthday_table',
        title: '空荡荡的生日餐桌',
        color: 'black',
        targetZone: 'pain',
        storyText: '她准备了红烧肉和蛋糕，门却一直没有响。后来，她不太想再过生日。'
    },
    {
        id: 'old_tree_promise',
        title: '老槐树下的约定',
        color: 'black',
        targetZone: 'pain',
        storyText: '小时候说好永远做朋友，后来信越来越少。她发现有些“永远”只有自己还记得。'
    },
    {
        id: 'new_year_alone',
        title: '一个人的新年',
        color: 'black',
        targetZone: 'pain',
        storyText: '烟花很好看，饺子也很热，可是屋子里没有人对她说“新年快乐”。'
    },
    {
        id: 'his_smile',
        title: '他笑的样子',
        color: 'gold',
        targetZone: 'warmth',
        storyText: '照相馆里，平时不爱笑的老伴忽然笑了。那张照片，她珍藏了很久。'
    },
    {
        id: 'rain_umbrella',
        title: '雨天送来的一把伞',
        color: 'gold',
        targetZone: 'warmth',
        storyText: '公交站下着雨，一个小姑娘把碎花伞递给她。每到雨天，她都会想起那点暖。'
    },
    {
        id: 'wildflowers',
        title: '邻居小孩送的花',
        color: 'gold',
        targetZone: 'warmth',
        storyText: '邻居小孩每天喊奶奶好，还送过一束路边野花。花谢了，颜色却留在心里。'
    }
]);

export const QUEST_COPY = Object.freeze({
    intro: {
        name: '墨墨',
        text: '石头奶奶又在那里坐了一整夜。她以前很温柔，可自从老爷爷走后，就总是把人赶开。我们去河边看看她吗？',
        options: [
            { label: '去河边看看石头奶奶', action: 'acceptQuest' },
            { label: '再陪心情树待一会儿', action: 'hangQuest' }
        ]
    },
    hanging: {
        name: '墨墨',
        text: '好，我们先慢慢待一会儿。等你准备好了，再来心情树旁找我。'
    },
    firstContact: {
        name: '石头奶奶',
        text: '哼！走开，离我远点。',
        options: [
            { label: '离开', action: 'leaveGrandma' },
            { label: '再试试看', action: 'tryAgain' }
        ]
    },
    leave: {
        name: '墨墨',
        text: '好吧……也许她今天心情不好。我们明天再来？'
    },
    mindMirrorPrompt: {
        name: '墨墨',
        text: '爷爷留给你的那面小镜子……也许能看见红色下面的东西。把读心镜拖到石头奶奶身上试试。'
    },
    mindReadInterrupted: {
        name: '墨墨',
        text: '好像只看到了表面……要不要再试一次？'
    },
    mindReadSuccess: {
        name: '石头奶奶',
        text: '你……看见了什么？',
        options: [
            { label: '我看见您生气', action: 'answerAnger' },
            { label: '我看见您很难过，不是生气', action: 'answerLoneliness' }
        ]
    },
    wrongAnswer: {
        name: '石头奶奶',
        text: '……算了，你走吧。'
    },
    unlockMaze: {
        name: '石头奶奶',
        text: '你……你怎么看到的？那是很久很久以前的事了。既然你看到了……那就进来吧，帮我看看那些乱七八糟的东西。'
    },
    wrongGift: {
        name: '石头奶奶',
        text: '谢谢……不过这不是我想要的。'
    },
    completedPerfect: {
        name: '石头奶奶',
        text: '你帮我把它们放对了地方……谢谢你。这株草，我可以种在他以前坐的那把椅子旁边吗？'
    },
    completedLow: {
        name: '石头奶奶',
        text: '没关系，你已经尽力了。这株草，我可以种在他以前坐的那把椅子旁边吗？'
    }
});

export class StoneGrandmaQuest {
    constructor() {
        this.status = QUEST_STATUS.NOT_STARTED;
        this.grandmaStage = 'petrified';
        this.favor = 0;
        this.trust = 0;
        this.wrongCount = 0;
        this.classifiedCount = 0;
        this.viewedBallId = null;
        this.hasMindMirror = true;
        this.hasToleranceGrass = false;
        this.hasCompanionVineSeed = false;
        this.hasUnlockedMaze = false;
        this.hasCompletedRealWorldTask = false;
        this.thirdChapterUnlocked = false;
        this.memoryBalls = MEMORY_BALLS.map((ball) => ({
            ...ball,
            viewed: false,
            classified: false
        }));
    }

    accept() {
        this.status = QUEST_STATUS.ACCEPTED;
    }

    hang() {
        this.status = QUEST_STATUS.HANGING;
    }

    firstContact() {
        this.status = QUEST_STATUS.FIRST_CONTACT;
    }

    promptMindMirror() {
        this.status = QUEST_STATUS.MIND_MIRROR_PROMPTED;
    }

    failMindRead() {
        this.status = QUEST_STATUS.MIND_READ_FAILED;
    }

    completeMindRead() {
        this.status = QUEST_STATUS.MIND_READ_SUCCESS;
        this.grandmaStage = 'cracked';
        this.trust = Math.max(this.trust, 1);
    }

    retryDialogue() {
        this.status = QUEST_STATUS.NEED_RETRY_DIALOGUE;
    }

    unlockMaze() {
        this.status = QUEST_STATUS.MAZE_UNLOCKED;
        this.hasUnlockedMaze = true;
    }

    viewBall(id) {
        const ball = this.memoryBalls.find((item) => item.id === id);
        if (!ball || ball.classified) return null;
        ball.viewed = true;
        this.viewedBallId = id;
        return ball;
    }

    classifyBall(id, zone) {
        const ball = this.memoryBalls.find((item) => item.id === id);
        if (!ball || ball.classified || !ball.viewed) return { ok: false, reason: 'not_viewed', ball };
        if (ball.targetZone !== zone) {
            this.wrongCount += 1;
            return { ok: false, reason: 'wrong_zone', ball };
        }
        ball.classified = true;
        this.classifiedCount += 1;
        if (this.classifiedCount >= this.memoryBalls.length) {
            this.completeMaze();
        }
        return { ok: true, ball };
    }

    completeMaze() {
        if (this.wrongCount <= 2) {
            this.status = QUEST_STATUS.MAZE_COMPLETED_PERFECT;
            this.favor += 3;
            this.hasCompanionVineSeed = true;
        } else {
            this.status = QUEST_STATUS.MAZE_COMPLETED_LOW;
            this.favor += 2;
        }
    }

    obtainToleranceGrass() {
        this.hasToleranceGrass = true;
        this.status = QUEST_STATUS.TOLERANCE_GRASS_OBTAINED;
    }

    giftWrongItem() {
        this.status = QUEST_STATUS.GIFT_WRONG_ITEM;
        this.favor += 1;
    }

    complete() {
        this.status = QUEST_STATUS.COMPLETED;
        this.grandmaStage = 'human';
        this.favor = Math.max(this.favor + 5, 5);
        this.hasToleranceGrass = false;
        this.hasCompletedRealWorldTask = true;
        this.thirdChapterUnlocked = true;
    }

    sendDelayedReward() {
        this.status = QUEST_STATUS.DELAYED_REWARD_SENT;
        this.hasCompanionVineSeed = true;
    }

    getMazeResultType() {
        return this.wrongCount <= 2 ? 'perfect' : 'low';
    }

    getGrandmaTexture() {
        return GRANDMA_STAGE_TEXTURES[this.grandmaStage] ?? GRANDMA_STAGE_TEXTURES.petrified;
    }
}
