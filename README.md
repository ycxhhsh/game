# 🌻 心屿镇 (Heart Island Town) - 项目交接文档

## 2026-05-20 资产交接补充

### Viewer 资源状态
- `viewer.html` 的“主角动画序列”已清理四向 walk sheet 边缘白边，原尺寸、4 帧布局和底部锚点保持不变。
- `viewer.html` 的“工具动作序列”已切换到统一主角风格的完整动作 sheet：
  - `public/player_hoe_sheet_unified.png`
  - `public/player_water_sheet_unified.png`
  - `public/player_seed_sheet_unified.png`
- 三张工具动作 sheet 已从 4 帧扩展为 8 帧横向序列，整体 `2560x460`，单帧 `320x460`；当前用于 `viewer.html` 与 `style-lab.html` 预览验证，尚未接入正式 `GameScene.js` 实机动作。
- `viewer.html` 的“当前版本：墨墨与心情树”已更新为匹配当前主角工具动作质感的资源：
  - 墨墨：`public/concepts/current/momo-concept.png`、`public/concepts/current/momo-actions.png`
  - 心情树：`public/concepts/current/heart-tree-concept.png`、`public/concepts/current/heart-tree-stages.png`
- 透明 cutout 位于 `public/concepts/current/cutouts/`，生成源图备份位于 `public/concepts/current/sources/`。`public/concepts/` 下上一版精美参考稿保持不动。
- 墨墨新增 6 组动作 sheet，位于 `public/concepts/current/momo-sheets/`，每张 `640x160`、单帧 `160x160`、4 帧横向序列。
- 林奶奶新增摇摇躺椅坐姿与站立姿动作 sheet，位于 `public/concepts/current/grandma/`，每张 `960x320`、单帧 `240x320`、4 帧横向序列。

### 验收与后续
- 验收入口：启动 `npm run dev` 后访问 `http://localhost:5888/viewer.html`，优先检查主角动画序列、工具动作序列、墨墨动作序列、林奶奶动作序列。
- 透明 PNG 验收重点：角落 alpha 为 0，无白底、无明显 key 色边、无裁切，各动作播放时底部锚点稳定。
- 下一步如需实机接入，需要单独更新 Phaser 加载与渲染逻辑，把 current cutout 或后续定稿资源接到游戏场景中；本轮不修改 `GameScene.js`。

## 2026-05-21 Style Lab 画风试验窗口

### 当前接入范围
- 新增独立入口 `style-lab.html`，启动 `npm run dev` 后访问 `http://localhost:5888/style-lab.html` 可进入新画风试验窗口。
- 本轮仅做画风融合试验，不修改正式 `src/scenes/GameScene.js`，也不迁移完整种田、背包、天气、对话和心情树 UI。
- 试验场景位于 `src/style-lab/`，包含可移动主角、相机跟随、基础碰撞、墨墨跟随、林奶奶摇摇躺椅 idle 展示。
- `vite.config.js` 已加入多页构建输入，`npm run build` 会同时输出 `dist/index.html` 与 `dist/style-lab.html`。
- 角色沿用当前 viewer 优先资源：主角四向 walk sheet、墨墨 active follow sheet、林奶奶摇摇躺椅 sheet。

### 世界资源包
- 新画风地图资源位于 `public/assets/style-lab/`，统一为清晰描边、柔和像素阴影、温暖 chibi 游戏资产质感。
- 地面 tile 位于 `public/assets/style-lab/tiles/`：草地 3 种、泥地 2 种、耕地 2 种、水面 2 帧、小路 2 种，均为 `64x64`。
- 自然物件位于 `public/assets/style-lab/objects/`：阔叶树、松树、开花树、小果树、矮灌木树、小屋、心情树。
- 花草位于 `public/assets/style-lab/foliage/`：草丛、野花、蒲公英、小蘑菇、蕨叶、石边草、粉花、黄花。
- 装饰物位于 `public/assets/style-lab/props/`：小石头、木栅栏段、木牌、田边小桶；软阴影素材为 `public/assets/style-lab/soft_shadow.png`。

### 验收方式
- 页面验收：打开 `http://localhost:5888/style-lab.html`，检查玩家可移动、相机跟随、地图可观察、基础碰撞有效、墨墨跟随主角、林奶奶摇摇躺椅循环正常。
- 视觉验收：确认农田区、林奶奶小屋区、心情树区、水岸与小路区都有明确分区；树、花草、石头等自然物件可见多种变体，避免全地图重复同一种资源。
- 资源验收：透明物件 PNG 四角 alpha 为 0，地面 tile 可平铺，无白底和明显 key 色边。

