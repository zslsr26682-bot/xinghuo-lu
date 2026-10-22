/* ============================================================
   星火之路 · 场景引擎 v9（全屏场景模式）
   一屏一幕 · 章内分步推进 · 行军转场（鼓+路线条）
   全屏影像主视觉 · 交互奖励影像 · 滚轮/键盘/触控翻幕
   ============================================================ */
(function () {
  'use strict';

  window.SPARK_SCENE = true;   /* 供 explore.js / interaction.js 感知场景模式 */

  var canvas = document.getElementById('scene-canvas');
  var labelRoot = document.getElementById('labels');
  var scene3d = new SparkScene(canvas, labelRoot);

  /* 配乐引擎 */
  var music = new MarchMusic();
  var audioBtn = document.getElementById('audio-btn');
  var audioInited = false;

  var sections = [].slice.call(document.querySelectorAll('.panel'));
  var N = sections.length;
  var hud = document.getElementById('hud');
  var hudDots = document.getElementById('hud-dots');
  var mileNow = document.getElementById('mile-now');
  var mileFill = document.getElementById('mile-fill');
  var mapBtn = document.getElementById('map-btn');
  var autoBtn = document.getElementById('auto-btn');
  var startBtn = document.getElementById('start-btn');
  var TOTAL_LI = 25000;

  var STATIONS = ['封面', '出发 · 于都', '血战湘江', '遵义转折', '四渡赤水', '飞夺泸定桥', '雪山草地', '三军会师', '数据长卷', '结语'];

  /* 各章 3D 路线进度（对应 scene.js 运镜）与图面进度（地图/里程） */
  var CH_U = [0, 0, 0.13, 0.30, 0.42, 0.56, 0.70, 0.985, 1, 1];
  var CH_F = [0, 0.02, 0.15, 0.30, 0.45, 0.65, 0.82, 1, 1, 1];

  /* 各章全屏背景影像与字幕 */
  var CH_VIDEO = {
    1: { src: 'assets/video/v1_yudu.mp4', cap: '夜渡于都河 · 意象影像' },
    2: { src: 'assets/video/v6_xiangjiang.mp4', cap: '湘江血战 · 意象影像' },
    3: { src: 'assets/video/v4_zunyi.mp4', cap: '遵义灯火 · 意象影像' },
    4: { src: 'assets/video/v7_chishui.mp4', cap: '四渡赤水 · 意象影像' },
    5: { src: 'assets/video/v5_luding.mp4', cap: '铁索寒 · 意象影像' },
    6: { src: 'assets/video/v2_snow.mp4', cap: '风雪行军 · 意象影像' },
    7: { src: 'assets/video/v3_flag.mp4', cap: '会师之晨 · 意象影像' },
    8: { src: 'assets/video/v8_huimou.mp4', cap: '山河回望 · 意象影像' }
  };

  /* 章内步骤编排（选择器组 / 影像步 / 今昔步） */
  var STEPS = {
    1: [['.ch-lead'], ['.ch-detail'], ['.ch-verse', '.metric-line'], ['.side-note'], ['.family-letter'], { video: 1 }, ['#yudu-ix'], { pastnow: 1 }],
    2: [['.ch-lead'], ['.ch-detail'], ['.metric-line'], ['#burden-ix'], ['#jx-tick'], ['.side-note', '.ch-quote'], ['#lantern-ix'], { video: 1 }, { pastnow: 2 }],
    3: [['.ch-lead'], ['.ch-detail'], ['.ch-verse', '.metric-line'], ['.side-note'], { video: 1 }, ['#route-ix'], ['.quiz-block'], { pastnow: 3 }],
    4: [['.ch-lead'], ['.ch-detail'], ['.duo-metrics'], ['#sidu-svg', '#sidu-ctl'], ['.side-note'], { video: 1 }, { pastnow: 4 }],
    5: [['.ch-lead'], ['.ch-detail'], ['.ch-verse', '.trio-metrics'], ['#luding-hold'], ['.side-note'], { video: 1 }, ['.quiz-block'], { pastnow: 5 }],
    6: [['.ch-lead'], ['.ch-detail'], { video: 1 }, ['.ch-verse', '.duo-metrics'], ['.side-note'], ['#coat-ix'], ['#snow-ix'], { pastnow: 6 }],
    7: [['.ch-lead'], ['.ch-detail'], { video: 1 }, ['.date-big'], ['.poem-full'], ['.side-note'], ['.quiz-block'], ['#huishi-ix'], { pastnow: 7 }],
    8: [{ video: 1 }, ['.dw-grid'], ['.dw-note']],
    9: [['.end-quote'], ['.end-sub', '.finale-line'], ['.cert-launch'], ['.site-foot']]
  };

  /* 今昔同框：同一坐标，不同时间（当年/今天分栏，避免文字堆叠） */
  var PASTNOW = {
    1: { old: '于都河上，浮桥夜架，八万大军悄悄西去。', now: '于都河畔，大桥飞架，灯火万家，孩子在公园奔跑。' },
    2: { old: '湘江水赤，五万将士长眠于此。', now: '稻浪千重，两岸安宁，松柏守着当年的渡口。' },
    3: { old: '小楼灯火彻夜不熄，革命航向由此重定。', now: '会址仍在，子尹路上车水马龙，小楼看着城市长大。' },
    4: { old: '赤水河上，红军忽东忽西，牵着追兵兜圈。', now: '旅游公路沿河蜿蜒，"美酒河"飘香四海。' },
    5: { old: '十三根寒光铁索，二十二勇士冒死攀夺。', now: '铁索仍在，新桥并立，车流不息——这是先辈换来的土地。' },
    6: { old: '雪线之上，草鞋单衣，一步一喘。', now: '公路贯通雪山，草原风电列阵，车轮飞驰。' },
    7: { old: '三支铁流会师，衣衫褴褛却信念如铁。', now: '会师塔下书声琅琅，高铁掠过换绿的黄土高原。' }
  };
  var PASTNOW_IMG = {
    1: 'assets/img/now/ch1_now.jpg', 2: 'assets/img/now/ch2_now.jpg', 3: 'assets/img/now/ch3_now.jpg',
    4: 'assets/img/now/ch4_now.jpg', 5: 'assets/img/now/ch5_now.jpg', 6: 'assets/img/now/ch6_now.jpg',
    7: 'assets/img/now/ch7_now.jpg'
  };
  function setPastNow(sec, ch) {
    var layer = sec._pnLayer;
    if (!ch) {
      if (layer) layer.classList.remove('on');
      sec.classList.remove('pn-on');
      var lc0 = sec.querySelector('.pn-livecap');
      if (lc0) lc0.style.display = 'none';
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pn-layer';
      layer.innerHTML = '<img class="pnl-now" alt="今天">' +
        '<div class="pnl-divider"><i>⇔</i></div>' +
        '<span class="pnl-l-old">当年</span><span class="pnl-l-new">今天</span>' +
        '<div class="pn-cap pn-cap-old"></div><div class="pn-cap pn-cap-new"></div>' +
        '<div class="pn-hint">拖动金色分隔条 · 对比当年与今天</div>';
      sec.appendChild(layer);
      sec._pnLayer = layer;
      var nowImg = layer.querySelector('.pnl-now');
      var div = layer.querySelector('.pnl-divider');
      var capOld = layer.querySelector('.pn-cap-old');
      var capNew = layer.querySelector('.pn-cap-new');
      var drag = false;
      function applyPct(pct) {
        pct = Math.max(4, Math.min(96, pct));
        nowImg.style.clipPath = 'inset(0 0 0 ' + pct.toFixed(1) + '%)';
        div.style.left = pct.toFixed(1) + '%';
        /* 文字随拖动位置渐变：当年侧露得多则旧文字显，今天侧露得多则新文字显 */
        var oldOp = Math.min(1, Math.max(0, (pct - 8) / 44));   /* pct=8→0, pct=52→1 */
        var newOp = Math.min(1, Math.max(0, (92 - pct) / 44));  /* pct=92→0, pct=48→1 */
        capOld.style.opacity = oldOp.toFixed(2);
        capNew.style.opacity = newOp.toFixed(2);
        capOld.style.transform = 'translateY(' + (12 * (1 - oldOp)).toFixed(0) + 'px)';
        capNew.style.transform = 'translateY(' + (12 * (1 - newOp)).toFixed(0) + 'px)';
        /* 边缘标签同步淡出：拖到今天侧"当年"标签隐去，拖到当年侧"今天"标签隐去 */
        var lOld = layer.querySelector('.pnl-l-old');
        var lNew = layer.querySelector('.pnl-l-new');
        if (lOld) lOld.style.opacity = Math.min(1, Math.max(0, (pct - 26) / 30)).toFixed(2);
        if (lNew) lNew.style.opacity = Math.min(1, Math.max(0, (74 - pct) / 30)).toFixed(2);
      }
      function move(e) {
        var r = sec.getBoundingClientRect();
        var pct = (e.clientX - r.left) / r.width * 100;
        applyPct(pct);
      }
      layer.addEventListener('pointerdown', function (e) { drag = true; move(e); e.preventDefault(); });
      window.addEventListener('pointerup', function () { drag = false; });
      window.addEventListener('pointermove', function (e) { if (drag && sec.classList.contains('current')) move(e); });
    }
    layer.querySelector('.pnl-now').src = PASTNOW_IMG[ch];
    layer.querySelector('.pn-cap-old').textContent = PASTNOW[ch].old;
    layer.querySelector('.pn-cap-new').textContent = PASTNOW[ch].now;
    sec.classList.add('pn-on');
    layer.classList.add('on');
    /* 揭示：从全"当年"缓缓拉开，露出今天 */
    var img2 = layer.querySelector('.pnl-now');
    var div2 = layer.querySelector('.pnl-divider');
    img2.style.transition = 'none'; div2.style.transition = 'none';
    img2.style.clipPath = 'inset(0 0 0 100%)'; div2.style.left = '100%';
    layer.querySelector('.pn-cap-old').style.opacity = 1;
    layer.querySelector('.pn-cap-new').style.opacity = 0;
    void img2.offsetWidth;
    setTimeout(function () {
      img2.style.transition = 'clip-path 2.4s cubic-bezier(.25,.7,.2,1)';
      div2.style.transition = 'left 2.4s cubic-bezier(.25,.7,.2,1)';
      img2.style.clipPath = 'inset(0 0 0 50%)'; div2.style.left = '50%';
      /* 文字随揭示动画同步淡入 */
      var capO = layer.querySelector('.pn-cap-old');
      var capN = layer.querySelector('.pn-cap-new');
      capO.style.transition = 'opacity 2.4s ease, transform 2.4s ease';
      capN.style.transition = 'opacity 2.4s ease, transform 2.4s ease';
      capO.style.opacity = 1; capO.style.transform = 'none';
      capN.style.opacity = 1; capN.style.transform = 'none';
      var lO = layer.querySelector('.pnl-l-old'), lN = layer.querySelector('.pnl-l-new');
      if (lO) { lO.style.transition = 'opacity 2.4s ease'; lO.style.opacity = 1; }
      if (lN) { lN.style.transition = 'opacity 2.4s ease'; lN.style.opacity = 1; }
      setTimeout(function () {
        img2.style.transition = ''; div2.style.transition = '';
        capO.style.transition = ''; capN.style.transition = '';
        if (lO) lO.style.transition = '';
        if (lN) lN.style.transition = '';
      }, 2500);
    }, 420);
    /* 移除旧的混合字幕（如有残留） */
    var oldCap = sec.querySelector('.pn-livecap');
    if (oldCap) oldCap.style.display = 'none';
  }

  var cur = 0, stepIdx = 0, transitioning = false;
  var panelsSteps = {};
  var steps = [];
  window.SparkCur = 0;

  /* 交互步骤 → 完成选择器（自动行军遇到这些步骤会暂停，等完成后继续） */
  var IX_DONE = {
    '#yudu-ix': '#torch-btn.on',
    '.family-letter': '.family-letter.read',
    '#burden-ix': '#bi-result:not([hidden])',
    '#lantern-ix': '#lantern-btn.on',
    '#route-ix': '.rt-card.good.lit',
    '#sidu-ctl': '#sidu-ctl .ix-btn[data-x="4"].on',
    '#luding-hold': '#hold-btn.done',
    '.quiz-block': '.qz-opt.on',
    '#coat-ix': '.co-opt.on',
    '#snow-ix': '#fire-btn.on',
    '#huishi-ix': '#celebrate-btn.on'
  };

  /* ---------- 数字滚动 ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.dataset.count) || 0;
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var dur = 1600, t0 = null;
    function fmt(n) { return prefix + Math.round(n).toLocaleString('en-US') + suffix; }
    function step(t) {
      if (!t0) t0 = t;
      var f = Math.min(1, (t - t0) / dur);
      f = 1 - Math.pow(1 - f, 3);
      el.textContent = fmt(target * f);
      if (f < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- HUD 章节点 ---------- */
  var dots = [];
  sections.forEach(function (sec, i) {
    var d = document.createElement('div');
    d.className = 'hd';
    d.title = STATIONS[i] || '';
    d.addEventListener('click', function () { stopAuto(); goToChapter(i); });
    hudDots.appendChild(d);
    dots.push(d);
  });

  /* ============================================================
     场景搭建：章节头移至左上 / 步骤标记 / 全屏影像
     ============================================================ */
  sections.forEach(function (sec, idx) {
    var story = sec.querySelector('.story');
    if (story) {
      var head = document.createElement('div');
      head.className = 'scene-head';
      var sh = story.querySelector('.story-head');
      var title = story.querySelector('.ch-title');
      if (sh) head.appendChild(sh);
      if (title) head.appendChild(title);
      if (head.children.length) sec.appendChild(head);
      /* 图卷移出卡片，直接铺满全屏 */
      [].forEach.call(story.querySelectorAll('.ch-visual'), function (f) { sec.insertBefore(f, story); });
    }
    /* 结语大图同样铺底 */
    var endInner = sec.querySelector('.end-inner');
    if (endInner) {
      [].forEach.call(endInner.querySelectorAll('.end-figure'), function (f) { sec.insertBefore(f, endInner); });
    }
    /* 步骤元素 */
    var defs = STEPS[idx] || [];
    panelsSteps[idx] = defs.map(function (def) {
      if (def.video) return { video: true, els: [] };
      if (def.pastnow) return { pastnow: def.pastnow, els: [] };
      var els = def.map(function (sel) { return sec.querySelector(sel); }).filter(Boolean);
      els.forEach(function (el) { el.classList.add('scene-el'); });
      /* 检测是否为交互步骤：步骤内任一选择器在 IX_DONE 中 */
      var interactive = false, doneSel = null;
      for (var k = 0; k < def.length; k++) {
        if (IX_DONE[def[k]]) { interactive = true; doneSel = IX_DONE[def[k]]; break; }
      }
      return { els: els, interactive: interactive, doneSel: doneSel };
    });
    /* 全屏背景影像 */
    var cv = CH_VIDEO[idx];
    if (cv) {
      var v = document.createElement('video');
      v.className = 'scene-video';
      v.src = cv.src;
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      sec.appendChild(v);
      var cap = document.createElement('div');
      cap.className = 'scene-vcap';
      cap.textContent = cv.cap;
      sec.appendChild(cap);
      sec._sceneVideo = v;
    }
    /* 独立影像框退场（由全屏影像取代），图卷取消 reveal 依赖 */
    [].forEach.call(sec.querySelectorAll('.ch-video'), function (f) { f.style.display = 'none'; });
    [].forEach.call(sec.querySelectorAll('.ch-visual, .end-figure'), function (f) { f.classList.remove('reveal'); });
    /* 全屏主视觉需立即加载（场景模式无懒加载收益） */
    [].forEach.call(sec.querySelectorAll('.ch-visual img, .end-figure img'), function (im) { im.loading = 'eager'; });
    /* 未编入步骤的 reveal 元素（如数据长卷词卡）改为常显 */
    [].forEach.call(sec.querySelectorAll('.reveal:not(.scene-el)'), function (el) { el.classList.remove('reveal'); });
  });

  /* ---------- 全屏影像开关（真正出帧后才交叉淡入，杜绝黑屏） ---------- */
  function setSceneVideo(sec, on) {
    var v = sec._sceneVideo;
    if (!v) return;
    if (on) {
      v._want = true;
      if (!v._bound) {
        v._bound = true;
        v.addEventListener('playing', function () {
          v._ready = true;
          if (v._want) sec.classList.add('video-on');
        });
        v.addEventListener('pause', function () { v._ready = false; });
      }
      if (v._ready) sec.classList.add('video-on');
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    } else {
      v._want = false;
      sec.classList.remove('video-on');
      v.pause();
    }
  }
  /* 互动奖励：本章影像常驻 */
  window.SparkSceneVideo = function (ch) {
    var sec = sections[ch];
    if (!sec || !sec._sceneVideo) return;
    sec._vidSticky = true;
    if (cur === ch) setSceneVideo(sec, true);
  };

  /* ============================================================
     步骤渲染 / 场景控制条
     ============================================================ */
  var ctl = document.createElement('div');
  ctl.id = 'scene-ctl';
  ctl.innerHTML =
    '<div class="sc-btn" id="sc-prev" role="button" tabindex="0" aria-label="上一步">◂</div>' +
    '<div class="sc-mid"><div class="sc-dots"></div><div class="sc-cap"></div></div>' +
    '<div class="sc-btn sc-main" id="sc-next" role="button" tabindex="0" aria-label="下一步">继续 ▸</div>';
  document.body.appendChild(ctl);
  var ctlDots = ctl.querySelector('.sc-dots');
  var ctlCap = ctl.querySelector('.sc-cap');
  var ctlNext = ctl.querySelector('#sc-next');

  function renderStep(silent) {
    var sec = sections[cur];
    [].forEach.call(sec.querySelectorAll('.scene-el'), function (el) { el.classList.remove('on'); });
    var st = steps[stepIdx];
    if (st && st.els) {
      st.els.forEach(function (el, i) {
        el.classList.add('on');
        el.style.animationDelay = (i * 0.16) + 's';
        /* 数字在亮相时滚动 */
        [].forEach.call(el.querySelectorAll('.num[data-count]'), countUp);
      });
    }
    /* 今昔步：全屏对照接管画面；其余步收起 */
    var wantPN = !!(st && st.pastnow);
    setPastNow(sec, wantPN ? st.pastnow : 0);
    var wantVideo = wantPN ? false : (!!(st && st.video) || !!sec._vidSticky);
    setSceneVideo(sec, wantVideo);
    /* 字幕胶囊只在纯影像步出现；纯影像步收起空字幕带 */
    var hasText = !!(st && st.els && st.els.length) || wantPN;
    sec.classList.toggle('vcap-on', !!(st && st.video) && !hasText);
    var storyEl = sec.querySelector('.story');
    /* 今昔步：字幕带整体隐去（含上一步交互窗口残留），画面交还给当年/今天 */
    if (storyEl) storyEl.classList.toggle('empty', !hasText || wantPN);
    renderCtl();
    if (!silent && window.SFX) SFX.tick();
    /* v31 · 已读家书等元素隐去后，该步骤成空步：自动滑到下一步，不留空白 */
    if (st && st.els && st.els.length && !st.video && !st.pastnow && stepIdx < steps.length - 1) {
      var si = stepIdx, sc = sec;
      setTimeout(function () {
        if (cur !== sections.indexOf(sc) || stepIdx !== si || transitioning) return;
        var anyVisible = st.els.some(function (el) { return el.offsetParent !== null; });
        if (!anyVisible) setStep(si + 1, true);
      }, 80);
    }
  }

  function renderCtl() {
    var show = cur > 0;
    ctl.classList.toggle('show', show);
    if (!show) return;
    ctlDots.innerHTML = steps.map(function (_, i) {
      return '<i class="' + (i === stepIdx ? 'on' : (i < stepIdx ? 'done' : '')) + '" data-i="' + i + '"></i>';
    }).join('');
    var last = !steps.length || stepIdx >= steps.length - 1;
    if (last) {
      if (cur >= N - 1) {
        ctlCap.textContent = '行至终点 · 星火不灭';
        ctlNext.textContent = '重返出发 ▸';
      } else {
        ctlCap.textContent = '本站终了 · ' + STATIONS[cur];
        ctlNext.textContent = '到 达 下 一 站 ▸';
      }
      ctlNext.classList.add('chapter-end');
    } else {
      ctlCap.textContent = STATIONS[cur] + ' · ' + (stepIdx + 1) + ' / ' + steps.length;
      ctlNext.textContent = '继 续 ▸';
      ctlNext.classList.remove('chapter-end');
    }
  }

  ctl.querySelector('#sc-prev').addEventListener('click', function () { stopAuto(); prev(); });
  ctlNext.addEventListener('click', function () { stopAuto(); ctlNext.classList.remove('chapter-end'); next(); });
  ctlDots.addEventListener('click', function (e) {
    var t = e.target.closest('i');
    if (!t) return;
    stopAuto();
    setStep(+t.getAttribute('data-i'));
  });

  function setStep(i, silent) {
    if (transitioning || document.body.classList.contains('ov-lock')) return;
    steps = panelsSteps[cur] || [];
    if (!steps.length) return;
    stepIdx = Math.max(0, Math.min(steps.length - 1, i));
    renderStep(silent);
  }

  function next() {
    if (transitioning || document.body.classList.contains('ov-lock')) return;
    steps = panelsSteps[cur] || [];
    if (steps.length && stepIdx < steps.length - 1) { setStep(stepIdx + 1); return; }
    /* 章末：必须点击"到达下一站"才会进入下一章 */
    if (cur < N - 1) { goToChapter(cur + 1); return; }
    goToChapter(0);   /* 终点 → 重返出发 */
  }
  /* 章内是否还有步骤可推（供自动行军判断） */
  function hasNextStep() {
    steps = panelsSteps[cur] || [];
    return steps.length && stepIdx < steps.length - 1;
  }
  function prev() {
    if (transitioning || document.body.classList.contains('ov-lock')) return;
    if (stepIdx > 0) { setStep(stepIdx - 1); return; }
    if (cur > 0) goToChapter(cur - 1);
  }
  window.SparkGoTo = function (ch) { stopAuto(); goToChapter(ch); };

  /* ============================================================
     行军进度 / 里程 / 运镜补间
     ============================================================ */
  var TS = sections.map(function (_, i) { return i / (N - 1); });
  var camP = 0;

  function setProgress(f, u) {
    window.SparkRouteP = f;
    mileNow.textContent = Math.round(f * TOTAL_LI).toLocaleString('en-US');
    mileFill.style.width = (f * 100).toFixed(1) + '%';
    scene3d.setRouteProgress(u);
    if (window.SparkMapsSync) SparkMapsSync();
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function tween(dur, onStep, onEnd) {
    var t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var t = Math.min(1, (t - t0) / dur);
      onStep(easeInOut(t), t);
      if (t < 1) requestAnimationFrame(frame);
      else if (onEnd) onEnd();
    }
    requestAnimationFrame(frame);
  }

  /* 运镜常帧（呼吸漂移在 scene.js 内） */
  (function frameLoop() {
    scene3d.setFrame(camP, TS, cur);
    requestAnimationFrame(frameLoop);
  })();

  /* ============================================================
     章节切换（行军转场）
     ============================================================ */
  function goToChapter(idx, fromAuto) {
    idx = Math.max(0, Math.min(N - 1, idx));
    if (transitioning) return;
    if (idx === cur) { stepIdx = 0; steps = panelsSteps[idx] || []; renderStep(true); return; }
    var wantAuto = autoWanted;   /* 记录用户是否希望自动行军（即便章末已暂停） */
    if (!fromAuto) stopAuto();
    transitioning = true;
    var from = cur;
    cur = idx;
    window.SparkCur = idx;
    stepIdx = 0;
    steps = panelsSteps[idx] || [];

    showVeil(idx);

    /* v35 · 无缝转场：旧幕与新幕在转场幕下直接交叉淡入淡出，
       两者透明度互补（1-t 与 t），全程无空窗、无"卡一下再跳" */
    document.body.classList.add('flight');
    if (scene3d.setGhostRoute) scene3d.setGhostRoute(true);
    setTimeout(function () {
      var sec = sections[idx];
      sections[from].classList.remove('current');
      setSceneVideo(sections[from], false);
      setPastNow(sections[from], 0);
      /* 新幕影像同步预缓冲：影像步开始时首帧已就绪 */
      var pv = sec._sceneVideo;
      if (pv && !pv._ready) {
        pv.preload = 'auto';
        var pr0 = pv.play();
        if (pr0 && pr0.catch) pr0.catch(function () {});
      }
      /* 先让新幕背景完整绘制一帧，下一帧再挂内容动画，避免同步 DOM 阻塞首帧 */
      sec.classList.add('current', 'active');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          steps = panelsSteps[idx] || [];
          var svg = sec.querySelector('#sidu-svg');
          if (svg) svg.classList.add('play');
          if (idx === 9) {
            triggerAchieve();
            var endVid = sec.querySelector('.end-figure video');
            if (endVid) { var pr = endVid.play(); if (pr && pr.catch) pr.catch(function () {}); }
          }
          renderStep(true);
          updateHud();
          if (window.SparkSceneWatch) SparkSceneWatch();
        });
      });
    }, 380);

    /* 抵达联动分帧执行：配乐/氛围/旁白/粒子不挤在同一帧 */
    setTimeout(function () {
      document.body.classList.remove('flight');
      if (scene3d.setGhostRoute) scene3d.setGhostRoute(false);
      music.setChapter(idx);
      applyAtmosphere(idx);
    }, 1350);
    setTimeout(function () {
      if (window.SparkAmbientRefresh) SparkAmbientRefresh();
    }, 1500);
    setTimeout(function () {
      playVoice(idx);
      /* 章节氛围音效：号角/水流/风雪，强化情绪起伏 */
      if (window.SFX && SFX.isEnabled()) {
        if (idx === 1) { setTimeout(function(){ SFX.bugle(); }, 600); }
        else if (idx === 2 || idx === 4 || idx === 5) { SFX.water(8); }
        else if (idx === 6) { SFX.wind(9); }
        else if (idx === 7) { setTimeout(function(){ SFX.bugle(); }, 1200); SFX.crackle(8); }
        else if (idx === 9) { setTimeout(function(){ SFX.chime(true); }, 800); }
      }
    }, 1700);
    /* 空闲预载下一幕影像：保证"到达下一站"永远无缝 */
    setTimeout(function () {
      var nx = sections[idx + 1];
      if (nx && nx._sceneVideo && !nx._sceneVideo._ready) {
        nx._sceneVideo.preload = 'auto';
        nx._sceneVideo.load();
      }
    }, 2400);
    /* 若用户希望自动行军，进入新章后自动恢复（章末会再次停下） */
    if (wantAuto && idx > 0 && idx < N - 1) {
      setTimeout(startAuto, 2000);
    }

    /* 进度 / 里程 / 运镜 补间（1.9s，与交叉淡入淡出同节奏） */
    var f0 = CH_F[from], f1 = CH_F[idx];
    var u0 = CH_U[from], u1 = CH_U[idx];
    var p0 = from / (N - 1), p1 = idx / (N - 1);
    tween(1900, function (e) {
      setProgress(f0 + (f1 - f0) * e, u0 + (u1 - u0) * e);
      camP = p0 + (p1 - p0) * e;
    }, function () {
      setProgress(f1, u1);
      camP = p1;
    });

    setTimeout(function () { transitioning = false; }, 2000);
  }

  function updateHud() {
    var on = cur > 0;
    hud.classList.toggle('show', on);
    mapBtn.classList.toggle('show', on);
    autoBtn.classList.toggle('show', on || audioInited);
    dots.forEach(function (d, j) { d.classList.toggle('on', j === cur); });
  }

  /* ---------- 结语成就 ---------- */
  var achieved = false;
  function triggerAchieve() {
    if (achieved) return;
    achieved = true;
    var a = document.getElementById('achieve');
    a.hidden = false;
    requestAnimationFrame(function () { a.classList.add('show'); });
    if (window.SFX) setTimeout(function () { SFX.chime(true); }, 400);
    if (window.SparkFX) {
      SparkFX.jolt(true);
      var ar = a.getBoundingClientRect();
      SparkFX.burst(ar.left + ar.width / 2, ar.top + ar.height / 2, 26, true);
      SparkFX.ring(ar.left + ar.width / 2, ar.top + ar.height / 2, true);
    }
  }

  /* ============================================================
     输入：滚轮 / 触控 / 键盘
     ============================================================ */
  /* 当前幕内容可滚动时（字幕带/封面/长卷/结语），先让内容滚完再翻步 */
  function storyBlocks(e, dir) {
    var panel = e.target && e.target.closest ? e.target.closest('.panel.current') : null;
    if (!panel) return false;
    /* 优先用字幕带作为滚动容器（其自身 pointer-events 已穿透） */
    var sc = panel.querySelector('.story') || panel;
    if (sc.scrollHeight <= sc.clientHeight + 8) return false;
    var atTop = sc.scrollTop <= 1;
    var atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
    return (dir > 0 && !atBottom) || (dir < 0 && !atTop);
  }

  /* 滚动不再触发换章/换步——所有推进都由"继续/到达下一站"按钮或自动行军完成 */
  var wheelAt = 0;
  window.addEventListener('wheel', function (e) {
    if (document.body.classList.contains('ov-lock') || transitioning) return;
    /* 仅允许字幕带内部原生滚动，不再拦截换章 */
    var now = Date.now();
    if (now - wheelAt < 850) return;
    var d = e.deltaY || e.deltaX;
    if (Math.abs(d) < 12) return;
    wheelAt = now;
    /* 若点在可滚动容器（字幕带/结语/长卷/封面）上，交还给浏览器滚动；否则忽略（不做换章） */
    var tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.story, .ending, .datapanel, .hero')) return;
    e.preventDefault();
  }, { passive: false });

  var touchY = null, touchX = null;
  window.addEventListener('touchstart', function (e) {
    touchY = e.touches[0].clientY;
    touchX = e.touches[0].clientX;
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (touchY == null) return;
    var dy = touchY - e.changedTouches[0].clientY;
    var dx = touchX - e.changedTouches[0].clientX;
    touchY = touchX = null;
    if (document.body.classList.contains('ov-lock') || transitioning) return;
    /* 触摸滑动不再触发换章——所有推进交给按钮 */
    if (Math.max(Math.abs(dy), Math.abs(dx)) < 56) return;
    var tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.story')) return;
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('button, [role="button"], .hs-dot, .mn, input, textarea') : null;
    if (t) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].indexOf(e.key) >= 0) {
      if (document.body.classList.contains('ov-lock')) return;
      e.preventDefault(); stopAuto(); next();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].indexOf(e.key) >= 0) {
      if (document.body.classList.contains('ov-lock')) return;
      e.preventDefault(); stopAuto(); prev();
    }
  });

  /* ============================================================
     电影化层：行军转场幕（路线条） · 旁白 · 场景色调
     ============================================================ */
  var VEILS = {
    1: { k: '第壹章', p: '江西 · 于都', s: '一九三四年十月十七日 · 夜', f: 0.02, li: 0, n: '于都' },
    2: { k: '第贰章', p: '桂北 · 湘江', s: '一九三四年十二月', f: 0.15, li: 3750, n: '湘江' },
    3: { k: '第叁章', p: '黔北 · 遵义', s: '一九三五年一月', f: 0.30, li: 7500, n: '遵义' },
    4: { k: '第肆章', p: '川黔滇 · 赤水河', s: '一九三五年一月至三月', f: 0.45, li: 11250, n: '赤水' },
    5: { k: '第伍章', p: '川西 · 泸定桥', s: '一九三五年五月二十九日', f: 0.65, li: 16250, n: '泸定桥' },
    6: { k: '第陆章', p: '川西北 · 夹金山与草地', s: '一九三五年六月至八月', f: 0.82, li: 20500, n: '雪山草地' },
    7: { k: '第柒章', p: '陇东 · 将台堡', s: '一九三六年十月二十二日', f: 1, li: 25000, n: '会宁' },
    8: { k: '尾声', p: '二万五千里', s: '三百六十八天', f: 1, li: 25000, n: '全程' },
    9: { k: '终章', p: '星火不灭', s: '山河无恙', f: 1, li: 25000, n: '星火' }
  };
  var veilEl = document.getElementById('chapter-veil');
  var inkVeil = document.getElementById('ink-veil');
  var cvKicker = veilEl.querySelector('.cv-kicker');
  var cvPlace = veilEl.querySelector('.cv-place');
  var cvSub = veilEl.querySelector('.cv-sub');
  var cvrFill = veilEl.querySelector('.cvr-fill');
  var cvrTo = veilEl.querySelector('.cvr-to');
  var cvLi = veilEl.querySelector('.cv-li');
  var veilTimer = null;
  var lastVeilF = 0;

  function showVeil(ch) {
    var v = VEILS[ch];
    if (!v) return;
    cvKicker.textContent = v.k;
    cvPlace.textContent = v.p;
    cvSub.textContent = v.s;
    cvrTo.textContent = v.n;
    cvLi.textContent = ch === 1 ? '星火自此出发' : '已行 ' + v.li.toLocaleString('en-US') + ' 里';
    cvrFill.style.transition = 'none';
    cvrFill.style.width = (lastVeilF * 100).toFixed(1) + '%';
    void cvrFill.offsetWidth;
    cvrFill.style.transition = '';
    requestAnimationFrame(function () {
      cvrFill.style.width = (v.f * 100).toFixed(1) + '%';
    });
    lastVeilF = v.f;
    veilEl.classList.remove('show');
    inkVeil.classList.remove('pulse');
    void veilEl.getBoundingClientRect();
    veilEl.classList.add('show');
    inkVeil.classList.add('pulse');
    if (window.SFX) SFX.march();
    if (window.SparkFX) SparkFX.jolt(false);
    if (veilTimer) clearTimeout(veilTimer);
    veilTimer = setTimeout(function () { veilEl.classList.remove('show'); }, 2100);
  }

  /* ---------- 章节旁白 ---------- */
  var voiceCache = {};
  var curVoice = null;
  function playVoice(ch) {
    if (curVoice) { curVoice.pause(); curVoice = null; }
    if (!audioInited || !music.playing || !VEILS[ch]) return;
    if (!voiceCache[ch]) voiceCache[ch] = new Audio('assets/voice/v_ch' + ch + '.mp3');
    var a = voiceCache[ch];
    a.currentTime = 0;
    curVoice = a;
    music.duck(0.2);
    a.onended = function () { music.restore(); curVoice = null; };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function () { music.restore(); });
  }

  /* ---------- 场景色调 ---------- */
  function applyAtmosphere(ch) {
    if (scene3d.setAtmosphere) scene3d.setAtmosphere(ch);
  }

  /* ============================================================
     开始行军 / 配乐 / 自动行军
     ============================================================ */
  function ensureAudio() {
    if (!audioInited) {
      audioInited = true;
      music.begin();
      music.setChapter(cur);
      audioBtn.classList.add('show', 'playing');
      if (window.SFX) SFX.enable(true);
    }
  }
  function toggleMusic() {
    if (!audioInited) { ensureAudio(); updateHud(); return; }
    var on = music.toggle();
    audioBtn.classList.toggle('playing', !!on);
    if (window.SFX) SFX.enable(!!on);
  }
  audioBtn.addEventListener('click', toggleMusic);
  audioBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMusic(); }
  });

  startBtn.addEventListener('click', function () {
    /* 入伍登记先行，完成后由共情引擎回调正式行军 */
    if (window.SparkEnlist) { window.SparkEnlist(); return; }
    beginMarch();
  });
  startBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (window.SparkEnlist) { window.SparkEnlist(); return; }
      beginMarch();
    }
  });
  function beginMarch() {
    ensureAudio();
    goToChapter(1);
    setTimeout(startAuto, 2600);
  }
  window.SparkMarchBegin = beginMarch;

  /* 自动行军：章内每 5 秒推进一步；遇交互步骤暂停等完成；到章末等"到达下一站" */
  var autoOn = false, autoTimer = null, autoWanted = false;
  var ixWatch = null;   /* 交互完成轮询句柄 */
  function clearIXWatch() { if (ixWatch) { clearInterval(ixWatch); ixWatch = null; } }
  function startAuto() {
    if (autoOn) return;
    autoOn = true;
    autoWanted = true;   /* 记录用户希望自动行军 */
    autoBtn.classList.add('show', 'on');
    if (!audioInited) { ensureAudio(); updateHud(); }
    autoTimer = setInterval(function () {
      if (transitioning || document.body.classList.contains('ov-lock')) return;
      if (hasNextStep()) {
        setStep(stepIdx + 1);
        var st = steps[stepIdx];
        /* 若新步骤是未完成的交互步骤：停下等待；已完成（如重温家书）则顺畅通过 */
        if (st && st.interactive && st.doneSel && !document.querySelector(st.doneSel)) {
          stopAuto();
          waitIXDone(st);
        }
        return;
      }
      /* 已到章末：自动行军暂停，等待用户点击"到达下一站" */
      stopAuto();
      ctlNext.classList.add('chapter-end');
    }, 5000);
  }
  function stopAuto() {
    if (!autoOn) return;
    autoOn = false;
    autoBtn.classList.remove('on');
    clearInterval(autoTimer);
    clearIXWatch();
  }
  /* 轮询交互是否完成，完成后留 1.5 秒欣赏结果，再恢复自动行军 */
  function waitIXDone(st) {
    clearIXWatch();
    autoBtn.classList.add('waiting');   /* 视觉提示：等待交互 */
    ixWatch = setInterval(function () {
      if (transitioning) return;
      if (document.querySelector(st.doneSel)) {
        clearIXWatch();
        autoBtn.classList.remove('waiting');
        if (autoWanted) setTimeout(startAuto, 1500);
      }
    }, 350);
  }
  window.SparkResumeAuto = function () {
    /* 供交互完成时主动调用（可选，轮询已覆盖） */
    if (autoWanted && !autoOn) startAuto();
  };
  autoBtn.addEventListener('click', function () {
    if (autoOn) { autoWanted = false; stopAuto(); }
    else startAuto();
  });
  autoBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (autoOn) { autoWanted = false; stopAuto(); }
      else startAuto();
    }
  });

  /* ---------- 启动 ---------- */
  sections[0].classList.add('current', 'active');
  steps = panelsSteps[0] || [];
  var heroRoute = document.getElementById('route-sec');
  if (heroRoute) heroRoute.classList.add('in');
  setProgress(0, 0);
  updateHud();
  renderCtl();
  document.documentElement.classList.add('ready');
})();
