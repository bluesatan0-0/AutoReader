# AutoReader

[English](#english) | [中文](#中文)

---

## 中文

一个轻量、高效的浏览器油猴脚本，专为网页阅读场景设计。支持自动滚动、智能翻页、整章朗读与阅读辅助，特别适合小说、漫画、文章等长内容的连续阅读。

![version](https://img.shields.io/badge/version-3.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

### ✨ 核心功能

#### 自动滚动
- 基于 `requestAnimationFrame`，帧率无关的匀速体验
- 1~100 级无级调节，实时生效
- 每个域名独立保存速度设置

#### 智能翻页
- 分层 DOM 扫描策略（语义区域优先）
- 自动识别"下一页 / 下一章"按钮
- 提前视口触发，减少底部广告观看
- 自动跳转默认关闭，防止误操作

#### 整章朗读
- 正文智能识别（支持多种容器结构）
- 逐段播报并滚动高亮跟随
- 音色选择、语速调节（0.5~5）、试听功能
- 读完自动续读下一章

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
2. [点击安装脚本](https://update.greasyfork.org/scripts/562875/%E7%BD%91%E9%A1%B5%E7%BB%99%E6%88%91%E6%BB%9Auto%20Scroll.user.js)
3. 进入任意网页，点击悬浮按钮开始使用

### 🎮 快速上手

| 操作 | 说明 |
| --- | --- |
| 点击 ≡ 悬浮按钮 | 展开控制面板 |
| 点击 ▶ / ■（滚动页） | 开始 / 停止滚动 |
| 点击 ▶ / ⏸（朗读页） | 播放 / 暂停朗读 |
| 点击标签文字切换 | 在滚动和朗读间切换 |
| 按 `Space` | 当前模式启停（需先开启开关） |
| 拖拽悬浮按钮 | 吸附到左右边缘，自动记忆位置 |
| 鼠标离开面板 | 0.6 秒后自动缩回 |

### ⚙️ 配置选项

#### 滚动模式
- **滚动速度**：1~100 级
- **跳转延迟**：0~10 秒（默认 2 秒）
- **空格键启停**：默认关闭
- **自动跳转**：默认关闭（开启后在页面末尾自动翻页）

#### 朗读模式
- **朗读语速**：0.5~5（调整不打断当前句）
- **音色选择**：本地/在线语音，切换试听
- **空格键控制**：默认关闭
- **自动续读**：读完自动跳转下一章并继续

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

检测过程 600ms 节流，按钮进入视口底部 30% 时自动停止。

#### 朗读识别
- 优先匹配常见正文容器（`#content`、`.readcontent`、`article` 等）
- 启发式打分：文本长度、标点密度、链接占比
- 按 `<p>` 分段，过滤噪声行（上一章、下一章、广告等）
- 逐段播报时自动滚动到视口中央并高亮

### 📝 更新日志

| 版本 | 更新内容 |
| --- | --- |
| **v3.0** | 新增整章朗读/小说朗读、正文智能识别、逐段高亮、音色/语速调节、读完续读 |
| **v2.2** | 自动跳转改为默认关闭、新增独立开关 |
| **v2.1** | 悬浮面板优化、空格键改为面板开关、避免与输入框冲突 |
| **v2.0** | 提前视口触发、半透明 UI、性能优化、安全加固 |
| **v1.9** | 分层扫描、规则转义、协议过滤 |
| **v1.0** | 初始版本：基础滚动、速度调节、吸附按钮 |

### 📄 许可证

MIT License

---

## English

A lightweight and efficient Tampermonkey script designed for web reading scenarios. Supports automatic scrolling, intelligent page navigation, full-chapter reading, and reading assistance—particularly suitable for continuous reading of novels, comics, articles, and long-form content.

![version](https://img.shields.io/badge/version-3.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

### ✨ Key Features

#### Auto Scroll
- Based on `requestAnimationFrame` for frame-rate-independent smooth experience
- 1-100 level speed adjustment with real-time effect
- Per-domain speed settings automatically saved

#### Smart Page Navigation
- Multi-layer DOM scanning strategy (semantic areas prioritized)
- Auto-detect "Next Page / Next Chapter" buttons
- Early viewport trigger to avoid unnecessary bottom content
- Auto-navigation disabled by default to prevent accidents

#### Full-Chapter Reading
- Intelligent main content recognition (supports various container structures)
- Segment-by-segment reading with synchronized scrolling and highlighting
- Voice selection, speed adjustment (0.5-5), and preview functionality
- Auto-continue to next chapter after reading ends

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
2. [Click to install script](https://update.greasyfork.org/scripts/562875/%E7%BD%91%E9%A1%B5%E7%BB%99%E6%88%91%E6%BB%9Auto%20Scroll.user.js)
3. Visit any webpage and click the floating button to start

### 🎮 Quick Start

| Action | Description |
| --- | --- |
| Click ≡ floating button | Expand control panel |
| Click ▶ / ■ (Scroll tab) | Start / stop scrolling |
| Click ▶ / ⏸ (Reading tab) | Play / pause reading |
| Click tab label | Switch between scroll and reading modes |
| Press `Space` | Start / stop current mode (toggle required first) |
| Drag floating button | Attach to screen edge, position auto-saved |
| Mouse leave panel | Auto-collapse after 0.6 seconds |

### ⚙️ Configuration Options

#### Scroll Mode
- **Scroll Speed**: 1-100 levels
- **Jump Delay**: 0-10 seconds (default 2s)
- **Space Key Control**: Disabled by default
- **Auto-Navigation**: Disabled by default (enables auto-flip at page end)

#### Reading Mode
- **Reading Speed**: 0.5-5 (adjustment doesn't interrupt current sentence)
- **Voice Selection**: Local/online voices with preview on switch
- **Space Key Control**: Disabled by default
- **Auto-Continue**: Auto-jump to next chapter and continue reading

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

Detection is throttled at 600ms intervals; stops when button enters bottom 30% of viewport.

#### Reading Recognition
- Prioritizes common main-content containers (`#content`, `.readcontent`, `article`, etc.)
- Heuristic scoring: text length, punctuation density, link ratio
- Segments by `<p>` tags, filters noise (previous/next chapter, ads, etc.)
- Auto-scrolls to center of viewport and highlights during segment playback

### 📝 Changelog

| Version | Updates |
| --- | --- |
| **v3.0** | Added full-chapter reading, intelligent content recognition, segment highlighting, voice/speed adjustment, auto-continue |
| **v2.2** | Auto-navigation now disabled by default, new independent toggle |
| **v2.1** | Floating panel optimization, space key changed to panel toggle, avoid input field conflicts |
| **v2.0** | Early viewport trigger, semi-transparent UI, performance optimization, security hardening |
| **v1.9** | Multi-layer scanning, rule escaping, protocol filtering |
| **v1.0** | Initial release: basic scrolling, speed control, floating button attachment |

### 📄 License

MIT License
