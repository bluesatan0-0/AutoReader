// ==UserScript==
// @name AutoReader
// @namespace       https://github.com/bluesatan0-0/AutoReader
// @homepageURL     https://github.com/bluesatan0-0/AutoReader
// @supportURL      https://github.com/bluesatan0-0/AutoReader/issues
// @version 3.0.3
// @description  网页自动滚动 + 智能翻页 + 小说漫画朗读助手：支持自动滚动、下一页/下一章识别、整章朗读、语速/音色调节和长页面阅读辅助、新增从选中处开始朗读。
// @match        *://*/*
// @grant        none
// @author       bluesatan
// @date         2026.11.13
// @license      MIT license
// @downloadURL https://update.greasyfork.org/scripts/590642/AutoReader.user.js
// @updateURL https://update.greasyfork.org/scripts/590642/AutoReader.meta.js
// ==/UserScript==


(function () {
  'use strict';
  if (window.top !== window) return;

  // ---------- 状态 ----------
  let scrolling = false;
  let scrollRAF = null;
  let scrollTimestamp = 0;
  let scrollAccumulated = 0;
  let liveBaseSpeed = Math.pow(10 / 20, 1.6);   // 当前生效的滚动速度系数，滚动中改速度立即生效
  let prevScrollBehavior = null;                 // 记录原 scroll-behavior 以便恢复

  let expanded = false;               // 悬浮条是否展开成窗口
  let panelSide = 'left';             // 吸左/右边（默认左，与旧版悬浮面板一致）
  let lastYPosition = null;

  const BAR_W = 236;                  // 长条/窗口统一宽度（保证按钮位置不变）
  const BAR_H = 56;                   // 收起态长条高度
  const VIEWPORT_BOTTOM_THRESHOLD = 0.30;

  // ---------- 存储键 ----------
  const STORAGE_KEY = 'autoScrollPanel_v4_viewport';
  const CONFIG_STORAGE_KEY = 'autoScrollConfig_v1';
  const SCROLL_STATE_KEY = 'autoScrollState_v1';
  const DELAY_STORAGE_KEY = 'autoScrollDelay_v1';
  const TTS_RATE_STORAGE_KEY = 'autoScrollTtsRate_v1';
  const SPACEKEY_STORAGE_KEY = 'autoScrollSpaceKey_v1';
  const AUTO_JUMP_STORAGE_KEY = 'autoScrollAutoJump_v1';
  const SPACEKEY_TTS_STORAGE_KEY = 'autoScrollTtsSpaceKey_v1';
  const AUTO_JUMP_TTS_STORAGE_KEY = 'autoScrollTtsAutoJump_v1';
  const SPEED_STORAGE_KEY = 'autoScrollSpeed_site_';
  const EXPAND_STORAGE_KEY = 'autoScrollExpanded_site_';
  const TAB_STORAGE_KEY = 'autoScrollTab_site_';
  const VOICE_STORAGE_KEY = 'autoScrollVoice_site_';
  const TTS_RESUME_KEY = 'autoScrollTtsResume_v1';

  let cachedNextPageBtn = null;
  let lastProbeAt = 0;              // 滚动中"下一页"探测节流时间戳，避免每帧全页扫描
  let configVisible = false;
  let nextPageDelayTimer = null;
  let nextPageToken = 0;            // 定时器代际守卫，防止过期跳转

  // 规则缓存
  let cachedRules = null;
  let cachedRulesText = '__uninitialized__';

  const ACCENT = 'linear-gradient(135deg,#6366f1,#8b5cf6)';
  const ICON_SCROLL_DOWN = '<span style="display:inline-block;transform:rotate(90deg);line-height:1;">\u25B6</span>';

  const DEFAULT_RULES = `# 可选：为特定网站自定义下一页按钮选择器
# 格式：域名模式|CSS选择器|文本关键词
# 当自动检测不准时，可在此指定精确选择器
# 若选择器或关键词中包含 | 字符，请使用反斜杠转义：\\|
# 示例（请根据实际网站修改）：
# *qidian.com*|a#nextChapter|下一章
# *biquge*|.bottem2 a:nth-child(3)|
`;

  function getSpeedStorageKey() { return SPEED_STORAGE_KEY + location.hostname; }
  function getExpandStorageKey() { return EXPAND_STORAGE_KEY + location.hostname; }

  // ---------- 读位置 ----------
  let savedPos = null;
  try { savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { savedPos = null; }
  if (savedPos && (savedPos.side === 'left' || savedPos.side === 'right')) panelSide = savedPos.side;
  if (savedPos && typeof savedPos.y === 'number') lastYPosition = savedPos.y;
  try { expanded = localStorage.getItem(getExpandStorageKey()) === 'true'; } catch (e) { expanded = false; }
  if (lastYPosition == null) lastYPosition = Math.min(window.innerHeight * 0.4, window.innerHeight - BAR_H - 8);

  // ============================================================
  //  悬浮条容器（收起=长条 / 展开=向下扩展的窗口，宽度不变）
  // ============================================================
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;z-index:999999;box-sizing:border-box;'+
    'width:' + BAR_W + 'px;background:rgba(22,22,28,0.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);'+
    'box-shadow:0 10px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08);'+
    'border:1px solid rgba(255,255,255,0.14);border-radius:16px;'+
    'font-family:-apple-system,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;'+
    'cursor:grab;transition:border-radius 0.2s ease;';
  document.body.appendChild(bar);
  bar.setAttribute('data-asr-ui', '1');   // 标记脚本自有UI，正文识别/朗读时整体排除

  // ---------- 收起态：≡ 菜单悬浮按钮（点击展开完整面板；贴屏幕左/右缘停靠） ----------
  const miniBtn = document.createElement('div');
  miniBtn.innerHTML = '\u2630';
  miniBtn.title = '自动滚动 / 朗读面板';
  miniBtn.style.cssText = 'position:fixed;z-index:999999;width:40px;height:40px;display:none;'+
    'justify-content:center;align-items:center;cursor:pointer;color:#fff;font-size:17px;line-height:1;'+
    'background:rgba(22,22,28,0.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);'+
    'border:1px solid rgba(255,255,255,0.14);'+
    'box-shadow:0 10px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08);'+
    'user-select:none;-webkit-user-select:none;touch-action:none;';
  miniBtn.addEventListener('mouseenter', () => { if (!isDragging) miniBtn.style.background = 'rgba(40,40,50,0.85)'; });
  miniBtn.addEventListener('mouseleave', () => { miniBtn.style.background = 'rgba(22,22,28,0.72)'; });
  document.body.appendChild(miniBtn);

  // ---------- 第一行：三个图标按钮（+展开后的功能文字标签） ----------
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;justify-content:space-around;align-items:flex-start;'+
    'padding:8px 10px 0 10px;user-select:none;';
  bar.appendChild(btnRow);

  function makeBtnCell(icon, title) {
    const cell = document.createElement('div');
    cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;'+
      'cursor:pointer;flex:1;';
    cell.setAttribute('data-nodrag', 'true');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = icon;
    btn.style.cssText = 'box-sizing:border-box;width:42px;height:42px;padding:0;'+
      'border:none;border-radius:12px;background:rgba(255,255,255,0.08);color:#fff;'+
      'font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;'+
      'cursor:pointer;outline:none;transition:background 0.18s ease,transform 0.15s ease;';
    const cap = document.createElement('div');
    cap.innerText = title;
    cap.style.cssText = 'color:rgba(255,255,255,0.5);font-size:13px;font-weight:600;'+
      'letter-spacing:0.5px;display:none;padding:4px 14px;margin:1px -14px -4px -14px;'+
      'border-radius:9px;line-height:1.3;transition:background 0.15s ease;';
    cell.appendChild(btn); cell.appendChild(cap);
    btnRow.appendChild(cell);
    btn.addEventListener('mouseenter', () => { if (!btn.classList.contains('is-active')) btn.style.background = 'rgba(255,255,255,0.16)'; });
    btn.addEventListener('mouseleave', () => { if (!btn.classList.contains('is-active')) btn.style.background = 'rgba(255,255,255,0.08)'; });
    return { cell: cell, btn: btn, cap: cap };
  }

  const btnScroll = makeBtnCell(ICON_SCROLL_DOWN, '滚动');
  const btnMenu   = makeBtnCell('\u2630', '菜单');
  const btnPlay   = makeBtnCell('\u25B6', '朗读');

  // 分隔线（仅展开时可见）
  const divider = document.createElement('div');
  divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin:9px 12px 0 12px;display:none;';
  bar.appendChild(divider);

  // ============================================================
  //  展开主体（第二行起）
  // ============================================================
  const body = document.createElement('div');
  body.style.cssText = 'display:none;flex-direction:column;gap:12px;padding:12px;box-sizing:border-box;';
  bar.appendChild(body);

  function makeCell(label, control, wide) {
    const c = document.createElement('div');
    c.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;' +
      (wide ? 'width:100%;' : 'flex:1;min-width:0;');
    c.setAttribute('data-nodrag', 'true');
    if (typeof control === 'string') {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'font-size:12px;color:#fff;';
      wrap.innerHTML = control;
      c.appendChild(wrap);
    } else {
      control.style.boxSizing = 'border-box';
      c.appendChild(control);
    }
    const lab = document.createElement('div');
    lab.innerText = label;
    lab.style.cssText = 'color:rgba(255,255,255,0.45);font-size:10px;font-weight:500;letter-spacing:0.5px;white-space:nowrap;';
    c.appendChild(lab);
    return c;
  }
  function rowFlex(parent) {
    const r = document.createElement('div');
    r.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
    (parent || body).appendChild(r);
    return r;
  }

  function makeToggle() {
    const pill = document.createElement('div');
    pill.style.cssText = 'width:44px;height:22px;border-radius:22px;background:rgba(148,163,184,0.55);'+
      'position:relative;transition:background 0.2s;cursor:pointer;flex-shrink:0;align-self:center;';
    const knob = document.createElement('div');
    knob.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;'+
      'transition:transform 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
    pill.appendChild(knob);
    const box = document.createElement('input'); box.type = 'checkbox'; box.style.display = 'none';
    pill.__box = box; pill.__knob = knob;
    return pill;
  }
  function paintToggle(pill, on) {
    pill.style.background = on ? 'linear-gradient(135deg,#818cf8,#a78bfa)' : 'rgba(148,163,184,0.55)';
    pill.__knob.style.transform = on ? 'translateX(22px)' : 'translateX(0)';
  }

  // ---------- 标签页（滚动 / 朗读） ----------
  let activeTab = 'scroll';
  function makePanel() {
    const p = document.createElement('div');
    p.style.cssText = 'display:none;flex-direction:column;gap:12px;';
    body.appendChild(p);
    return p;
  }
  const scrollPanel = makePanel();
  const ttsPanel = makePanel();
  function paintTabs() {
    const onTab = (tab) => tab === activeTab;
    btnScroll.cap.style.color = onTab('scroll') ? '#fff' : 'rgba(255,255,255,0.5)';
    btnPlay.cap.style.color = onTab('tts') ? '#fff' : 'rgba(255,255,255,0.5)';
    btnScroll.cap.style.background = onTab('scroll') ? 'rgba(99,102,241,0.22)' : 'transparent';
    btnPlay.cap.style.background = onTab('tts') ? 'rgba(99,102,241,0.22)' : 'transparent';
    btnScroll.cap.style.textDecoration = 'none';
    btnPlay.cap.style.textDecoration = 'none';
    scrollPanel.style.display = onTab('scroll') ? 'flex' : 'none';
    ttsPanel.style.display = onTab('tts') ? 'flex' : 'none';
  }
  function switchTab(key) { if (activeTab === key) return; activeTab = key;
    if (key === 'tts') { if (scrolling) stopScroll(); }
    else { if (tts.playing) ttsStop(false); }
    paintTabs(); try { localStorage.setItem(TAB_STORAGE_KEY + location.hostname, key); } catch (e) {} }
  btnScroll.cap.setAttribute('data-nodrag', 'true');
  btnPlay.cap.setAttribute('data-nodrag', 'true');
  btnScroll.cap.style.cursor = 'pointer';
  btnPlay.cap.style.cursor = 'pointer';
  btnScroll.cap.addEventListener('click', (e) => { e.stopPropagation(); switchTab('scroll'); });
  btnPlay.cap.addEventListener('click', (e) => { e.stopPropagation(); switchTab('tts'); });
  btnScroll.cap.addEventListener('mouseenter', () => { if (activeTab !== 'scroll') btnScroll.cap.style.background = 'rgba(255,255,255,0.08)'; });
  btnScroll.cap.addEventListener('mouseleave', () => paintTabs());
  btnPlay.cap.addEventListener('mouseenter', () => { if (activeTab !== 'tts') btnPlay.cap.style.background = 'rgba(255,255,255,0.08)'; });
  btnPlay.cap.addEventListener('mouseleave', () => paintTabs());

  // ---------- 朗读页：语速框 + 音色下拉 ----------
  const row2 = rowFlex(ttsPanel);

  const ttsRateInput = document.createElement('input');
  ttsRateInput.type = 'number'; ttsRateInput.min = '0.5'; ttsRateInput.max = '5'; ttsRateInput.step = '0.1'; ttsRateInput.value = '2';
  ttsRateInput.style.cssText = 'width:66px;height:30px;text-align:center;font-size:13px;font-weight:bold;'+
    'border:1px solid rgba(255,255,255,0.14);border-radius:9px;background:rgba(255,255,255,0.06);color:#fff;'+
    'outline:none;padding:0 4px;box-sizing:border-box;appearance:none;-moz-appearance:textfield;';
  row2.appendChild(makeCell('朗读语速', ttsRateInput));

  const ttsVoiceSel = document.createElement('select');
  ttsVoiceSel.style.cssText = 'flex:1;min-width:0;max-width:150px;height:30px;line-height:30px;overflow:hidden;text-overflow:ellipsis;border-radius:9px;'+
    'border:1px solid rgba(255,255,255,0.22);background:#1c1c26;color:#fff;'+
    'font-size:11px;outline:none;box-sizing:border-box;padding:0 4px;color-scheme:dark;';
  row2.appendChild(makeCell('语音音色', ttsVoiceSel));
  row2.style.alignItems = 'flex-end';

  // ---------- 朗读页开关行 ----------
  const rowTtsToggle = rowFlex(ttsPanel);
  const spaceKeyTtsToggle = makeToggle();
  const autoJumpTtsToggle = makeToggle();
  rowTtsToggle.appendChild(makeCell('空格键朗读', spaceKeyTtsToggle));
  rowTtsToggle.appendChild(makeCell('自动跳转', autoJumpTtsToggle));
  rowTtsToggle.style.alignItems = 'flex-end';
  ttsPanel.insertBefore(rowTtsToggle, row2);

  // ---------- 滚动页：功能开关 ----------
  const row3 = rowFlex(scrollPanel);
  const spaceKeyToggle = makeToggle();
  const autoJumpToggle = makeToggle();
  row3.appendChild(makeCell('空格键滚动', spaceKeyToggle));
  row3.appendChild(makeCell('自动跳转', autoJumpToggle));

  // ---------- 滚动页：滚动速度框 + 跳转延迟框 ----------
  const row4 = rowFlex(scrollPanel);
  const speedInput = document.createElement('input');
  speedInput.type = 'number'; speedInput.min = '1'; speedInput.max = '100';
  let savedSpeed = 10;
  try { const s = localStorage.getItem(getSpeedStorageKey()); if (s !== null) { const p = parseInt(s, 10); if (!isNaN(p) && p >= 1 && p <= 100) savedSpeed = p; } } catch (e) {}
  speedInput.value = String(savedSpeed);
  const speedStyle = 'width:66px;height:28px;text-align:center;font-size:13px;font-weight:bold;border:1px solid rgba(255,255,255,0.14);border-radius:9px;background:rgba(255,255,255,0.06);color:#fff;outline:none;padding:0 4px;box-sizing:border-box;appearance:none;-moz-appearance:textfield;';
  speedInput.style.cssText = speedStyle;
  row4.appendChild(makeCell('滚动速度', speedInput));

  const delayInput = document.createElement('input');
  delayInput.type = 'number'; delayInput.min = '0'; delayInput.max = '10'; delayInput.step = '0.5';
  let savedDelay = 2;
  try { const s = localStorage.getItem(DELAY_STORAGE_KEY); if (s !== null) { const p = parseFloat(s); if (!isNaN(p) && p >= 0 && p <= 10) savedDelay = p; } } catch (e) {}
  delayInput.value = String(savedDelay);
  delayInput.style.cssText = speedStyle;
  row4.appendChild(makeCell('跳转延迟(秒)', delayInput));

  // ---------- 第五行：手动指定跳转按钮 ----------
  const row5 = rowFlex();
  const manualJumpBtn = document.createElement('button');
  manualJumpBtn.type = 'button';
  manualJumpBtn.innerText = '自定义下一页选择器';
  manualJumpBtn.style.cssText = 'width:100%;height:34px;border:none;border-radius:9px;background:rgba(255,255,255,0.14);'+
    'color:#fff;font-size:12px;font-weight:600;cursor:pointer;outline:none;transition:background 0.18s;';
  manualJumpBtn.addEventListener('mouseenter', () => { if (!configVisible) manualJumpBtn.style.background = 'rgba(99,102,241,0.32)'; });
  manualJumpBtn.addEventListener('mouseleave', () => { if (!configVisible) manualJumpBtn.style.background = 'rgba(255,255,255,0.14)'; });
  const jumpCell = makeCell('', manualJumpBtn, true);
  row5.appendChild(jumpCell);
  manualJumpBtn.cell = jumpCell;

  // ============================================================
  //  配置面板
  // ============================================================
  const CONFIG_PANEL_WIDTH = 340;
  const configPanel = document.createElement('div');
  configPanel.style.cssText = 'position:fixed;z-index:999998;width:' + CONFIG_PANEL_WIDTH + 'px;'+
    'background:rgba(20,20,26,0.82);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);'+
    'border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06);'+
    'padding:18px;display:none;flex-direction:column;gap:12px;color:#e8e8e8;font-size:13px;'+
    'border:1px solid rgba(255,255,255,0.08);box-sizing:border-box;font-family:-apple-system,"Microsoft YaHei",sans-serif;';
  document.body.appendChild(configPanel);
  configPanel.setAttribute('data-asr-ui', '1');
  const configTitle = document.createElement('div');
  configTitle.innerText = '自定义下一页选择器';
  configTitle.style.cssText = 'font-weight:bold;font-size:16px;color:#fff;display:flex;justify-content:space-between;align-items:center;';
  const configCloseX = document.createElement('span'); configCloseX.innerHTML = '\u2715';
  configCloseX.style.cssText = 'cursor:pointer;color:rgba(255,255,255,0.4);font-size:18px;';
  configCloseX.addEventListener('click', () => closeConfig());
  configTitle.appendChild(configCloseX); configPanel.appendChild(configTitle);
  const configDesc = document.createElement('div');
  configDesc.innerHTML = '当自动检测"下一页"按钮不准时，可在此指定精确选择器。<br><span style="color:rgba(255,255,255,0.3);font-size:11px">自动跳转需在悬浮窗"自动跳转"开关处开启</span><br>格式：<b style="color:#a5b4fc">域名模式|CSS选择器|文本关键词</b><br>使用 <b style="color:#a5b4fc">*</b> 作为通配符。留空表示自动检测。';
  configDesc.style.cssText = 'color:rgba(255,255,255,0.5);font-size:12px;line-height:1.6;';
  configPanel.appendChild(configDesc);
  const configTextarea = document.createElement('textarea');
  configTextarea.style.cssText = 'width:100%;height:150px;background:rgba(255,255,255,0.04);color:#e0e0e0;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px;font-size:12px;resize:vertical;box-sizing:border-box;font-family:Consolas,"Courier New",monospace;line-height:1.6;outline:none;';
  configTextarea.spellcheck = false;
  configPanel.appendChild(configTextarea);
  const configBtnRow = document.createElement('div');
  configBtnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';
  const resetConfigBtn = document.createElement('button'); resetConfigBtn.innerText = '恢复默认';
  resetConfigBtn.style.cssText = 'padding:8px 14px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);cursor:pointer;font-size:13px;';
  const saveConfigBtn = document.createElement('button'); saveConfigBtn.innerText = '保存';
  saveConfigBtn.style.cssText = 'padding:8px 18px;border:none;border-radius:8px;background:' + ACCENT + ';color:#fff;cursor:pointer;font-size:13px;font-weight:bold;';
  configBtnRow.appendChild(resetConfigBtn); configBtnRow.appendChild(saveConfigBtn); configPanel.appendChild(configBtnRow);
  saveConfigBtn.addEventListener('click', () => { saveConfig(); closeConfig(); });
  resetConfigBtn.addEventListener('click', () => { if (confirm('确定要恢复默认吗？')) configTextarea.value = DEFAULT_RULES; });

  function positionConfigPanel() {
    const rect = bar.getBoundingClientRect();
    let left = panelSide === 'left' ? rect.right + 12 : rect.left - CONFIG_PANEL_WIDTH - 12;
    if (left < 8) left = 8;
    if (left + CONFIG_PANEL_WIDTH > window.innerWidth - 8) left = Math.max(8, window.innerWidth - CONFIG_PANEL_WIDTH - 8);
    configPanel.style.left = left + 'px';
    configPanel.style.top = Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - 320)) + 'px';
  }
  function openConfig() {
    configVisible = true;
    manualJumpBtn.style.background = 'rgba(99,102,241,0.35)';
    loadConfig();
    positionConfigPanel();
    configPanel.style.display = 'flex';
  }
  function closeConfig() {
    configVisible = false;
    configPanel.style.display = 'none';
    manualJumpBtn.style.background = 'rgba(255,255,255,0.08)';
    loadDelay();
  }

  // ============================================================
  //  展开 / 收起
  // ============================================================
  function applyLayout() {
    bar.style.height = 'auto';
    if (expanded) {
      bar.style.display = 'block';
      miniBtn.style.display = 'none';
      body.style.display = 'flex';
      divider.style.display = 'block';
      btnScroll.cap.style.display = 'block';
      btnMenu.cap.style.display = 'block';
      btnPlay.cap.style.display = 'block';
      btnRow.style.alignItems = 'flex-start';
      btnRow.style.paddingTop = '8px';
      btnRow.style.height = 'auto';
    } else {
      if (configVisible) closeConfig();
      bar.style.display = 'none';
      miniBtn.style.display = 'flex';
      positionMiniBtn();
    }
    positionBar();
    if (configVisible) positionConfigPanel();
    try { localStorage.setItem(getExpandStorageKey(), String(expanded)); } catch (e) {}
  }

  let expandCleanupTimer = null;
  function expandFromMini() {
    if (expanded) return;
    cancelCollapse();
    const mr = miniBtn.getBoundingClientRect();
    const finalLeft = panelSide === 'left' ? 0 : window.innerWidth - BAR_W;
    const targetLeft = finalLeft + BAR_W / 2 - 20;
    lastYPosition = Math.max(8, mr.top - 8);
    miniBtn.style.transition = 'none';
    miniBtn.style.left = mr.left + 'px'; miniBtn.style.right = 'auto';
    miniBtn.style.borderRadius = '50%';
    void miniBtn.offsetWidth;
    miniBtn.style.transition = 'left .2s ease, top .2s ease, border-radius .2s ease';
    miniBtn.style.left = targetLeft + 'px';
    miniBtn.style.top = (lastYPosition + 8) + 'px';
    setTimeout(expandPanelMorph, 210);
  }
  function expandPanelMorph() {
    expanded = true;
    miniBtn.style.display = 'none';
    miniBtn.style.transition = '';
    bar.style.display = 'block';
    body.style.display = 'flex';
    divider.style.display = 'block';
    btnScroll.cap.style.display = 'block';
    btnMenu.cap.style.display = 'block';
    btnPlay.cap.style.display = 'block';
    btnRow.style.alignItems = 'flex-start';
    btnRow.style.paddingTop = '8px';
    btnRow.style.height = 'auto';
    bar.style.height = 'auto';
    bar.style.overflow = 'hidden';
    const finalH = bar.offsetHeight;
    const finalLeft = panelSide === 'left' ? 0 : window.innerWidth - BAR_W;
    bar.style.transition = 'none';
    bar.style.left = (finalLeft + BAR_W / 2 - 20) + 'px'; bar.style.right = 'auto';
    bar.style.top = (lastYPosition + 8) + 'px';
    bar.style.width = '40px';
    bar.style.height = '40px';
    bar.style.borderRadius = '12px';
    void bar.offsetHeight;
    bar.style.transition = 'left .22s ease, width .22s ease, top .22s ease, height .22s ease, border-radius .22s ease';
    requestAnimationFrame(() => {
      bar.style.left = finalLeft + 'px';
      bar.style.width = BAR_W + 'px';
      bar.style.top = lastYPosition + 'px';
      bar.style.height = finalH + 'px';
      bar.style.borderRadius = panelSide === 'left' ? '0 16px 16px 0' : '16px 0 0 16px';
    });
    clearTimeout(expandCleanupTimer);
    expandCleanupTimer = setTimeout(() => {
      bar.style.transition = '';
      bar.style.overflow = 'visible';
      bar.style.height = 'auto';
      positionBar();
      if (configVisible) positionConfigPanel();
    }, 260);
    try { localStorage.setItem(getExpandStorageKey(), 'true'); } catch (e) {}
  }
  function toggleExpand() { expanded = !expanded; applyLayout(); }
  btnMenu.cell.addEventListener('click', (e) => { e.stopPropagation(); toggleExpand(); });

  let collapseTimer = null;
  function cancelCollapse() { if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; } }
  function scheduleCollapse() {
    if (!expanded || isDragging || configVisible) return;
    cancelCollapse();
    collapseTimer = setTimeout(() => {
      collapseTimer = null;
      if (expanded && !isDragging && !configVisible && configPanel.style.display === 'none') {
        expanded = false; applyLayout();
      }
    }, 600);
  }
  bar.addEventListener('mouseenter', cancelCollapse);
  bar.addEventListener('mouseleave', scheduleCollapse);
  configPanel.addEventListener('mouseenter', cancelCollapse);
  configPanel.addEventListener('mouseleave', scheduleCollapse);

  // ============================================================
  //  位置 / 拖拽
  // ============================================================
  function positionMiniBtn() {
    miniBtn.style.top = (lastYPosition + (BAR_H - 40) / 2) + 'px';
    if (panelSide === 'left') { miniBtn.style.left = '0px'; miniBtn.style.right = 'auto'; miniBtn.style.borderRadius = '0 50% 50% 0'; }
    else { miniBtn.style.left = 'auto'; miniBtn.style.right = '0px'; miniBtn.style.borderRadius = '50% 0 0 50%'; }
  }
  function positionBar() {
    const h = bar.offsetHeight || BAR_H;
    lastYPosition = Math.max(8, Math.min(lastYPosition, window.innerHeight - h));
    bar.style.top = lastYPosition + 'px';
    bar.style.borderRadius = panelSide === 'left' ? '0 16px 16px 0' : '16px 0 0 16px';
    if (panelSide === 'left') { bar.style.left = '0px'; bar.style.right = 'auto'; }
    else { bar.style.left = 'auto'; bar.style.right = '0px'; }
    positionMiniBtn();
  }
  let isDragging = false, offX = 0, offY = 0, dragMoved = false, startX = 0, startY = 0;
  function dragStart(clientX, clientY) {
    isDragging = true; dragMoved = false;
    startX = clientX; startY = clientY;
    const rect = (expanded ? bar : miniBtn).getBoundingClientRect();
    offX = clientX - rect.left; offY = clientY - rect.top;
    bar.style.cursor = 'grabbing'; miniBtn.style.cursor = 'grabbing';
    cancelCollapse();
  }
  bar.addEventListener('mousedown', (e) => {
    if (e.target.closest && e.target.closest('[data-nodrag="true"]')) return;
    dragStart(e.clientX, e.clientY); e.preventDefault();
  });
  miniBtn.addEventListener('mousedown', (e) => { dragStart(e.clientX, e.clientY); e.preventDefault(); });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    if (!dragMoved && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 4) dragMoved = true;
    const target = expanded ? bar : miniBtn;
    const x = Math.max(0, Math.min(e.clientX - offX, window.innerWidth - target.offsetWidth));
    lastYPosition = Math.max(8, Math.min(e.clientY - offY, window.innerHeight - target.offsetHeight));
    target.style.left = x + 'px'; target.style.right = 'auto'; target.style.top = lastYPosition + 'px';
    if (!expanded) miniBtn.style.borderRadius = '50%';
    if (configVisible) positionConfigPanel();
  });
  document.addEventListener('mouseup', () => {
    if (!isDragging) return; isDragging = false;
    bar.style.cursor = 'grab'; miniBtn.style.cursor = 'pointer';
    const rect = (expanded ? bar : miniBtn).getBoundingClientRect();
    panelSide = (rect.left + rect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ side: panelSide, y: lastYPosition })); } catch (e) {}
    positionBar();
  });
  miniBtn.addEventListener('click', () => { if (!dragMoved) expandFromMini(); });
  bar.addEventListener('touchstart', (e) => {
    if (e.target.closest && e.target.closest('[data-nodrag="true"]')) return;
    if (e.touches.length !== 1) return;
    dragStart(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  }, { passive: false });
  miniBtn.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    dragStart(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    if (!dragMoved && Math.abs(t.clientX - startX) + Math.abs(t.clientY - startY) > 4) dragMoved = true;
    const target = expanded ? bar : miniBtn;
    const x = Math.max(0, Math.min(t.clientX - offX, window.innerWidth - target.offsetWidth));
    lastYPosition = Math.max(8, Math.min(t.clientY - offY, window.innerHeight - target.offsetHeight));
    target.style.left = x + 'px'; target.style.right = 'auto'; target.style.top = lastYPosition + 'px';
    if (!expanded) miniBtn.style.borderRadius = '50%';
    if (configVisible) positionConfigPanel();
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!isDragging) return; isDragging = false;
    miniBtn.style.cursor = 'pointer';
    const wasMiniTap = !expanded && !dragMoved;
    const rect = (expanded ? bar : miniBtn).getBoundingClientRect();
    panelSide = (rect.left + rect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ side: panelSide, y: lastYPosition })); } catch (e) {}
    positionBar();
    if (wasMiniTap) { expandFromMini(); } else { scheduleCollapse(); }
  });
  window.addEventListener('resize', () => { positionBar(); if (configVisible) positionConfigPanel(); });

  // ============================================================
  //  存储读写
  // ============================================================
  function loadConfig() {
    try { const s = localStorage.getItem(CONFIG_STORAGE_KEY); configTextarea.value = s || DEFAULT_RULES; }
    catch (e) { configTextarea.value = DEFAULT_RULES; }
  }
  function saveConfig() {
    try { localStorage.setItem(CONFIG_STORAGE_KEY, configTextarea.value); } catch (e) {}
    cachedRules = null; cachedRulesText = '__invalidated__';
  }
  function loadDelay() { try { const s = localStorage.getItem(DELAY_STORAGE_KEY); if (s !== null) { const v = parseFloat(s); if (!isNaN(v) && v >= 0 && v <= 10) { delayInput.value = String(Math.round(v * 2) / 2); return; } } } catch (e) {} delayInput.value = '2'; }
  function saveDelay() { try { localStorage.setItem(DELAY_STORAGE_KEY, delayInput.value); } catch (e) {} }
  function loadTtsRate() { try { const s = localStorage.getItem(TTS_RATE_STORAGE_KEY); if (s !== null) { const v = parseFloat(s); if (!isNaN(v) && v >= 0.5 && v <= 5) { ttsRateInput.value = String(v); tts.rate = v; return; } } } catch (e) {} ttsRateInput.value = '2'; tts.rate = 2; }
  function saveTtsRate() { try { localStorage.setItem(TTS_RATE_STORAGE_KEY, String(tts.rate)); } catch (e) {} }
  function spaceKey() { return spaceKeyToggle.__box; }
  function autoJump() { return autoJumpToggle.__box; }
  function spaceKeyTts() { return spaceKeyTtsToggle.__box; }
  function autoJumpTts() { return autoJumpTtsToggle.__box; }
  function loadSpaceKey() { try { const s = localStorage.getItem(SPACEKEY_STORAGE_KEY + '_' + location.hostname); spaceKey().checked = s === 'true'; } catch (e) { spaceKey().checked = false; } paintToggle(spaceKeyToggle, spaceKey().checked); }
  function saveSpaceKey() { try { localStorage.setItem(SPACEKEY_STORAGE_KEY + '_' + location.hostname, String(spaceKey().checked)); } catch (e) {} }
  function loadAutoJump() { try { const s = localStorage.getItem(AUTO_JUMP_STORAGE_KEY + '_' + location.hostname); autoJump().checked = s === 'true'; } catch (e) { autoJump().checked = false; } paintToggle(autoJumpToggle, autoJump().checked); }
  function saveAutoJump() { try { localStorage.setItem(AUTO_JUMP_STORAGE_KEY + '_' + location.hostname, String(autoJump().checked)); } catch (e) {} }
  function loadSpaceKeyTts() { try { const s = localStorage.getItem(SPACEKEY_TTS_STORAGE_KEY + '_' + location.hostname); spaceKeyTts().checked = s === 'true'; } catch (e) { spaceKeyTts().checked = false; } paintToggle(spaceKeyTtsToggle, spaceKeyTts().checked); }
  function saveSpaceKeyTts() { try { localStorage.setItem(SPACEKEY_TTS_STORAGE_KEY + '_' + location.hostname, String(spaceKeyTts().checked)); } catch (e) {} }
  function loadAutoJumpTts() { try { const s = localStorage.getItem(AUTO_JUMP_TTS_STORAGE_KEY + '_' + location.hostname); autoJumpTts().checked = s === 'true'; } catch (e) { autoJumpTts().checked = false; } paintToggle(autoJumpTtsToggle, autoJumpTts().checked); }
  function saveAutoJumpTts() { try { localStorage.setItem(AUTO_JUMP_TTS_STORAGE_KEY + '_' + location.hostname, String(autoJumpTts().checked)); } catch (e) {} }
  function getDelayMs() { const v = parseFloat(delayInput.value); if (isNaN(v) || v < 0) return 2000; return Math.round(v * 1000); }

  spaceKeyToggle.addEventListener('click', (e) => { e.stopPropagation(); spaceKey().checked = !spaceKey().checked; paintToggle(spaceKeyToggle, spaceKey().checked); saveSpaceKey(); });
  autoJumpToggle.addEventListener('click', (e) => { e.stopPropagation(); autoJump().checked = !autoJump().checked; paintToggle(autoJumpToggle, autoJump().checked); saveAutoJump(); });
  spaceKeyTtsToggle.addEventListener('click', (e) => { e.stopPropagation(); spaceKeyTts().checked = !spaceKeyTts().checked; paintToggle(spaceKeyTtsToggle, spaceKeyTts().checked); saveSpaceKeyTts(); });
  autoJumpTtsToggle.addEventListener('click', (e) => { e.stopPropagation(); autoJumpTts().checked = !autoJumpTts().checked; paintToggle(autoJumpTtsToggle, autoJumpTts().checked); saveAutoJumpTts(); });
  manualJumpBtn.cell.addEventListener('click', (e) => { e.stopPropagation(); if (configVisible) closeConfig(); else openConfig(); });

  function bindNumberFocus(el) {
    el.addEventListener('focus', () => { el.style.borderColor = 'rgba(99,102,241,0.6)'; el.style.background = 'rgba(255,255,255,0.1)'; });
    el.addEventListener('blur', () => { el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.background = 'rgba(255,255,255,0.06)'; });
  }
  [speedInput, delayInput, ttsRateInput].forEach(bindNumberFocus);
  speedInput.addEventListener('change', () => { let v = parseInt(speedInput.value, 10); if (isNaN(v) || v < 1) v = 1; if (v > 100) v = 100; speedInput.value = String(v); try { localStorage.setItem(getSpeedStorageKey(), String(v)); } catch (e) {} liveBaseSpeed = computeBaseSpeed(); });
  delayInput.addEventListener('change', () => { let v = parseFloat(delayInput.value); if (isNaN(v) || v < 0) v = 0; if (v > 10) v = 10; v = Math.round(v * 2) / 2; delayInput.value = String(v); saveDelay(); });
  speedInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); speedInput.blur(); if (activeTab === 'scroll' && !scrolling) startScroll(); } });

  // ============================================================
  //  下一页探测
  // ============================================================
  function parseRules(text) {
    return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(line => {
      const parts = []; let current = ''; let escaped = false;
      for (let i = 0; i < line.length; i++) { const ch = line[i]; if (escaped) { current += ch; escaped = false; continue; } if (ch === '\\') { escaped = true; continue; } if (ch === '|') { parts.push(current.trim()); current = ''; continue; } current += ch; }
      parts.push(current.trim());
      return { pattern: parts[0] || '', selector: parts[1] || '', keyword: parts[2] || '' };
    });
  }
  function getRules() {
    const txt = configTextarea.value;
    if (cachedRulesText !== txt) {
      cachedRulesText = txt;
      cachedRules = parseRules(txt);
    }
    return cachedRules || [];
  }
  function isElementVisible(el) {
    if (!el) return false; if (!document.body.contains(el)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) < 0.05) return false;
    const rect = el.getBoundingClientRect(); return rect.width > 0 && rect.height > 0;
  }
  function findNextButtonGeneric() {
    const keywords = ['下一章','下一页','next chapter','下一节','下章','下页','下一话','next_chap','next chap','下一回','下一卷','下一篇','下回','next page','下一章節','下一話','下一頁','下一节','下节','下話','次の章','次へ','다음','다음 장','다음 화','后一章','后一节','后一页'];
    const lcKeywords = keywords.map(k => k.toLowerCase());
    const candidateTags = 'a, button, [role="button"], input[type="button"], input[type="submit"], li, strong, b, em, i, label, td, th, h1, h2, h3, h4, h5, h6';
    const candidateTagsHeavy = 'div, span, p';
    const semanticContainers = ['nav','article','main','footer','[class*="page"]','[class*="chapter"]','[class*="nav"]','[class*="control"]','[id*="page"]','[id*="chapter"]','[id*="nav"]'];
    const MAX_CANDIDATES = 1200;
    const MIN = 20;
    let elements = []; const seen = new Set();
    const pushAll = (nodes, cap) => { for (const n of nodes) { if (seen.has(n)) continue; seen.add(n); elements.push(n); if (elements.length >= cap) return true; } return false; };
    for (const sel of semanticContainers) {
      let containers; try { containers = document.querySelectorAll(sel); } catch (e) { continue; }
      for (const c of containers) {
        try {
          if (pushAll(c.querySelectorAll(candidateTags), MAX_CANDIDATES)) break;
          if (elements.length < 300 && pushAll(c.querySelectorAll(candidateTagsHeavy), MAX_CANDIDATES)) break;
        } catch (e) {}
      }
      if (elements.length >= MAX_CANDIDATES) break;
    }
    if (elements.length < 20) { try { pushAll(document.querySelectorAll('a, button, [role="button"], input[type="button"], input[type="submit"]'), MAX_CANDIDATES); } catch (e) {} }
    if (elements.length < 20) {
      try {
        const heavy = document.querySelectorAll('div, span, p');
        for (const n of heavy) {
          const r = n.getBoundingClientRect();
          if (r.width < MIN && r.height < MIN) continue;
          if (pushAll([n], MAX_CANDIDATES)) break;
        }
      } catch (e) {}
    }

    const textHits = [];
    for (const el of elements) {
      const raw = (el.textContent || el.value || el.title || el.getAttribute('aria-label') || '').toLowerCase();
      const text = raw.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      let matched = null;
      for (let i = 0; i < lcKeywords.length; i++) {
        const kw = lcKeywords[i];
        if (text === kw || text.includes(kw)) { matched = keywords[i]; break; }
      }
      if (!matched) continue;
      textHits.push({ el: el, text: text, matched: matched });
    }

    let bestMatch = null, bestScore = 0;
    for (const hit of textHits) {
      const el = hit.el, text = hit.text, matched = hit.matched;
      if (!isElementVisible(el)) continue;
      const tag = el.tagName.toLowerCase();
      if (tag === 'div' || tag === 'span' || tag === 'p' || tag === 'li' || tag === 'td' || tag === 'th') { const r = el.getBoundingClientRect(); if (r.width < MIN && r.height < MIN) continue; }
      let score = 100;
      if (text === matched.toLowerCase()) score += 50;
      if (el.tagName === 'A') score += 30;
      if (el.tagName === 'BUTTON') score += 25;
      if (el.onclick || el.getAttribute('onclick')) score += 20;
      if (el.getAttribute('href')) score += 15;
      if (text.length > matched.length + 10) score -= 30;
      let depth = 0, parent = el.parentElement; while (parent && depth < 10) { depth++; parent = parent.parentElement; } score -= depth * 2;
      if (score > bestScore) { bestScore = score; bestMatch = el; }
    }
    if (!bestMatch) {
      for (const link of document.querySelectorAll('a[href]')) {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const text = (link.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (href.includes('next') || href.includes('chapter') || href.match(/\d+/) || href.includes('page')) {
          if (text.includes('下') || text.includes('next') || text.includes('后') || text.includes('▶') || text.includes('→') || text.includes('>')) { if (isElementVisible(link)) { bestMatch = link; break; } }
        }
      }
    }
    return bestMatch;
  }
  function findNextPageButton() {
    const rules = getRules();
    const hostname = location.hostname.toLowerCase();
    const matchedRule = rules.find(rule => { if (!rule.pattern) return false; const pattern = rule.pattern.replace(/\*/g, '.*'); try { return new RegExp(pattern, 'i').test(hostname); } catch (e) { return hostname.includes(rule.pattern.replace(/\*/g, '')); } });
    if (matchedRule && matchedRule.selector) { const btn = document.querySelector(matchedRule.selector); if (btn && isElementVisible(btn)) { if (!matchedRule.keyword) return btn; const text = (btn.innerText || btn.textContent || '').toLowerCase(); if (text.includes(matchedRule.keyword.toLowerCase())) return btn; } }
    return findNextButtonGeneric();
  }

  // ============================================================
  //  滚动逻辑
  // ============================================================
  function isSafeHref(href) { if (!href) return false; const l = href.toLowerCase().trim(); if (l === '#') return false; const d = ['javascript:','data:','vbscript:','file:']; for (const p of d) if (l.startsWith(p)) return false; return true; }
  function tryAutoNextPage() {
    const nextBtn = findNextPageButton(); if (!nextBtn) return;
    try { sessionStorage.setItem(SCROLL_STATE_KEY, JSON.stringify({ scrolling: true, speed: speedInput.value, timestamp: Date.now() })); } catch (e) {}
    const delayMs = getDelayMs();
    const token = ++nextPageToken;
    nextPageDelayTimer = setTimeout(() => {
      if (token !== nextPageToken) return;
      nextPageDelayTimer = null;
      cachedNextPageBtn = null;
      const href = nextBtn.getAttribute('href');
      if (nextBtn.tagName === 'A' && isSafeHref(href)) location.href = nextBtn.href;
      else nextBtn.click();
    }, delayMs);
  }
  function computeBaseSpeed() { let speed = parseInt(speedInput.value, 10); if (isNaN(speed) || speed < 1) speed = 1; if (speed > 100) speed = 100; return Math.pow(speed / 20, 1.6); }
  function paintScrollBtn() {
    if (scrolling) { btnScroll.btn.innerHTML = '\u25A0'; btnScroll.btn.classList.add('is-active'); btnScroll.btn.style.background = 'rgba(99,102,241,0.35)'; btnScroll.cap.innerText = '停止'; }
    else { btnScroll.btn.innerHTML = ICON_SCROLL_DOWN; btnScroll.btn.classList.remove('is-active'); btnScroll.btn.style.background = 'rgba(255,255,255,0.08)'; btnScroll.cap.innerText = '滚动'; }
  }
  function startScroll() {
    let speed = parseInt(speedInput.value, 10); if (isNaN(speed) || speed < 1) speed = 1; if (speed > 100) speed = 100;
    liveBaseSpeed = computeBaseSpeed();
    if (tts.playing) ttsStop(false);
    scrolling = true; cachedNextPageBtn = null; lastProbeAt = 0;
    if (nextPageDelayTimer) { clearTimeout(nextPageDelayTimer); nextPageDelayTimer = null; }
    if (prevScrollBehavior === null) {
      prevScrollBehavior = document.documentElement.style.scrollBehavior || '';
      document.documentElement.style.scrollBehavior = 'auto';
    }
    paintScrollBtn();
    scrollTimestamp = 0; scrollAccumulated = 0;
    try { localStorage.setItem(getSpeedStorageKey(), String(speed)); } catch (e) {}
    function scrollStep(ts) {
      if (!scrolling) return;
      if (!scrollTimestamp) scrollTimestamp = ts;
      const delta = Math.min(ts - scrollTimestamp, 100);
      scrollTimestamp = ts;
      scrollAccumulated += liveBaseSpeed * (delta / 16.67);
      let now = Math.floor(scrollAccumulated); scrollAccumulated -= now;
      if (now > 0) {
        const cur = window.scrollY; const max = document.documentElement.scrollHeight - window.innerHeight;
        if (autoJump().checked && activeTab === 'scroll' && !tts.playing) {
          if (!cachedNextPageBtn || !document.body.contains(cachedNextPageBtn) || !isElementVisible(cachedNextPageBtn)) {
            if (ts - lastProbeAt > 600) { lastProbeAt = ts; cachedNextPageBtn = findNextPageButton(); }
          }
          if (cachedNextPageBtn) { const br = cachedNextPageBtn.getBoundingClientRect(); const th = window.innerHeight * (1 - VIEWPORT_BOTTOM_THRESHOLD); if (br.top >= 0 && br.top <= th && br.bottom <= window.innerHeight + 50) { stopScroll(); tryAutoNextPage(); return; } }
          if (cur >= max - 2) { stopScroll(); tryAutoNextPage(); return; }
        } else { if (cur >= max - 2) { stopScroll(); return; } }
        window.scrollBy(0, now);
      }
      scrollRAF = requestAnimationFrame(scrollStep);
    }
    scrollRAF = requestAnimationFrame(scrollStep);
  }
  function stopScroll() {
    scrolling = false; cachedNextPageBtn = null;
    nextPageToken++;
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    if (nextPageDelayTimer) { clearTimeout(nextPageDelayTimer); nextPageDelayTimer = null; }
    if (prevScrollBehavior !== null) {
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
      prevScrollBehavior = null;
    }
    paintScrollBtn();
  }
  btnScroll.cell.addEventListener('click', (e) => { e.stopPropagation(); if (scrolling) stopScroll(); else startScroll(); });

  function restoreScrollState() {
    try { const st = JSON.parse(sessionStorage.getItem(SCROLL_STATE_KEY));
      if (st && st.scrolling) { if (Date.now() - st.timestamp < 5 * 60 * 1000) { speedInput.value = st.speed; try { localStorage.setItem(getSpeedStorageKey(), st.speed); } catch (e) {} setTimeout(() => { if (!scrolling && activeTab === 'scroll') startScroll(); }, 1200); } sessionStorage.removeItem(SCROLL_STATE_KEY); }
    } catch (e) {}
  }

  function restoreTtsState() {
    try { const st = JSON.parse(sessionStorage.getItem(TTS_RESUME_KEY));
      if (st && st.resume && Date.now() - st.timestamp < 5 * 60 * 1000) {
        sessionStorage.removeItem(TTS_RESUME_KEY);
        activeTab = 'tts'; paintTabs();
        try { localStorage.setItem(TAB_STORAGE_KEY + location.hostname, 'tts'); } catch (e) {}
        setTimeout(() => { if (!tts.playing) ttsStart(); }, 1200);
      }
    } catch (e) {}
  }

  // ---------- 空格键快捷滚动 ----------
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (activeTab === 'tts') {
      if (!spaceKeyTts().checked) return;
      e.preventDefault(); ttsPauseToggle(); return;
    } else {
      if (!spaceKey().checked) return;
      e.preventDefault(); if (scrolling) stopScroll(); else startScroll();
    }
  });

  // ============================================================
  //  朗读正文识别
  // ============================================================
  const TTS_NEG_RE = /comment|nav|menu|header|footer|sidebar|recommend|related|advert|banner|crumb|share|login|register|copyright|vote|reply|postlist|plate|pager|pagebar|catalog|chapterlist|booklist|aside|widget|tag|tool|topbar|statement|report|favorite|bookmark|search/i;
  const TTS_POS_RE = /content|article|chapter|text|main|read|post|novel|book|showtxt|cont|view|story|nr\b/i;
  const TTS_DROP_LINE = /上一章|下一章|上一页|下一页|返回目录|章节目录|加入书签|加入书架|投推荐票|我要报错|手机阅读|手机用户|最新网址|请记住|未完待续|本章完|笔趣阁|小说网|免费阅读|全文字|无弹窗|更新最快|作者：|作者:|字数：|点击|下载|朗读语速|语音音色|空格键朗读|空格键滚动|自定义下一页选择器|跳转延迟|自动跳转/i;
  const TTS_CONTAINER_SELS = ['#chaptercontent','#htmlContent','#contentdetail','#BookText','#nr1','#text','#booktxt','#chapterbody','#content_text','#content1','#articleContent','#con','#mlfy_main_text','.showtxt','.readcontent','.read-content','.chapter-content','.novelcontent','article','#content','.content','main'];
  function ttsLinkDensity(el) { const l = el.querySelectorAll('a'); if (!l.length) return 0; let s = 0; l.forEach(a => s += (a.innerText || '').length); return s / Math.max(1, (el.innerText || '').length); }
  function ttsPunctRatio(text) { const han = text.match(/[一-龥]/g); if (!han || han.length < 30) return 0; const p = text.match(/[。！？；，、：,.;:!?]/g); return p ? p.length / han.length : 0; }
  function ttsScoreBlock(el) { if (!(el instanceof HTMLElement)) return 0; if (TTS_NEG_RE.test(el.id + ' ' + el.className)) return 0; if (el.closest('nav, header, footer, aside, form, [data-asr-ui], script, style')) return 0; const text = (el.textContent || '').replace(/\s+/g, ''); if (text.length < 200) return 0; if (ttsLinkDensity(el) > 0.25) return 0; const pr = ttsPunctRatio(text); if (pr < 0.02) return 0; let score = Math.min(text.length, 8000); if (TTS_POS_RE.test(el.id + ' ' + el.className)) score *= 1.5; score *= (0.5 + Math.min(pr, 0.25) * 2); score += el.querySelectorAll('p').length * 20; return score; }
  function ttsFindContentRoot() { for (const s of TTS_CONTAINER_SELS) { const el = document.querySelector(s); if (!el) continue; const text = (el.textContent || '').replace(/\s+/g, ''); if (text.length > 200 && ttsLinkDensity(el) < 0.25 && ttsPunctRatio(text) > 0.02) return el; } let best = null, bestScore = 0; document.querySelectorAll('body div, body section').forEach(el => { const sc = ttsScoreBlock(el); if (sc > bestScore) { bestScore = sc; best = el; } }); return best; }
  function ttsExtractParagraphs() { const root = ttsFindContentRoot(); if (!root) return []; const nodes = root.querySelectorAll('p'); const out = []; const seen = new Set(); if (nodes.length < 3) { const parts = root.innerHTML.replace(/<(script|style|select|textarea)[\s\S]*?<\/\1>/gi, ' ').split(/<br\s*\/?>(?![^<]*<\/p>)/i).map(s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).filter(s => s.length >= 4 && s.length <= 2000 && !TTS_DROP_LINE.test(s)); parts.forEach(t => { if (!seen.has(t)) { seen.add(t); out.push({ text: t, elem: root }); } }); return out; } nodes.forEach(p => { if (TTS_NEG_RE.test(p.id + ' ' + p.className)) return; if (p.closest('nav, header, footer, aside, [data-asr-ui]')) return; const t = (p.innerText || '').replace(/\s+/g, ' ').trim(); if (t.length < 4 || t.length > 2000) return; if (TTS_DROP_LINE.test(t)) return; if (ttsLinkDensity(p) > 0.3) return; if (seen.has(t)) return; seen.add(t); out.push({ text: t, elem: p }); }); return out; }

  // ---------- 朗读控制 ----------
  // spokenCount：真正进入 onstart 的句子数（用于"读完 vs 失败"判定）
  // startIdx：本次朗读会话的锚点（由选中决定的起点，或 0）
  const tts = { texts: [], idx: 0, playing: false, paused: false, voice: null, rate: 2, resumeTimer: null, watchdog: null, spokenCount: 0, startIdx: 0 };

  // 检测页面选中文本对应的段落索引（-1 表示无选中 / 未找到）
  function findSelectedParagraphIndex() {
    try {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return -1;
      if (!sel.toString().trim()) return -1;
      const range = sel.getRangeAt(0);
      let node = range.startContainer;
      if (!node) return -1;
      const startEl = node.nodeType === 1 ? node : node.parentElement;
      if (!startEl) return -1;
      for (let i = 0; i < tts.texts.length; i++) {
        const el = tts.texts[i].elem;
        if (el && (el === startEl || el.contains(startEl))) return i;
      }
      const snippet = sel.toString().replace(/\s+/g, ' ').trim().slice(0, 20);
      if (snippet) {
        for (let i = 0; i < tts.texts.length; i++) {
          const t = tts.texts[i].text || '';
          if (t.includes(snippet)) return i;
        }
      }
      return -1;
    } catch (e) {
      return -1;
    }
  }

  function paintPlayBtn() { const active = tts.playing && !tts.paused; btnPlay.btn.innerHTML = active ? '\u23F8' : '\u25B6'; if (active) btnPlay.btn.classList.add('is-active'); else btnPlay.btn.classList.remove('is-active'); btnPlay.btn.style.background = active ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'; btnPlay.cap.innerText = active ? '暂停' : '朗读'; }
  let playHintTimer = null;
  function flashPlayHint(msg) {
    clearTimeout(playHintTimer);
    btnPlay.cap.style.display = 'block';
    btnPlay.cap.innerText = msg;
    btnPlay.cap.style.color = '#fca5a5';
    btnPlay.btn.style.background = 'rgba(239,68,68,0.28)';
    playHintTimer = setTimeout(() => {
      paintPlayBtn();
      paintTabs();
    }, 1800);
  }
  function ttsSpeakCurrent() {
    if (!tts.playing || tts.paused) return;
    if (tts.idx >= tts.texts.length) { ttsStop(true); return; }
    clearTimeout(tts.watchdog);
    const item = tts.texts[tts.idx];
    const u = new SpeechSynthesisUtterance(item.text);
    if (tts.voice) u.voice = tts.voice; u.lang = (tts.voice && tts.voice.lang) || 'zh-CN'; u.rate = tts.rate; u.volume = 1; u.pitch = 1;
    let advanced = false, started = false, retryCount = 0;
    const advance = () => { if (advanced) return; advanced = true; clearTimeout(tts.watchdog); tts.idx++; ttsSpeakCurrent(); };
    u.onstart = () => {
      started = true;
      tts.spokenCount++;
      if (item.elem && item.elem.scrollIntoView) { try { item.elem.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    };
    u.onend = () => { if (!tts.playing) return; advance(); };
    u.onerror = (e) => {
      if (!tts.playing) return;
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      advance();
    };
    try { speechSynthesis.speak(u); } catch (e) { advance(); return; }
    tts.watchdog = setTimeout(() => {
      if (!tts.playing || tts.paused) return;
      if (speechSynthesis.speaking || speechSynthesis.pending) return;
      if (!started && retryCount < 2) {
        retryCount++;
        if (retryCount === 1) {
          const vs = speechSynthesis.getVoices(); const fb = vs.find(v => v.localService) || vs[0] || null;
          if (fb && fb !== tts.voice) tts.voice = fb;
        }
        try { speechSynthesis.cancel(); } catch (e) {}
        ttsSpeakCurrent();
        return;
      }
      advance();
    }, 3000);
  }
  function ttsStartResumeGuard() { clearInterval(tts.resumeTimer); tts.resumeTimer = setInterval(() => { if (tts.playing && !tts.paused && speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); speechSynthesis.resume(); } }, 8000); }

  // 从指定段落重新开始朗读
  function ttsRestartFrom(idx) {
    tts.idx = idx;
    tts.spokenCount = 0;
    clearTimeout(tts.watchdog);
    try { speechSynthesis.cancel(); } catch (e) {}
    tts.paused = false;
    ttsStartResumeGuard();
    paintPlayBtn();
    setTimeout(() => { if (tts.playing && !tts.paused) ttsSpeakCurrent(); }, 60);
  }

  function ttsStart() {
    if (!tts.texts.length) {
      // 首次提取正文：从选中处（如有）或从头开始
      tts.texts = ttsExtractParagraphs();
      tts.idx = 0;
      tts.spokenCount = 0;
      const selIdx = findSelectedParagraphIndex();
      if (selIdx >= 0) tts.idx = selIdx;
      tts.startIdx = tts.idx;
    } else {
      // texts 已存在（切标签 / 开滚动等触发 ttsStop(false) 后再点朗读）
      // 有选中 → 从选中处；无选中 → 保持 idx 从中断处继续
      const selIdx = findSelectedParagraphIndex();
      if (selIdx >= 0) {
        tts.idx = selIdx;
        tts.startIdx = selIdx;
        tts.spokenCount = 0;
      }
    }
    if (!tts.texts.length) { flashPlayHint('未识别到正文'); return; }
    try { speechSynthesis.cancel(); } catch (e) {}
    if (scrolling) stopScroll();
    tts.playing = true; tts.paused = false; ttsStartResumeGuard(); paintPlayBtn();
    setTimeout(() => { if (tts.playing && !tts.paused) ttsSpeakCurrent(); }, 60);
  }
  /**
   * 朗读播放/暂停/恢复切换。
   *
   * 恢复规则（只看恢复那一刻的页面选中状态）：
   *   有选中文本且能定位到段落 → 从选中处重新开始；
   *   否则                     → 从中断处继续（speechSynthesis.resume）。
   */
  function ttsPauseToggle() {
    if (!tts.playing) { ttsStart(); return; }
    if (tts.paused) {
      const selIdx = findSelectedParagraphIndex();
      if (selIdx >= 0) {
        // 有选中 → 从选中处重新开始
        tts.startIdx = selIdx;
        ttsRestartFrom(selIdx);
        return;
      }
      // 无选中 → 从中断处继续
      speechSynthesis.resume();
      tts.paused = false;
    } else {
      speechSynthesis.pause();
      tts.paused = true;
    }
    paintPlayBtn();
  }
  /**
   * 停止朗读。
   * @param {boolean} finished true 表示"流程跑到末尾"，需按比例判定是否算作"读完"并可能触发自动跳转；false 表示状态切换（切标签/开滚动）。
   * @param {boolean} skipJump true 表示无论如何都不跳转。
   */
  function ttsStop(finished, skipJump) {
    tts.playing = false; tts.paused = false;
    clearInterval(tts.resumeTimer);
    clearTimeout(tts.watchdog);
    try { speechSynthesis.cancel(); } catch (e) {}
    paintPlayBtn();
    if (finished) {
      const spoken = tts.spokenCount;
      const total = tts.texts.length;
      // 预期应读段数 = total - startIdx（从选中/中断处开始时，不因分母过大而误判）
      const expected = total - (tts.startIdx || 0);
      const actuallySpoken = spoken > 0 && expected > 0 && spoken >= Math.ceil(expected * 0.8);
      tts.texts = []; tts.idx = 0; tts.spokenCount = 0; tts.startIdx = 0;
      if (skipJump) return;
      if (!actuallySpoken) {
        if (autoJumpTts().checked) flashPlayHint('朗读失败 已停止跳转');
        return;
      }
      if (autoJumpTts().checked) tryAutoNextPageTts();
    }
  }
  function tryAutoNextPageTts() {
    const nextBtn = findNextPageButton(); if (!nextBtn) return;
    try { sessionStorage.setItem(TTS_RESUME_KEY, JSON.stringify({ resume: true, timestamp: Date.now() })); } catch (e) {}
    cachedNextPageBtn = null;
    const href = nextBtn.getAttribute('href');
    if (nextBtn.tagName === 'A' && isSafeHref(href)) location.href = nextBtn.href; else nextBtn.click();
  }
  // 朗读按钮：单击 = 播放 / 暂停 / 恢复
  btnPlay.cell.addEventListener('click', (e) => { e.stopPropagation(); ttsPauseToggle(); });

  function ttsPickVoice(vs) { const zh = vs.filter(v => /^zh([-_]|$)/i.test(v.lang)); const localZh = zh.filter(v => v.localService); return localZh.find(v => /xiaoxiao|xiaoyi|yunjian|hui|han|mei|ting/i.test(v.name)) || localZh[0] || zh.find(v => !/google|online|network/i.test(v.name)) || zh[0] || vs.find(v => v.localService) || vs[0] || null; }
  function ttsLoadVoices() {
    const vs = speechSynthesis.getVoices(); if (!vs.length) return;
    tts.voice = ttsPickVoice(vs);
    ttsVoiceSel.innerHTML = '';
    vs.forEach((v, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      const fullLabel = (v.localService ? '[本地] ' : '[在线] ') + v.name + ' (' + v.lang + ')';
      const nameChars = Array.from(v.name);
      const shortName = nameChars.length > 12 ? nameChars.slice(0, 11).join('') + '\u2026' : v.name;
      o.textContent = (v.localService ? '本·' : '网·') + shortName;
      o.title = fullLabel;
      o.style.cssText = 'background:#1c1c26;color:#fff;';
      ttsVoiceSel.appendChild(o);
    });
    try { const saved = localStorage.getItem(VOICE_STORAGE_KEY + location.hostname); if (saved) { const si = vs.findIndex(v => (v.voiceURI || v.name) === saved); if (si >= 0) tts.voice = vs[si]; } } catch (e) {}
    const zi = vs.indexOf(tts.voice); if (zi >= 0) ttsVoiceSel.value = String(zi);
  }
  function ttsWarmUp() {
    try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.getVoices(); } catch (e) {}
  }
  ttsRateInput.addEventListener('change', () => { let v = parseFloat(ttsRateInput.value); if (isNaN(v)) v = 2; tts.rate = Math.min(5, Math.max(0.5, v)); ttsRateInput.value = String(tts.rate); saveTtsRate(); });
  ttsVoiceSel.addEventListener('change', () => { const vs = speechSynthesis.getVoices(); const i = parseInt(ttsVoiceSel.value, 10); if (vs[i]) { tts.voice = vs[i]; try { localStorage.setItem(VOICE_STORAGE_KEY + location.hostname, vs[i].voiceURI || vs[i].name); } catch (e) {} if (tts.playing && !tts.paused) { speechSynthesis.cancel(); ttsSpeakCurrent(); } else { const u = new SpeechSynthesisUtterance('你好，这是朗读音色测试。'); if (tts.voice) u.voice = tts.voice; u.lang = (tts.voice && tts.voice.lang) || 'zh-CN'; u.rate = tts.rate; u.volume = 1; speechSynthesis.speak(u); } } });
  if (typeof speechSynthesis !== 'undefined') {
    ttsLoadVoices();
    try { speechSynthesis.addEventListener('voiceschanged', () => { ttsLoadVoices(); ttsWarmUp(); }); }
    catch (e) { speechSynthesis.onvoiceschanged = () => { ttsLoadVoices(); ttsWarmUp(); }; }
  }

  // ============================================================
  //  初始化
  // ============================================================
  loadConfig(); loadDelay(); loadSpaceKey(); loadAutoJump(); loadSpaceKeyTts(); loadAutoJumpTts(); loadTtsRate();
  try { const t = localStorage.getItem(TAB_STORAGE_KEY + location.hostname); if (t === 'scroll' || t === 'tts') activeTab = t; } catch (e) {}
  paintTabs();
  paintScrollBtn(); paintPlayBtn();
  applyLayout();
  restoreScrollState();
  restoreTtsState();
})();
