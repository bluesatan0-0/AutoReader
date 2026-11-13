# AutoReader

[English](#english) | [中文](#中文)

---

## 中文

一个轻量、高效的浏览器油猴脚本（Tampermonkey / Violentmonkey），专为网页阅读场景设计。支持自动滚动、智能翻页、整章朗读、从选中处朗读与阅读辅助，适用于长页面浏览、连续阅读、护眼听读等多种场景，并支持浏览器直接打开的纯文本页（`.txt` / `.log` / `.md` / 代码文件等）朗读。

![version](https://img.shields.io/badge/version-3.0.4-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

### 🆕 最新更新

#### v3.0.4 · 支持本地文件、纯文本页面
- 浏览器直接打开的 `.txt` / `.log` / `.md` / `.csv` / 代码文件（`.py` / `.js` / `.json` 等）现在可以**正常朗读**
- 按 MIME 类型 + URL 后缀双重判定，**不干扰**正常网页的正文识别
- 支持 `file://` 本地文件（需在油猴管理器里开启"允许访问文件 URL"）
- 超长无换行段落自动按句末标点二次切分，避免朗读卡顿

#### v3.0.3 · 朗读体验增强
- **从选中处朗读**：页面有选中文本时，从选中段落开始，而非从头部开始
- **暂停续读**：恢复时有选中文本则从选中处重读，无选中则从中断位置继续
- **朗读失败保护**：引擎报错或识别失败时**不再触发自动跳转**，避免"连续翻页"死循环
- **滚动平滑冲突修复**：自动滚动期间临时禁用站点的 `scroll-behavior: smooth`，避免逐帧滚动被动画化
- **探测性能优化**：文本匹配与可见性校验分两阶段执行，大页面不再卡顿

👉 完整版本历史见文末 [更新日志](#-完整更新日志)

### 🎯 适用场景

| 场景 | 典型平台 / 内容 | 推荐功能 |
| --- | --- | --- |
| **网络小说 / 连载文学** | 起点、番茄、笔趣阁、晋江、纵横等 | 自动滚动 + 读完整章自动续读 |
| **漫画 / 条漫** | 哔哩哔哩漫画、快看、腾讯动漫等长图页面 | 长图连续滚动，避免手动翻页 |
| **学术论文 / 技术文档** | arXiv、PubMed Central、IEEE Xplore、ar5iv、MDN、官方 API 文档 | 长文匀速滚动；选中摘要或章节即可朗读 |
| **纯文本文件** | 浏览器直接打开的 `.txt` / `.log` / `.md` / `.csv` / 代码文件 | 按行分段朗读；`file://` 本地文件也支持 |
| **新闻资讯 / 博客文章** | 各大新闻网站、个人博客、Medium、Substack | 一键匀速阅读，解放双手 |
| **在线课程 / 教程** | 慕课、教程站点、Codecademy 类互动教程 | 边听边记笔记，或边滚动边对照代码 |
| **论坛帖子 / 社区长文** | 知乎、Reddit、V2EX、贴吧、Discourse 论坛 | 长帖浏览，一键滚到底部 |
| **电子书 / 百科条目** | 维基百科、百科站点、在线电子书阅读器 | 长时间阅读不累眼 |
| **法律文书 / 合同 / 说明书** | 在线合同、产品说明书、标准文档 | 细节阅读时用朗读辅助校对 |
| **公众号 / 社交媒体长贴** | 微信公众号文章、微博长文、即刻长文 | 桌面端一键匀速、手机端可听读 |
| **外语学习材料** | 英文新闻、双语文章、语言学习站点 | 用 TTS 朗读辅助发音和听力练习 |
| **无障碍 / 护眼场景** | 长时间阅读、视力疲劳、夜间模式 | 朗读代替盯屏，减轻视觉负担 |

### ✨ 核心功能

#### 自动滚动
- 基于 `requestAnimationFrame`，帧率无关的匀速体验
- 1~100 级无级调节，实时生效
- 每个域名独立保存速度设置
- 自动滚动期间临时禁用站点自带的 `scroll-behavior: smooth`，避免逐帧滚动被动画化

#### 智能翻页
- 分层 DOM 扫描策略（语义区域优先）
- 自动识别"下一页 / 下一章"按钮
- 提前视口触发，减少底部广告观看
- 自动跳转默认关闭，防止误操作

#### 整章朗读
- 正文智能识别（支持多种容器结构）
- 逐段播报并滚动高亮跟随
- 音色选择、语速调节（0.5~5）、试听功能
- **从选中处朗读**：页面有选中文本时，从选中段落开始
- **暂停续读**：暂停后再播放，有选中则从选中处重读，无选中则从中断位置继续
- 读完自动续读下一章
- **失败保护**：朗读失败时不会触发自动跳转

#### 纯文本页面支持（v3.0.4 新增）
- 通过 `document.contentType` + URL 后缀双重判定，精确识别纯文本页
- 覆盖扩展名：`txt` `log` `md` `csv` `json` `yaml` `ini` 等文档/配置，以及 `py` `js` `java` `go` `rs` 等代码文件
- 按换行分段，超长行按句末标点切分
- 与正常网页的 DOM 启发式识别**完全隔离**，互不干扰

#### 全局适配
- 适用绝大多数网站
- 半透明不遮挡正文内容
- 悬浮按钮吸附屏幕边缘
- 双标签页模式（滚动 / 朗读分离）

#### 安全与性能
- 危险协议过滤（javascript:、data: 等）
- 分层扫描 + 节流策略
- 长页面稳定流畅

### 📦 安装

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)、Violentmonkey 或 Greasemonkey
2. [点击安装脚本](https://update.greasyfork.org/scripts/590642/AutoReader.user.js)
3. 进入任意网页，点击悬浮按钮开始使用

> **使用本地文件（`file://`）**：需要在油猴管理器扩展详情页开启「允许访问文件 URL」，否则脚本不会在本地 `.txt` 等文件上运行。

### 🎮 快速上手

| 操作 | 说明 |
| --- | --- |
| 点击 ≡ 悬浮按钮 | 展开控制面板 |
| 点击 ▶ / ■（滚动页） | 开始 / 停止滚动 |
| 点击 ▶ / ⏸（朗读页） | 播放 / 暂停 / 恢复朗读 |
| 先选中正文再点 ▶（朗读页） | 从选中段落开始朗读 |
| 点击标签文字切换 | 在滚动和朗读之间切换 |
| 按 `Space` | 当前模式启停（需先开启开关） |
| 拖拽悬浮按钮 | 吸附到左右边缘，自动记忆位置 |
| 鼠标离开面板 | 0.6 秒后自动缩回 |

**停止朗读的触发方式**：朗读到章末自动结束 / 切换到滚动标签页 / 启动自动滚动。

### ⚙️ 配置选项

#### 滚动模式
- **滚动速度**：1~100 级
- **跳转延迟**：0~10 秒（默认 2 秒）
- **空格键启停**：默认关闭
- **自动跳转**：默认关闭（开启后在页面末尾自动翻页）

#### 朗读模式
- **朗读语速**：0.5~5（调整不打断当前句，下一句生效）
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
- 按 `<p>` 分段，过滤噪声行（上一章、下一章、广告等）
- 逐段播报时自动滚动到视口中央并高亮

#### 纯文本页面分流（v3.0.4）
- **判定**：`document.contentType` 命中 `text/plain`、`text/markdown`、`application/json` 等 → 走纯文本分支；`text/html` 等明确网页类型直接否决；MIME 缺失时用 URL 后缀兜底
- **提取**：优先取 `<pre>` 内容，无 `<pre>` 时取 `body.innerText`；按 `\n` 分段，单行 > 500 字时按句末标点（`。！？!?.;；`）二次切分到 100~300 字
- **隔离**：纯文本分支不调用 `ttsFindContentRoot`，不参与 DOM 启发式打分，不与网页逻辑共享任何状态

#### 选中定位
- 取 `selection.getRangeAt(0).startContainer`，向上回溯到最近的段落元素，与已识别段落比对确定索引
- 兜底策略：用选中文本前 20 字在段落文本中匹配（纯文本页也走此兜底）
- 使用 `startContainer` 而非 `anchorNode`，从下往上拖选时也能定位到文档顺序靠前的段落

#### 失败保护
- 累计真正进入 `onstart` 的段落数 `spokenCount`
- 预期段数 = 总段数 − 起始索引（从中间开始读时不会因分母过大而误判）
- `spokenCount ≥ 预期段数 × 80%` 才判定"读完"，否则视为朗读失败：停止、**不跳转**、提示"朗读失败 已停止跳转"

#### 滚动稳定性
- 帧间 delta 封顶 100ms，切回后台标签页不会一次冲出大段
- 自动跳转使用代际 token，任何 `stopScroll` / 重新启动都会使挂起的跳转定时器失效

### 📄 许可证

MIT License

### 📝 完整更新日志

| 版本 | 更新内容 |
| --- | --- |
| **v3.0.4** | 新增纯文本页面支持（按 MIME + URL 后缀分流，覆盖 `.txt` / `.md` / `.json` / 代码文件等）；支持 `file://` 本地文件；超长行按句末标点二次切分 |
| **v3.0.3** | 新增从选中处朗读、暂停续读（有选中重读 / 无选中续读）、朗读失败保护（失败不跳转）、滚动平滑冲突修复、探测性能优化 |
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

![version](https://img.shields.io/badge/version-3.0.4-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

### 🆕 Latest Updates

#### v3.0.4 · Plain-Text Page Support
- Plain-text pages (`.txt` / `.log` / `.md` / `.csv` / code files like `.py` / `.js` / `.json`) can now be **read aloud normally**
- Dual detection via MIME type + URL extension, **without interfering** with normal webpage content detection
- Supports `file://` local files (requires enabling "Allow access to file URLs" in your userscript manager)
- Long lines without newlines are auto-split at sentence-ending punctuation to avoid reading stutter

#### v3.0.3 · Reading Experience Enhancements
- **Read from selection**: if text is selected, reading starts from that paragraph instead of the top
- **Pause & resume**: on resume, restarts from the selection if one exists; otherwise continues from where it stopped
- **Reading failure guard**: engine errors or recognition failures **no longer trigger auto-navigation**, preventing infinite page-flipping
- **Smooth-scroll conflict fix**: temporarily disables the site's `scroll-behavior: smooth` during auto-scroll
- **Detection performance optimization**: text matching and visibility checks are split into two phases; no more jank on large pages

👉 Full version history is in the [Changelog](#-full-changelog) at the end.

### 🎯 Use Cases

| Scenario | Typical Sites / Content | Recommended Feature |
| --- | --- | --- |
| **Web novels / serialized fiction** | Qidian, Fanqie, Biquge, Jinjiang, Zongheng, etc. | Auto-scroll + auto-continue after finishing a chapter |
| **Manga / webtoons** | Bilibili Comics, Kuaikan, Tencent Comics, long-image pages | Continuous scroll for long strips, no manual page-turning |
| **Academic papers / technical docs** | arXiv, PubMed Central, IEEE Xplore, ar5iv, MDN, official API docs | Smooth scroll on long pages; select abstract or a section to read aloud |
| **Plain-text files** | `.txt` / `.log` / `.md` / `.csv` / code files opened in browser | Line-by-line reading; `file://` local files also supported |
| **News / blog articles** | Major news sites, personal blogs, Medium, Substack | One-tap smooth reading, hands-free |
| **Online courses / tutorials** | MOOC platforms, tutorial sites, Codecademy-style interactive tutorials | Listen while taking notes, or scroll alongside code |
| **Forum posts / community long reads** | Zhihu, Reddit, V2EX, Tieba, Discourse forums | Browse long threads and scroll to the bottom in one tap |
| **E-books / encyclopedia entries** | Wikipedia, wiki sites, online e-book readers | Long reading sessions without eye strain |
| **Legal documents / contracts / manuals** | Online contracts, product manuals, standards documents | Reading aloud helps with proofreading |
| **WeChat articles / social media long posts** | WeChat public accounts, Weibo long posts, Jike long posts | One-tap smooth scroll on desktop, listen-reading on mobile |
| **Foreign-language learning materials** | English news, bilingual articles, language-learning sites | TTS reading for pronunciation and listening practice |
| **Accessibility / eye-care** | Prolonged reading, visual fatigue, night mode | Reading aloud replaces staring at the screen |

### ✨ Key Features

#### Auto Scroll
- Based on `requestAnimationFrame` for frame-rate-independent smooth experience
- 1-100 level speed adjustment with real-time effect
- Per-domain speed settings automatically saved
- Temporarily disables the site's `scroll-behavior: smooth` during auto-scroll to avoid per-frame animation conflicts

#### Smart Page Navigation
- Multi-layer DOM scanning strategy (semantic areas prioritized)
- Auto-detect "Next Page / Next Chapter" buttons
- Early viewport trigger to avoid unnecessary bottom content
- Auto-navigation disabled by default to prevent accidents

#### Full-Chapter Reading
- Intelligent main content recognition (supports various container structures)
- Segment-by-segment reading with synchronized scrolling and highlighting
- Voice selection, speed adjustment (0.5-5), and preview functionality
- **Read from selection**: if text is selected, reading starts from that paragraph
- **Pause & resume**: on resume, restarts from the selection if one exists; otherwise continues from where it stopped
- Auto-continue to next chapter after reading ends
- **Failure guard**: reading failures will not trigger auto-navigation

#### Plain-Text Page Support (new in v3.0.4)
- Precise detection via `document.contentType` + URL extension
- Coverage: documents/config (`.txt` / `.log` / `.md` / `.csv` / `.json` / `.yaml` / `.ini`), code (`.py` / `.js` / `.java` / `.go` / `.rs`), etc.
- Split by newlines; over-long lines split at sentence-ending punctuation
- **Fully isolated** from the DOM heuristics for normal web pages

#### Universal Compatibility
- Works with most websites
- Semi-transparent UI that doesn't block content
- Floating button auto-attaches to screen edges
- Dual-tab mode (Scroll / Reading tabs separated)

#### Safety & Performance
- Dangerous protocol filtering (javascript:, data:, etc.)
- Layered scanning + throttling strategy
- Smooth performance on long pages

### 📦 Installation

1. Install browser extension: [Tampermonkey](https://www.tampermonkey.net/), Violentmonkey, or Greasemonkey
2. [Click to install script](https://update.greasyfork.org/scripts/590642/AutoReader.user.js)
3. Visit any webpage and click the floating button to start

> **Using local files (`file://`)**: you need to enable "Allow access to file URLs" in your userscript manager's extension details page, otherwise the script won't run on local `.txt` files.

### 🎮 Quick Start

| Action | Description |
| --- | --- |
| Click ≡ floating button | Expand control panel |
| Click ▶ / ■ (Scroll tab) | Start / stop scrolling |
| Click ▶ / ⏸ (Reading tab) | Play / pause / resume reading |
| Select text, then click ▶ (Reading tab) | Start reading from the selected paragraph |
| Click tab label | Switch between scroll and reading modes |
| Press `Space` | Start / stop current mode (toggle required first) |
| Drag floating button | Attach to screen edge, position auto-saved |
| Mouse leave panel | Auto-collapse after 0.6 seconds |

**How reading stops**: automatically at the end of the chapter / switching to the Scroll tab / starting auto-scroll.

### ⚙️ Configuration Options

#### Scroll Mode
- **Scroll Speed**: 1-100 levels
- **Jump Delay**: 0-10 seconds (default 2s)
- **Space Key Control**: Disabled by default
- **Auto-Navigation**: Disabled by default (enables auto-flip at page end)

#### Reading Mode
- **Reading Speed**: 0.5-5 (doesn't interrupt the current sentence; applies from the next one)
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
- Segments by `<p>` tags, filters noise (previous/next chapter, ads, etc.)
- Auto-scrolls to center of viewport and highlights during segment playback

#### Plain-Text Page Routing (v3.0.4)
- **Detection**: `document.contentType` matching `text/plain`, `text/markdown`, `application/json`, etc. → plain-text branch; `text/html` and other explicit web types are rejected; URL extension used as fallback when MIME is missing
- **Extraction**: prefer `<pre>` content, fall back to `body.innerText`; split by `\n`; lines over 500 characters are re-split at sentence-ending punctuation (`。！？!?.;；`) into 100-300 character chunks
- **Isolation**: the plain-text branch never calls `ttsFindContentRoot`, doesn't participate in DOM heuristic scoring, and shares no state with the web-page logic

#### Selection Anchoring
- Takes `selection.getRangeAt(0).startContainer`, walks up to the nearest paragraph element, and matches it against recognized paragraphs
- Fallback: matches the first 20 characters of the selected text against paragraph text (also used on plain-text pages)
- Uses `startContainer` rather than `anchorNode`, so dragging the selection upward still anchors to the earlier paragraph in document order

#### Failure Guard
- Tracks `spokenCount`, the number of paragraphs that actually fired `onstart`
- Expected count = total paragraphs − start index (prevents false negatives when starting mid-article)
- "Finished" requires `spokenCount ≥ expected × 80%`; otherwise it is treated as a failure: stop, **no navigation**, and show "朗读失败 已停止跳转"

#### Scroll Stability
- Inter-frame delta is capped at 100ms, so returning from a background tab doesn't cause a jump
- Auto-navigation uses a generation token; any `stopScroll` / restart invalidates pending navigation timers

### 📄 License

MIT License

### 📝 Full Changelog

| Version | Updates |
| --- | --- |
| **v3.0.4** | Added plain-text page support (routed by MIME + URL extension; covers `.txt` / `.md` / `.json` / code files, etc.); supports `file://` local files; over-long lines split at sentence-ending punctuation |
| **v3.0.3** | Added read-from-selection, pause & resume (restart on selection / continue otherwise), reading failure guard (no navigation on failure), smooth-scroll conflict fix, detection performance optimizations |
| **v3.0.2** | Code optimizations |
| **v3.0.1** | Fixed: occasional layout glitches; hardened content detection with relaxed threshold for short articles; occasional first-sentence swallowing |
| **v3.0** | Added full-chapter reading, intelligent content recognition, segment highlighting, voice/speed adjustment, auto-continue |
| **v2.2** | Auto-navigation now disabled by default, new independent toggle |
| **v2.1** | Floating panel optimization, space key changed to panel toggle, avoid input field conflicts |
| **v2.0** | Early viewport trigger, semi-transparent UI, performance optimization, security hardening |
| **v1.9** | Multi-layer scanning, rule escaping, protocol filtering |
| **v1.0** | Initial release: basic scrolling, speed control, floating button attachment |