## 2026-05-22 Style Lab 二轮接入与墨墨逐帧动画

### Style Lab 结构调整
- `src/style-lab/StyleLabScene.js` 保持为独立试验场景，正式 `src/scenes/GameScene.js` 仍未修改。
- 新增 `src/style-lab/styleLabAssets.js` 管理 Style Lab 的 tile、世界物件、主角、墨墨和林奶奶 sheet 清单。
- 新增 `src/style-lab/styleLabLayout.js` 管理地图尺寸、农田、小路、水域、地标、树木、花草和装饰物摆放数据。
- 这次拆分后，后续迁回正式游戏时可以优先复用资源 manifest、布局数据、变体池和底部锚点排序策略。

### 墨墨逐帧动画
- 新增墨墨 animated sheet，位于 `public/concepts/current/momo-sheets/animated/`：
  - `momo-active-follow-animated-sheet.png`
  - `momo-sleepy-yawn-animated-sheet.png`
  - `momo-low-energy-curled-animated-sheet.png`
  - `momo-silent-breathing-animated-sheet.png`
  - `momo-hug-ready-animated-sheet.png`
  - `momo-dandelion-breath-animated-sheet.png`
- 每张仍为 `640x160`、单帧 `160x160`、4 帧横向序列，底部锚点保持一致；在原动作基础上增强了跳步、呼吸、蜷缩、抱抱和蒲公英粒子的帧内变化。
- `viewer.html` 的墨墨动作序列已切换到 animated sheet，并把“透明候选素材”区的墨墨预览改为逐帧 canvas 轮播。
- `style-lab.html` 会根据场景状态切换墨墨动画：移动时活跃跟随，靠近林奶奶时抱抱，靠近心情树时蒲公英呼吸，原地停留后进入沉默呼吸、困倦打哈欠或低能量蜷缩。

### Style Lab 二轮接入
- `style-lab.html` 已接入主角工具动作 sheet：
  - `public/player_hoe_sheet_unified.png`
  - `public/player_water_sheet_unified.png`
  - `public/player_seed_sheet_unified.png`
- 工具动作已重绘为 8 帧横向序列，整体 `2560x460`、单帧 `320x460`，比上一版 4 帧动作更连贯；Style Lab 与 viewer 均已按 8 帧播放。
- 试验场景中新增轻量种田验证逻辑：按 `1/2/3` 切换锄头、水壶、种子，面向农田按 `E` 或 `Space` 可依次完成普通地块、耕地、湿润耕地、播种小芽的状态变化。工具动作播放时会暂停移动，并用统一底部锚点的动作 sprite 覆盖主角当前位置。
- 林奶奶摇摇躺椅展示比例已从大画面展示缩小为接近主角体量，阴影、互动半径和碰撞范围同步收窄。
- 墨墨跟随改为贴地小步跳：停下时稳定落地，移动时仅有 1-2px 的脚步起伏，并使用固定在脚底附近的软阴影强化落地感。
- 石头、栅栏、小桶、小屋、心情树、林奶奶摇椅等硬物已加入碰撞；小花小草默认不碰撞，避免走路过卡。
- 自然物摆放规则已收紧：树木禁止出现在水域、农田、小路、房屋入口和水岸缓冲区；石头偏向路边、田边和树根附近；花草以小簇分布，保留至少 5 种树与 8 种花草变体。
- 新增 Style Lab 专用小屋内部场景 `src/style-lab/StyleLabInteriorScene.js`。室内已改为与外部地图一致的 64px 网格视角：地板/墙体 tile 位于 `public/assets/style-lab/interior/tiles/`，床、桌子、炉灶、书架、摇摇椅、门垫等家具已拆成独立透明对象，位于 `public/assets/style-lab/interior/objects/`，避免整张背景图与外部地图视角脱节。靠近室外小屋门按 `Enter` 进屋，室内可走并有基础碰撞；底部中央门槛/门垫为可退出区域，按 `Enter` 或 `E` 返回室外。
- 本轮仍只修改 Style Lab 试验窗口和资源交接说明，正式 `src/scenes/GameScene.js`、正式 `src/scenes/RoomScene.js`、背包数量、体力消耗、作物成长天数和剧情对话均未接入。

