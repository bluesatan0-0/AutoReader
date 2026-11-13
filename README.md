# AutoReader

[English](#english) | [中文](#中文)

---

## 中文

一个轻量、高效的浏览器油猴脚本（Tampermonkey / Violentmonkey），专为网页阅读场景设计。支持自动滚动、智能翻页、整章朗读、从选中处朗读与阅读辅助，适用于长页面浏览、连续阅读、护眼听读等多种场景，并支持浏览器直接打开的纯文本页（`.txt` / `.log` / `.md` / 代码文件等）朗读。

![version](https://img.shields.io/badge/version-3.3.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

### 🆕 最新更新

#### v3.3.0 · 面板与交互全面升级
- **新增卫星按钮**：鼠标悬停 ≡ 悬浮按钮时，上下分离出朗读 / 滚动卫星按钮。等大、中心距 46px，点击直接启停，鼠标离开自然消失。
- **新增面板弹性动画**：展开/收起采用单阶段 0.52s `cubic-bezier(0.34,1.56,0.64,1)` 弹性曲线。收起后半段面板淡出、悬浮按钮提前淡入交叉交接，消除突兀感。
- **悬浮按钮悬停变圆**：吸附态为贴边半圆，鼠标悬停时弹性变圆，拖拽期间保持圆型。
- **标签页联动**：点击滚动/朗读按钮时，自动切换到对应的标签页。
- **选中朗读与续读修复**：修复 `<br>` 分段页面（如贴吧、知乎回答）选中朗读永远从第一段开始的问题；纯文本页（`.txt`/代码文件）支持偏移定位。默认朗读语速改为 3。

#### v3.2.1 · 选中朗读修复（已包含在 v3.3.0 中）
- 修复 `<br>` 分段页面的选中定位问题；纯文本页支持偏移定位；默认朗读语速改为 3。

#### v3.0.4 · 本地文件、纯文本页面支持
- 浏览器直接打开的 `.txt` / `.log` / `.md` / `.csv` / 代码文件可正常朗读；支持 `file://` 本地文件。

#### v3.0.3 · 朗读体验修复
- 修复朗读失败误跳页、暂停续读回到起点、滚动平滑冲突。

👉 完整版本历史见文末 [更新日志](#-完整更新日志)

### ✨ 核心功能

#### 自动滚动
- 基于 `requestAnimationFrame`，帧率无关的匀速体验
- 1~100 级无级调节，实时生效
- 每个域名独立保存速度设置
- 自动滚动期间临时禁用站点自带的 `scroll-behavior: smooth`

#### 智能翻页
- 分层 DOM 扫描策略（语义区域优先）
- 自动识别"下一页 / 下一章"按钮
- 提前视口触发，减少底部广告观看
- 自动跳转默认关闭，防止误操作

#### 整章朗读
- 正文智能识别（支持多种容器结构）
- 逐段播报并滚动高亮跟随
- 音色选择、语速调节（0.5~5，**默认 3**）、试听功能
- **从选中处朗读**：页面有选中文本时，从选中段落开始
- **暂停续读**：暂停后再播放，有选中则从选中处重读，无选中则从中断位置继续
- 读完自动续读下一章
- **失败保护**：朗读失败时不会触发自动跳转

#### 纯文本页面支持
- 通过 `document.contentType` + URL 后缀双重判定
- 覆盖扩展名：`txt` `log` `md` `csv` `json` `yaml` `ini` 等文档/配置，以及 `py` `js` `java` `go` `rs` 等代码文件
- 按换行分段，超长行按句末标点切分
- 与正常网页的 DOM 启发式识别**完全隔离**

#### 面板交互
- 收起态显示 ≡ 悬浮按钮，展开态显示完整面板
- **鼠标悬停 ≡ 悬浮按钮**：上下分离出卫星按钮；按钮本身弹性变圆
- **点击卫星按钮**：直接执行对应功能，不展开面板；鼠标离开后自然隐藏
- **点击 ≡ 悬浮按钮**：弹性展开完整面板
- **鼠标离开面板**：0.6 秒后弹性收起；收起期间面板淡出，悬浮按钮同步弹性淡入
- 卫星按钮、面板展开、面板收起、悬浮按钮变圆共用统一弹性曲线，节奏一致

#### 安全与性能
- 危险协议过滤（javascript:、data: 等）
- 分层扫描 + 节流策略
- 长页面稳定流畅

### 🎯 适用场景

| 场景 | 典型平台 / 内容 | 推荐功能 |
| --- | --- | --- |
| **网络小说 / 连载文学** | 起点、番茄、笔趣阁、晋江、纵横等 | 自动滚动 + 读完整章自动续读 |
| **漫画 / 条漫** | 哔哩哔哩漫画、快看、腾讯动漫等长图页面 | 长图连续滚动，避免手动翻页 |
| **学术论文 / 技术文档** | arXiv、PubMed Central、IEEE Xplore、ar5iv、MDN、官方 API 文档 | 长文匀速滚动；选中摘要或章节即可朗读 |
| **纯文本文件** | 浏览器直接打开的 `.txt` / `.log` / `.md` / `.csv` / 代码文件 | 按行分段朗读；`file://` 本地文件也支持 |
| **新闻资讯 / 博客文章** | 各大新闻网站、个人博客、Medium、Substack | 一键匀速阅读，解放双手 |
| **在线课程 / 教程** | 慕课、教程站点、Codecademy 类互动教程 | 边听边记笔记，或边滚动边对照代码 |
| **论坛帖子 / 社区长文** | 结构清晰的论坛（如 Discourse）；知乎 / 贴吧 / Reddit 等楼层复杂社区**需自定义选择器** | 滚动可用；朗读可能读到用户名、楼层等元信息，详见「已知限制」 |
| **电子书 / 百科条目** | 维基百科、百科站点、在线电子书阅读器 | 长时间阅读不累眼 |
| **法律文书 / 合同 / 说明书** | 在线合同、产品说明书、标准文档 | 细节阅读时用朗读辅助校对 |
| **公众号 / 社交媒体长贴** | 微信公众号文章、微博长文、即刻长文 | 桌面端一键匀速、手机端可听读 |
| **外语学习材料** | 英文新闻、双语文章、语言学习站点 | 用 TTS 朗读辅助发音和听力练习 |
| **无障碍 / 护眼场景** | 长时间阅读、视力疲劳、夜间模式 | 朗读代替盯屏，减轻视觉负担 |

### 📦 安装

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)、Violentmonkey 或 Greasemonkey
2. [点击安装脚本](https://update.greasyfork.org/scripts/590642/AutoReader.user.js)
3. 进入任意网页，点击悬浮按钮开始使用

> **使用本地文件（`file://`）**：需在油猴管理器扩展详情页开启「允许访问文件 URL」，否则脚本不会在本地 `.txt` 等文件上运行。

### 🎮 快速上手

| 操作 | 说明 |
| --- | --- |
| 点击 ≡ 悬浮按钮 | 弹性展开完整控制面板 |
| 悬停 ≡ 悬浮按钮 | 上下分离出朗读 / 滚动卫星按钮；按钮本身弹性变圆 |
| 点击上方卫星按钮 ▶ / ⏸ | 直接播放 / 暂停朗读（不展开面板，鼠标离开后自动隐藏） |
| 点击下方卫星按钮 ▶ / ■ | 直接开始 / 停止滚动（不展开面板，鼠标离开后自动隐藏） |
| 点击面板中滚动按钮 | 切到「滚动」标签页并启停滚动 |
| 点击面板中朗读按钮 | 切到「朗读」标签页并启停朗读 |
| 点击底部文字「滚动」/「朗读」 | 单独切换标签页，不触发启停 |
| 先选中正文再点朗读 | 从选中段落开始朗读 |
| 按 `Space` | 当前标签页的模式启停（需先开启对应开关） |
| 拖拽悬浮按钮 | 吸附到左右边缘，自动记忆位置 |
| 鼠标离开面板 | 0.6 秒后弹性收起（面板淡出，悬浮按钮淡入交接） |

**停止朗读的触发方式**：朗读到章末自动结束 / 切换到滚动标签页 / 启动自动滚动。

### ⚙️ 配置选项

#### 滚动模式
- **滚动速度**：1~100 级
- **跳转延迟**：0~10 秒（默认 2 秒）
- **空格键启停**：默认关闭
- **自动跳转**：默认关闭（开启后在页面末尾自动翻页）

#### 朗读模式
- **朗读语速**：0.5~5，**默认 3**（调整不打断当前句，下一句生效）
- **音色选择**：本地/在线语音，切换即试听
- **空格键控制**：默认关闭
- **自动续读**：读完自动跳转下一章并继续
- **起始位置**：点击朗读时若页面有选中文本，从选中段落开始；否则从第一段开始
- **暂停续读规则**：
  - 恢复时**有选中文本** → 从选中处重新开始
  - 恢复时**无选中文本** → 从中断位置继续
- **失败保护**：只有真正朗读过的段落数达到预期段数的 80% 以上，才判定为"读完"并触发续读；否则停止且**不跳转**

#### 自定义规则
当自动检测失效时，可为特定网站配置：
- **域名模式**：如 `*qidian.com*`（支持通配符）
- **CSS 选择器**：精确指定下一页按钮
- **文本关键词**：二次校验按钮文字
- **转义支持**：`|` 字符使用 `\|` 转义

### 🧠 技术设计

#### 下一页检测
脚本采用智能分层扫描：
1. **第一层**：优先扫描语义化区域（`nav`、`article`、`footer` 等）
2. **第二层**：补充扫描全文档的交互元素（`<a>`、`<button>` 等）
3. **第三层**：兜底扫描容器元素，过滤无意义小尺寸节点

文本匹配与可见性校验分两阶段执行：先用 `textContent` 批量筛选候选（不触发布局），再对少量命中做 `getBoundingClientRect` 校验，避免大页面上的 layout thrash。解析后的自定义规则会缓存，仅当规则文本变化时重新解析。

检测过程 600ms 节流，按钮进入视口底部 30% 时自动停止。

#### 朗读识别
- 优先匹配常见正文容器（`#content`、`.readcontent`、`article` 等）
- 启发式打分：文本长度、标点密度、链接占比
- 按 `<p>` 分段；若无 `<p>` 则按 `<br>` / 换行分段
- 过滤噪声行（上一章、下一章、广告等）
- 逐段播报时自动滚动到视口中央并高亮

#### 纯文本页面分流
- **判定**：`document.contentType` 命中 `text/plain`、`text/markdown`、`application/json` 等 → 纯文本分支；`text/html` 等明确网页类型直接否决；MIME 缺失时用 URL 后缀兜底
- **提取**：优先取 `<pre>` 内容，无 `<pre>` 时取 `body.innerText`；按 `\n` 分段，单行 > 500 字时按句末标点二次切分
- **隔离**：纯文本分支不调用 `ttsFindContentRoot`，不参与 DOM 启发式打分

#### 选中定位
三段式判定，从精确到粗略：
1. **独立 elem 段落**（`<p>` 分段）：直接 DOM 包含判断
2. **共享 root 段落**（`<br>` 分段 / 纯文本）：遍历 root 内文本节点累计字符偏移，用偏移落入 `[startOffset, endOffset)` 区间匹配
3. **文本片段兜底**：选中文本前 20 字匹配，失败再用前 8 字

使用 `startContainer` 而非 `anchorNode`，从下往上拖选时也能定位到文档顺序靠前的段落。

#### 卫星按钮
- **触发**：`miniBtn` 的 `mouseenter` 触发 `showSatellites()`，`mouseleave` 启动 400ms 延迟隐藏；卫星按钮自身的 `mouseenter` 会取消延迟
- **尺寸**：与 ≡ 悬浮按钮等大（40×40，`font-size` 17px）
- **位置**：上方朗读、下方滚动，中心距 46px，间距 6px
- **动效**：初始 `opacity: 0` + `scale(0.2)` + `translate(0, ±46px)` 藏在 ≡ 内部 + `blur(4px)`；显示时用 `cubic-bezier(0.34, 1.56, 0.64, 1)` 弹性过渡
- **点击**：直接执行功能，不展开面板；点击后不主动隐藏，由鼠标离开触发 400ms 延迟隐藏

#### 面板展开/收起动画
- **统一曲线与时长**：`cubic-bezier(0.34, 1.56, 0.64, 1)` + `520ms`
- **展开**：从 `miniBtn.getBoundingClientRect()` 实际屏幕位置出发，一次性过渡到面板最终尺寸
- **收起**：从面板当前 `getBoundingClientRect()` 出发，弹性缩回 miniBtn 位置；面板在后半段淡出，miniBtn 提前淡入并弹性放大，两者交叉过渡，消除突兀感
- **视觉效果**：曲线 overshoot 产生"从小变大再回弹"的弹簧观感

#### 悬浮按钮悬停变圆
- 吸附态为贴边半圆（`border-radius: 0 50% 50% 0` 或 `50% 0 0 50%`）
- 鼠标悬停时通过 `cubic-bezier(0.34, 1.56, 0.64, 1)` + `320ms` 弹性过渡到完整圆（`50%`），鼠标离开恢复半圆

#### 标签联动
- 点击面板中滚动按钮：若当前不在「滚动」标签，先 `switchTab('scroll')`，再执行启停
- 点击面板中朗读按钮：若当前不在「朗读」标签，先 `switchTab('tts')`，再执行启停
- 点击底部文字标签：仅切换标签，不触发启停

#### 失败保护
- 累计真正进入 `onstart` 的段落数 `spokenCount`
- 预期段数 = 总段数 − 起始索引
- `spokenCount ≥ 预期段数 × 80%` 才判定"读完"，否则停止且**不跳转**

#### 滚动稳定性
- 帧间 delta 封顶 100ms，切回后台标签页不会一次冲出大段
- 自动跳转使用代际 token，任何 `stopScroll` / 重新启动都会使挂起的跳转定时器失效

### ⚠️ 已知限制

通用脚本无法针对每个站点做定向适配，以下场景可能达不到理想效果：

- **楼层 / 用户信息混杂的社区页**（贴吧、知乎回答、Reddit、V2EX、传统论坛等）：正文识别可能把用户名、发帖时间、"回复/赞/踩"、签名档等元信息也读进去。如遇此情况，可在「自定义下一页选择器」中通过 CSS 选择器指定正文容器（如贴吧 `.d_post_content`、知乎 `.RichText`、V2EX `.topic_content`）。
- **`<br>` 分段页面的选中朗读**：v3.3.0 已修复"永远从第一段开始"的问题，但若同一段文本在同一页面出现多次，仍可能定位到第一次出现的位置。
- **动态加载 / Shadow DOM 页面**：部分现代 SPA 用 Shadow DOM 渲染内容，`document.querySelector` 无法穿透，可能识别失败。
- **公式与图表**：TTS 引擎对数学公式、图表内的文字支持有限，朗读时可能跳过或读得不通顺。

### 📄 许可证

MIT License

### 📝 完整更新日志

| 版本 | 更新内容 |
| --- | --- |
| **v3.3.0** | 累积发布：选中朗读定位修复（`<br>` 分段 / 纯文本偏移定位）、默认语速 3、标签页与按钮联动、卫星按钮悬停分离、面板弹性动画、淡出交接、悬浮按钮悬停变圆 |
| ~~v3.2.6~~ | （未发布，合并入 v3.3.0）面板收起淡出交接 + 悬浮按钮悬停变圆 |
| ~~v3.2.5~~ | （未发布，合并入 v3.3.0）卫星按钮鼠标离开消失；面板动画向卫星看齐 |
| ~~v3.2.4~~ | （未发布，合并入 v3.3.0）卫星按钮尺寸对齐、距离收紧、点击直接启停 |
| ~~v3.2.3~~ | （未发布，合并入 v3.3.0）卫星按钮悬停分离 |
| ~~v3.2.2~~ | （未发布，合并入 v3.3.0）标签页与按钮联动 |
| **v3.2.1** | 修复 `<br>` 分段页面选中朗读永远从第一段开始的问题；纯文本页支持偏移定位；默认朗读语速改为 3 |
| ~~v3.2~~ | （未发布，内容与 v3.0.4 一致，仅版本号纠正） |
| ~~v3.1~~ | （未发布，内容与 v3.0.3 一致，仅版本号纠正） |
| **v3.0.4** | 新增纯文本页面支持（MIME + URL 后缀分流）；支持 `file://` 本地文件；超长行按句末标点二次切分 |
| **v3.0.3** | 新增从选中处朗读、暂停续读、朗读失败保护、滚动平滑冲突修复、探测性能优化 |
| **v3.0.2** | 优化代码 |
| **v3.0.1** | 修复：排版有概率错乱；正文识别加固，短正文识别阈值放宽；有概率吞首句 |
| **v3.0** | 新增整章朗读/小说朗读、正文智能识别、逐段高亮、音色/语速调节、读完续读 |
| **v2.2** | 自动跳转改为默认关闭、新增独立开关 |
| **v2.1** | 悬浮面板优化、空格键改为面板开关、避免与输入框冲突 |
| **v2.0** | 提前视口触发、半透明 UI、性能优化、安全加固 |
| **v1.9** | 分层扫描、规则转义、协议过滤 |
| **v1.0** | 初始版本：基础滚动、速度调节、吸附按钮 |

---

## English

A lightweight and efficient userscript (Tampermonkey / Violentmonkey) designed for web reading scenarios. Supports auto-scroll, smart page navigation, full-chapter reading, read-from-selection, and reading assistance — suitable for long-page browsing, continuous reading, eye-friendly listen-reading, and more. Also supports plain-text pages opened directly in the browser (`.txt` / `.log` / `.md` / code files).

![version](https://img.shields.io/badge/version-3.3.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

### 🆕 Latest Updates

#### v3.3.0 · Comprehensive Panel & Interaction Upgrade
- **Satellite buttons added**: Hovering the ≡ floating button separates out reading / scrolling satellites above and below. Same size, 46px center distance, click executes directly, hides naturally on mouse leave.
- **Elastic panel animations**: Expand/collapse use a single-stage 0.52s `cubic-bezier(0.34,1.56,0.64,1)` elastic curve. During collapse, the panel fades out while the floating button fades in and scales up, creating a seamless crossfade.
- **Floating button rounds on hover**: Docked state is a half-circle against the edge; hovering elastically transforms it into a full circle; stays circular while dragging.
- **Tab linkage**: Clicking scroll / reading buttons automatically switches to the corresponding tab.
- **Selection reading & resume fix**: Fixed selection reading always starting from the first paragraph on `<br>`-separated pages (Tieba, Zhihu answers, etc.); offset-based positioning for plain-text pages. Default reading rate changed to 3.

#### v3.2.1 · Selection Reading Fix (included in v3.3.0)
- Fixed `<br>`-separated pages; offset-based positioning for plain-text; default rate 3.

#### v3.0.4 · Plain-Text Page Support
- Plain-text pages (`.txt` / `.log` / `.md` / `.csv` / code files) can be read aloud normally; supports `file://` local files.

#### v3.0.3 · Reading Experience Fixes
- Fixed false auto-navigation on reading failure, pause-resume restarting from the top, and smooth-scroll conflicts.

👉 Full version history is in the [Changelog](#-full-changelog) at the end.

### ✨ Key Features

#### Auto Scroll
- Based on `requestAnimationFrame` for frame-rate-independent smooth experience
- 1-100 level speed adjustment with real-time effect
- Per-domain speed settings automatically saved
- Temporarily disables the site's `scroll-behavior: smooth` during auto-scroll

#### Smart Page Navigation
- Multi-layer DOM scanning strategy (semantic areas prioritized)
- Auto-detect "Next Page / Next Chapter" buttons
- Early viewport trigger to avoid unnecessary bottom content
- Auto-navigation disabled by default to prevent accidents

#### Full-Chapter Reading
- Intelligent main content recognition (supports various container structures)
- Segment-by-segment reading with synchronized scrolling and highlighting
- Voice selection, speed adjustment (0.5-5, **default 3**), and preview functionality
- **Read from selection**: if text is selected, reading starts from that paragraph
- **Pause & resume**: on resume, restarts from the selection if one exists; otherwise continues from where it stopped
- Auto-continue to next chapter after reading ends
- **Failure guard**: reading failures will not trigger auto-navigation

#### Plain-Text Page Support
- Precise detection via `document.contentType` + URL extension
- Coverage: documents/config (`.txt` / `.log` / `.md` / `.csv` / `.json` / `.yaml` / `.ini`), code (`.py` / `.js` / `.java` / `.go` / `.rs`), etc.
- Split by newlines; over-long lines split at sentence-ending punctuation
- **Fully isolated** from the DOM heuristics for normal web pages

#### Panel Interaction
- Collapsed state shows a ≡ floating button; expanded state shows the full panel
- **Hovering the ≡ button**: separates out satellites above and below; the button itself elastically rounds
- **Clicking a satellite**: executes the function directly, no panel expansion; hides naturally on mouse leave
- **Clicking ≡**: elastically expands the full panel
- **Mouse leaving the panel**: elastically collapses after 0.6 seconds; panel fades out while floating button fades in
- Satellites, panel expand/collapse, and button rounding share the same elastic curve

#### Safety & Performance
- Dangerous protocol filtering (javascript:, data:, etc.)
- Layered scanning + throttling strategy
- Smooth performance on long pages

### 🎯 Use Cases

| Scenario | Typical Sites / Content | Recommended Feature |
| --- | --- | --- |
| **Web novels / serialized fiction** | Qidian, Fanqie, Biquge, Jinjiang, Zongheng, etc. | Auto-scroll + auto-continue after finishing a chapter |
| **Manga / webtoons** | Bilibili Comics, Kuaikan, Tencent Comics, long-image pages | Continuous scroll for long strips, no manual page-turning |
| **Academic papers / technical docs** | arXiv, PubMed Central, IEEE Xplore, ar5iv, MDN, official API docs | Smooth scroll on long pages; select abstract or a section to read aloud |
| **Plain-text files** | `.txt` / `.log` / `.md` / `.csv` / code files opened in browser | Line-by-line reading; `file://` local files also supported |
| **News / blog articles** | Major news sites, personal blogs, Medium, Substack | One-tap smooth reading, hands-free |
| **Online courses / tutorials** | MOOC platforms, tutorial sites, Codecademy-style interactive tutorials | Listen while taking notes, or scroll alongside code |
| **Forum posts / community long reads** | Cleanly structured forums (e.g. Discourse); complex thread-based communities like Zhihu / Tieba / Reddit **require custom selectors** | Scrolling works; reading may include usernames and floor metadata — see "Known Limitations" |
| **E-books / encyclopedia entries** | Wikipedia, wiki sites, online e-book readers | Long reading sessions without eye strain |
| **Legal documents / contracts / manuals** | Online contracts, product manuals, standards documents | Reading aloud helps with proofreading |
| **WeChat articles / social media long posts** | WeChat public accounts, Weibo long posts, Jike long posts | One-tap smooth scroll on desktop, listen-reading on mobile |
| **Foreign-language learning materials** | English news, bilingual articles, language-learning sites | TTS reading for pronunciation and listening practice |
| **Accessibility / eye-care** | Prolonged reading, visual fatigue, night mode | Reading aloud replaces staring at the screen |

### 📦 Installation

1. Install browser extension: [Tampermonkey](https://www.tampermonkey.net/), Violentmonkey, or Greasemonkey
2. [Click to install script](https://update.greasyfork.org/scripts/590642/AutoReader.user.js)
3. Visit any webpage and click the floating button to start

> **Using local files (`file://`)**: you need to enable "Allow access to file URLs" in your userscript manager's extension details page, otherwise the script won't run on local `.txt` files.

### 🎮 Quick Start

| Action | Description |
| --- | --- |
| Click ≡ floating button | Elastically expand full control panel |
| Hover ≡ floating button | Separate out satellites above and below; button elastically rounds |
| Click top satellite ▶ / ⏸ | Directly play / pause reading (no panel, hides on mouse leave) |
| Click bottom satellite ▶ / ■ | Directly start / stop scrolling (no panel, hides on mouse leave) |
| Click panel scroll button | Switch to "Scroll" tab and start / stop scrolling |
| Click panel reading button | Switch to "Reading" tab and play / pause reading |
| Click bottom text "滚动" / "朗读" | Switch tabs only, without triggering start/stop |
| Select text, then click reading | Start reading from the selected paragraph |
| Press `Space` | Start / stop current tab's mode (toggle required first) |
| Drag floating button | Attach to screen edge, position auto-saved |
| Mouse leave panel | Elastically collapse after 0.6 seconds (crossfade with button) |

**How reading stops**: automatically at the end of the chapter / switching to the Scroll tab / starting auto-scroll.

### ⚙️ Configuration Options

#### Scroll Mode
- **Scroll Speed**: 1-100 levels
- **Jump Delay**: 0-10 seconds (default 2s)
- **Space Key Control**: Disabled by default
- **Auto-Navigation**: Disabled by default (enables auto-flip at page end)

#### Reading Mode
- **Reading Speed**: 0.5-5, **default 3** (doesn't interrupt the current sentence; applies from the next one)
- **Voice Selection**: Local/online voices with preview on switch
- **Space Key Control**: Disabled by default
- **Auto-Continue**: Auto-jump to next chapter and continue reading
- **Start Position**: if text is selected when starting, reading begins at that paragraph; otherwise from the top
- **Pause & Resume Rules**:
  - Resume **with** a selection → restart from the selection
  - Resume **without** a selection → continue from where it stopped
- **Failure Guard**: reading is considered "finished" only when the number of paragraphs actually spoken reaches 80% of the expected count; otherwise it stops **without** navigating

#### Custom Rules
When auto-detection doesn't work, configure rules for specific websites:
- **Domain Pattern**: e.g., `*qidian.com*` (wildcard supported)
- **CSS Selector**: Precisely specify next-page button
- **Text Keyword**: Secondary verification of button text
- **Escape Support**: Use `\|` to escape `|` character

### 🧠 Technical Design

#### Next Page Detection
The script uses intelligent multi-layer scanning:
1. **Layer 1**: Prioritizes semantic areas (`nav`, `article`, `footer`, etc.)
2. **Layer 2**: Supplements with interactive elements in full document (`<a>`, `<button>`, etc.)
3. **Layer 3**: Fallback scans container elements, filters meaningless small nodes

Text matching and visibility checks run in two phases: candidates are first filtered by `textContent` (no layout cost), then only the few hits are validated with `getBoundingClientRect`, avoiding layout thrash on large pages. Parsed custom rules are cached and only re-parsed when the rule text changes.

Detection is throttled at 600ms intervals; stops when button enters bottom 30% of viewport.

#### Reading Recognition
- Prioritizes common main-content containers (`#content`, `.readcontent`, `article`, etc.)
- Heuristic scoring: text length, punctuation density, link ratio
- Segments by `<p>`; falls back to `<br>` / newline splitting when `<p>` is scarce
- Filters noise (previous/next chapter, ads, etc.)
- Auto-scrolls to center of viewport and highlights during segment playback

#### Plain-Text Page Routing
- **Detection**: `document.contentType` matching `text/plain`, `text/markdown`, `application/json`, etc. → plain-text branch; `text/html` and other explicit web types are rejected; URL extension used as fallback when MIME is missing
- **Extraction**: prefer `<pre>` content, fall back to `body.innerText`; split by `\n`; lines over 500 characters are re-split at sentence-ending punctuation
- **Isolation**: the plain-text branch never calls `ttsFindContentRoot` and doesn't participate in DOM heuristic scoring

#### Selection Anchoring
Three-tier lookup, from precise to coarse:
1. **Per-element paragraphs** (`<p>`-based): direct DOM containment check
2. **Shared-root paragraphs** (`<br>`-based / plain text): accumulates character offset by walking text nodes in the root, then matches against `[startOffset, endOffset)`
3. **Text snippet fallback**: first 20 characters of the selection, then first 8

Uses `startContainer` rather than `anchorNode`, so dragging the selection upward still anchors to the earlier paragraph in document order.

#### Satellite Buttons
- **Trigger**: `miniBtn`'s `mouseenter` fires `showSatellites()`; `mouseleave` schedules a 400ms hide. Satellite `mouseenter` cancels the timer
- **Size**: identical to the ≡ button (40×40, `font-size` 17px)
- **Position**: reading above, scrolling below; center distance 46px, gap 6px
- **Animation**: initial `opacity: 0` + `scale(0.2)` + `translate(0, ±46px)` hidden inside ≡ + `blur(4px)`; on show, `cubic-bezier(0.34, 1.56, 0.64, 1)` creates an elastic overshoot
- **Click**: executes the corresponding function directly; satellites stay visible after a click and hide naturally 400ms after `mouseleave`

#### Panel Expand/Collapse Animation
- **Unified curve and duration**: `cubic-bezier(0.34, 1.56, 0.64, 1)` + `520ms`
- **Expand**: starts from `miniBtn.getBoundingClientRect()` (actual screen position), transitions once to the panel's final size
- **Collapse**: starts from the panel's current `getBoundingClientRect()`, elastically shrinks back to the miniBtn position; the panel fades out in the second half while the miniBtn fades in and scales up, creating a seamless crossfade
- **Visual effect**: the curve overshoots to ~1.56× the target in mid-animation, creating the "grow larger then settle back" spring feel

#### Floating Button Hover Rounding
- Docked state is a half-circle against the edge (`border-radius: 0 50% 50% 0` or `50% 0 0 50%`)
- Hovering applies `cubic-bezier(0.34, 1.56, 0.64, 1)` + `320ms` to transition to a full circle (`50%`); leaving restores the half-circle

#### Tab–Button Linkage
- Clicking panel's scroll button: if not on "Scroll" tab, `switchTab('scroll')` first, then start/stop
- Clicking panel's reading button: if not on "Reading" tab, `switchTab('tts')` first, then start/stop
- Clicking bottom text label: switches tabs only, no start/stop

#### Failure Guard
- Tracks `spokenCount`, the number of paragraphs that actually fired `onstart`
- Expected count = total paragraphs − start index
- "Finished" requires `spokenCount ≥ expected × 80%`; otherwise it is treated as a failure: stop, **no navigation**

#### Scroll Stability
- Inter-frame delta is capped at 100ms, so returning from a background tab doesn't cause a jump
- Auto-navigation uses a generation token; any `stopScroll` / restart invalidates pending navigation timers

### ⚠️ Known Limitations

A generic userscript cannot be tailored to every site. The following scenarios may not work ideally:

- **Thread-based community pages** (Tieba, Zhihu answers, Reddit, V2EX, traditional forums): content recognition may also read usernames, timestamps, "reply/upvote/downvote" controls, signatures, etc. If this happens, specify the content container via a CSS selector in "Custom next-page selector" (e.g. Tieba `.d_post_content`, Zhihu `.RichText`, V2EX `.topic_content`).
- **Selection-reading on `<br>`-separated pages**: v3.3.0 fixes the "always starts from the first paragraph" problem, but if the same text appears more than once on the page, it may still anchor to the first occurrence.
- **Dynamically loaded / Shadow DOM pages**: some modern SPAs render content inside Shadow DOM, which `document.querySelector` cannot traverse; recognition may fail.
- **Formulas and figures**: TTS engines have limited support for math formulas and text inside figures; reading may skip them or sound unnatural.

### 📄 License

MIT License

### 📝 Full Changelog

| Version | Updates |
| --- | --- |
| **v3.3.0** | Cumulative release: selection reading fix (`<br>`-separated / plain-text offset), default rate 3, tab-button linkage, satellite buttons, elastic panel animations, crossfade, button hover rounding |
| ~~v3.2.6~~ | (Unreleased, merged into v3.3.0) Panel crossfade + button hover rounding |
| ~~v3.2.5~~ | (Unreleased, merged into v3.3.0) Satellites hide on mouse leave; panel animations matched to satellites |
| ~~v3.2.4~~ | (Unreleased, merged into v3.3.0) Satellites matched in size, distance tightened, direct execution |
| ~~v3.2.3~~ | (Unreleased, merged into v3.3.0) Satellite buttons on hover |
| ~~v3.2.2~~ | (Unreleased, merged into v3.3.0) Tab-button linkage |
| **v3.2.1** | Fixed selection-reading always starting from the first paragraph on `<br>`-separated pages; offset-based positioning for plain-text pages; default reading rate changed to 3 |
| ~~v3.2~~ | (Unreleased, identical to v3.0.4, version number correction only) |
| ~~v3.1~~ | (Unreleased, identical to v3.0.3, version number correction only) |
| **v3.0.4** | Added plain-text page support (routed by MIME + URL extension); supports `file://` local files; over-long lines split at sentence-ending punctuation |
| **v3.0.3** | Added read-from-selection, pause & resume, reading failure guard, smooth-scroll conflict fix, detection performance optimizations |
| **v3.0.2** | Code optimizations |
| **v3.0.1** | Fixed: occasional layout glitches; hardened content detection with relaxed threshold for short articles; occasional first-sentence swallowing |
| **v3.0** | Added full-chapter reading, intelligent content recognition, segment highlighting, voice/speed adjustment, auto-continue |
| **v2.2** | Auto-navigation now disabled by default, new independent toggle |
| **v2.1** | Floating panel optimization, space key changed to panel toggle, avoid input field conflicts |
| **v2.0** | Early viewport trigger, semi-transparent UI, performance optimization, security hardening |
| **v1.9** | Multi-layer scanning, rule escaping, protocol filtering |
| **v1.0** | Initial release: basic scrolling, speed control, floating button attachment |