### 验收方式
- 打开 `http://localhost:5888/viewer.html`，检查“墨墨动作序列”和顶部墨墨预览是否是真正逐帧播放，不再只是切换静态 cutout。
- 打开 `http://localhost:5888/style-lab.html`，移动主角、停留、靠近林奶奶和心情树，观察墨墨状态切换；检查林奶奶比例、树/石头/硬物碰撞、自然物分布和水岸避让。
- 在 Style Lab 中按 `1/2/3` 切工具，面向农田按 `E` 或 `Space`，检查耕地、浇水、播种动作和地块状态变化；靠近小屋门按 `Enter` 进入室内，室内按 `Enter` 或 `E` 返回。
- 可直接访问 `http://localhost:5888/style-lab.html?interior=1` 单独验收室内场景视角、家具碰撞与出门门槛。
- 资源检查：墨墨 animated sheet 尺寸为 `640x160`，主角工具 sheet 尺寸为 `2560x460`，室内家具为独立透明 PNG；四角 alpha 为 0，播放时无白底、无明显缩放漂移。

## 🎮 游戏简介
《心屿镇》是一款以治愈、解压为核心理念的【Web 像素风农场模拟管理游戏】。
我们完全摒弃了传统的“疲劳值”、“主线枯燥任务”与“时间淘汰机制”，鼓励玩家伴随着每天随机的治愈天气，在海岛上自在发呆、种田以及随心所欲地去与留守的林奶奶建立无压力的情感羁绊。

---

## 🛠️ 当前技术栈及架构状态
- **核心引擎**: `Phaser 3.80.1` 
- **构建工具**: `Vite 5` (极速热重载)
- **底层架构**: 没有使用任何现成的 UI 框架 (Vue/React)，全靠原生 JavaScript 面向对象驱动 (`ES6 Classes`)，包含 `BootScene.js`（资源加载/启动层）与 `GameScene.js`（核心游玩/交互层）。
- **特制核心系统（引以为傲的技术栈）**:
  - **基于字符串数组的贴图引擎**: 我们实现了一套独特的字符矩阵映射系统（在 `constants.js` 中），能将 `["yyyy", "HyyH"]` 这种简易的自定义像素矩阵阵列在 `BootScene` 启动时直接 `generateTexture` 转化为引擎实物资源！这套系统也全面肩承接起了 UI 图标和种子的渲染。

---

## 🚀 部署与体验指南 (Deployment & Usage)

### 1. 本地开发与试玩
想要在自己的电脑上运行《心屿镇》，请在终端（Terminal）克隆仓库并进入根目录后输入：

```bash
# 1. 下载必需的 Node.js 游戏依赖包
npm install

# 2. 启动基于 Vite 的秒级热更新本地游戏服务器
npm run dev
```

启动成功后，浏览器环境会自动分发。请在游览器中打开终端提示的地址（根据 `vite.config.js`，默认端口地址为 `http://localhost:5888`）。直接把网址贴进浏览器即可身临其境体验纯正的农场循环！

### 2. 脱机动画动作画廊 (Animation Viewer)
为了单独展示和收纳这版高清迭代的像素帧库资源（包含角色四向行走、重型体力活如耕地、浇水的交互动作原画拆片），我们专门在根目录配置了免打包编译的原生 HTML 序列帧展示工具：

- 只要保证您刚刚的 `npm run dev` 服务器正在后台挂起运行，
- 您就可以直接在浏览器中访问画廊工具页：[http://localhost:5888/viewer.html](http://localhost:5888/viewer.html)
- 画廊页支持任意分辨率流式播放，由于调用的是纯物理底稿素材，不会占用任何游戏内存。您可以查阅本迭代的所有废弃兼过渡高清资源。

### 3. 新画风试验窗口 (Style Lab)
为了验证当前主角、墨墨、林奶奶与新地图画风的融合效果，根目录新增了独立试验入口：

- 启动 `npm run dev` 后访问：[http://localhost:5888/style-lab.html](http://localhost:5888/style-lab.html)
- 该窗口使用 `src/style-lab/` 下的独立 Phaser 场景，不会影响正式游戏入口和 `viewer.html`。
- 目前用于观察新地图资源、角色比例、底部锚点排序、墨墨跟随和林奶奶摇摇躺椅展示，后续确认方向后再迁回正式 `GameScene.js`。

### 4. 生成公网站点 (Build for Production)
如果希望将游戏分享到如 **GitHub Pages** 或独立游戏平台 **itch.io** 供全球玩家网页串流游玩：
1. 运行 `npm run build` 进行极速压缩打包。
2. 命令走完后，同级目录会新生成一个 `dist` 文件夹，包含 `index.html` 以及压缩过的 `assets`。这就是全静态、免后端的直接网页游戏打包主体。您可以将它上传至这世上的任何公网服务器！

## ✅ 已完成的开发里程碑 (Completed Features)

### 1. 环境与材质系统 (Environment & Textures)
- 地图系统不再是简单死板的数组，已经全面重写接入了 `Phaser.Tilemaps` API，渲染出 `120x80` 的巨大可探索世界空间。
- **动态寻机生成算法**: 大幅优化并大幅度削减了环境（花草、树木）的随机铺设密度至 1% 的阈值，呈现出了纯粹清爽、“充满留白边界感”的星露谷同款农场感。
- **全系高清重置 (HD Overhaul)**: 我们摒弃了初期模糊不清的文字贴图和抽象马卡龙色块，全线更新为高品质的星露谷式 2D 像素 AI 原帖。无论是针叶松树、夏天大橡树、郁金香、还是杂草，全面升级了美术表现力。

### 2. 玩家控制器及物理系统 (Player & Physics)
- 引入 `Arcade Physics` 建立完整的刚梯层与碰撞体，玩家不再会越界，并开启了摄像机 `camera.startFollow` 动态追焦。
- 引入了类似“纸片马里奥”风格的移动特性，走路时自带弹性的 `Tween` 角度偏移与坠落跳跃。

### 3. 核心游玩逻辑 (Farming Loop)
- **种田机制**: 实装完整的四种状态转换地块（普通草地 `grass` -> 可翻土 `tilled` -> 已浇水 `watered` -> 播种 `seeded` -> 发芽/成熟等）。
- **作物与品种**: 实装萝卜(carrot)、番茄(tomato)、向日葵(sunflower)、蓝莓(blueberry) 四种色系的特种植物。
- **时序与气候**: 以真实世界的 `10ms = 游戏内 1秒` 的时间速率推进天色流转，并能在跨夜（`24:00` 转 `06:00`）时瞬间执行所有的作物生长与土地干涸校验。

### 4. 林奶奶的陪伴机制初版 (Grandma Lin)
- 重写并设计了高分辨率的红色砖木房子、奶奶独立肖像与动态木制摇椅。
- 奶奶的交互碰撞箱已建立，但等待接入真实的“逐字打印式”羁绊对话。

---

## 🐞 遗留问题与当前难点 (Known Issues / Bugs)

### ⚠️ 工具动作帧仍需人工精修
**当前状态**: 耕地、浇水、播种已重绘为 8 帧横向 sheet，动作连贯性比 4 帧版本明显提升，并已接入 `viewer.html` 与 `style-lab.html`。
**剩余风险**: AI 生成的逐帧角色仍可能出现轻微脸型、手部、工具位置和粒子边界变化。当前版本适合用于画风与手感验证，进入正式游戏前仍建议用 Aseprite 或 TexturePacker 做一次人工锚点、轮廓和帧间一致性精修。
**建议方向**: 后续可以在现有 8 帧基础上继续补齐四方向动作，或保留当前主方向动作并用翻转、粒子和轻微位移反馈覆盖早期玩法验证。

---

## 🚀 下一步开发计划 (Next Steps & Roadmap)

### P1 优先级 (Immediate Focus)
1. **精修主角工具帧动画流 (Polish Player Action Frames)**:
   - 在当前 8 帧工具 sheet 基础上做人工锚点、轮廓和四方向适配；Style Lab 已可先验证耕地、浇水、播种手感，正式迁回 `GameScene.js` 前需要再做一轮帧间一致性检查。
2. **林奶奶交互对话框 (Grandma's Typewriter Dialog)**:
   - 全面上线“基于 UI Group 体系拼接底框”，并用 `Phaser.Time.Event` 跑一个定时器，实现每个字符之间 50ms 间隔的逐字淡入显示输出功能。
3. **情绪系统羁绊交互 (Emotion Cropping & Gifting)**:
   - 若玩家走到林奶奶面前并按下 `SPACE` / `E` 时，检测背包：如果此时背包中正持有番茄等【情绪满载作物】，触发林奶奶特定的“惊喜/感谢”分支剧情对话，并隐藏后台增加隐性情感值。

### P2 优先级 (Long-term Mechanics)
1. **日记与天气情绪流**: 核心大饼（未动工）。加入玩家每日主动手写一句话日历的UI功能，依据日历用语好坏，演化第二天的天空滤镜（如下“治愈太阳雨”）。
2. **邮箱反馈闭环**: 增设木屋旁的邮箱机制，次日必会收到老奶奶的手写信或稀有小树苗。
3. **室内场景正式化 (Interior Production Pass)**: Style Lab 已有可进出的小屋内部试验场景；下一步是把独立家具、碰撞、门槛退出逻辑和温馨陈设迁回正式 `RoomScene`，并补上剧情、对话和可交互物件。
