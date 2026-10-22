/* ============================================================
   星火之路 · 互动引擎 v2
   星火尾迹 + 冲击波光环 / 悬停与点击音效 / 屏幕震动 /
   HUD星火念珠（音阶上行）/ 湘江致哀计数 / 四渡步进 /
   泸定攀索（吱呀声+震动）/ 会师点火 / 于都火把 / 雪原篝火
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = [].slice.call(document.querySelectorAll('.panel'));

  /* ============ 一、星火特效画布（尾迹 + 迸溅 + 光环） ============ */
  var fx = document.getElementById('fx-canvas');
  var fctx = fx.getContext('2d');
  var parts = [];
  var rings = [];
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function fxResize() {
    fx.width = window.innerWidth * DPR;
    fx.height = window.innerHeight * DPR;
    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  fxResize();
  window.addEventListener('resize', fxResize);

  function spawn(x, y, n, strong) {
    if (reduced || parts.length > 200) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = (strong ? 1.6 : 0.5) * (0.6 + Math.random() * 1.8);
      parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (strong ? 1.2 : 0.8),
        life: 1,
        decay: strong ? 0.012 + Math.random() * 0.012 : 0.02 + Math.random() * 0.02,
        size: (strong ? 1.6 : 1) * (1 + Math.random() * 1.6),
        gold: Math.random() > 0.25
      });
    }
  }

  /* 冲击波光环 */
  function ring(x, y, big) {
    if (reduced) return;
    rings.push({ x: x, y: y, r: 6, vr: big ? 3.2 : 1.8, alpha: big ? 0.55 : 0.35 });
    if (big) rings.push({ x: x, y: y, r: 2, vr: 4.6, alpha: 0.3 });
  }

  /* 一束火苗（沿水平线） */
  function torchLine(x0, x1, y) {
    for (var i = 0; i < 14; i++) {
      var px = x0 + (x1 - x0) * (i / 13);
      spawn(px, y + (Math.random() - 0.5) * 10, 3, true);
    }
  }

  var lastMove = 0;
  window.addEventListener('pointermove', function (e) {
    var now = performance.now();
    if (now - lastMove < 34) return;
    lastMove = now;
    spawn(e.clientX, e.clientY, 2, false);
  }, { passive: true });

  window.addEventListener('pointerdown', function (e) {
    spawn(e.clientX, e.clientY, 16, true);
    ring(e.clientX, e.clientY, false);
    if (window.SFX) { SFX.fwoosh(); SFX.crackle(5); }
  }, { passive: true });

  function fxTick() {
    fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    /* 光环 */
    for (var r = rings.length - 1; r >= 0; r--) {
      var R = rings[r];
      R.r += R.vr * 1.6;
      R.alpha -= 0.012;
      if (R.alpha <= 0) { rings.splice(r, 1); continue; }
      fctx.beginPath();
      fctx.arc(R.x, R.y, R.r, 0, Math.PI * 2);
      fctx.strokeStyle = 'rgba(255,196,107,' + R.alpha.toFixed(3) + ')';
      fctx.lineWidth = 1.6;
      fctx.stroke();
    }
    /* 粒子 */
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.x += p.vx; p.y += p.vy;
      p.vy -= 0.008;
      p.vx *= 0.985;
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      var s = p.size * p.life;
      fctx.beginPath();
      fctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      fctx.fillStyle = p.gold
        ? 'rgba(255,196,107,' + (0.75 * p.life).toFixed(3) + ')'
        : 'rgba(232,90,45,' + (0.6 * p.life).toFixed(3) + ')';
      fctx.fill();
      fctx.beginPath();
      fctx.arc(p.x, p.y, s * 3, 0, Math.PI * 2);
      fctx.fillStyle = 'rgba(255,180,90,' + (0.08 * p.life).toFixed(3) + ')';
      fctx.fill();
    }
    requestAnimationFrame(fxTick);
  }
  if (!reduced) requestAnimationFrame(fxTick);

  /* ---------- 屏幕震动反馈 ---------- */
  function jolt(strong) {
    if (reduced) return;
    document.body.classList.remove('jolt', 'jolt-big');
    void document.body.getBoundingClientRect();
    document.body.classList.add(strong ? 'jolt-big' : 'jolt');
  }
  function rumble(on) {
    if (reduced) return;
    document.body.classList.toggle('rumbling', !!on);
  }

  /* ---------- 蓄力交互：按住蓄力 → 环形进度 → 满蓄触发 ----------
     把"点一下出粒子"的轻反馈，升级为有手感、有过程、有结果的物理操作：
     按住时火苗渐旺（环形进度+持续火星+声音），松手火苗回落，蓄满才点火。 */
  function holdCharge(el, opts) {
    var dur = opts.duration || 1100;
    var p = 0, holding = false, last = 0, done = false, sndAt = 0;
    var ringEl = document.createElement('i');
    ringEl.className = 'hc-ring';
    el.appendChild(ringEl);
    el.classList.add('hc-host');

    function setP(v) {
      p = v;
      ringEl.style.setProperty('--p', (v * 100).toFixed(1) + '%');
      el.style.setProperty('--hc', v.toFixed(2));
    }
    function frame(t) {
      var dt = last ? Math.min(t - last, 64) : 16;
      last = t;
      if (done) return;
      if (holding) {
        setP(Math.min(1, p + dt / dur));
        /* 蓄力中的持续火星与声音 */
        if (!reduced && Math.random() < 0.4) {
          var r = el.getBoundingClientRect();
          spawn(r.left + Math.random() * r.width, r.top + r.height * (0.2 + Math.random() * 0.5), 1, true);
        }
        if (t - sndAt > 170) {
          sndAt = t;
          if (window.SFX && SFX.isEnabled()) SFX.crackle(1);
        }
        if (opts.onProgress) opts.onProgress(p);
        if (p >= 1) {
          /* 蓄满一次：触发结果，环归零，可继续下一次蓄力（多次点火） */
          holding = false;
          el.classList.remove('charging');
          setP(0);
          if (opts.onComplete) opts.onComplete();
          if (done) return;
        }
      } else if (p > 0) {
        setP(Math.max(0, p - dt / (dur * 1.6)));   /* 松手火苗回落 */
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function start(e) {
      if (done || holding) return;
      /* 条件未满足时只给提示，不作蓄力、不出声，避免"错误提示音"的挫败感 */
      if (opts.canStart && !opts.canStart()) {
        if (opts.onBlocked) opts.onBlocked();
        return;
      }
      holding = true;
      el.classList.add('charging');
      if (opts.onStart) opts.onStart();
      if (window.SFX) SFX.warm();
      if (e && e.type === 'keydown') e.preventDefault();
    }
    function end() {
      if (!holding) return;
      holding = false;
      el.classList.remove('charging');
      if (p > 0.08 && opts.onRelease) opts.onRelease(p);
    }
    el.addEventListener('pointerdown', start);
    window.addEventListener('pointerup', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') start(e);
    });
    el.addEventListener('keyup', function (e) {
      if (e.key === 'Enter' || e.key === ' ') end();
    });
    return {
      finish: function () {   /* 供剧情强制触发（如三旗既点名后自动点火） */
        if (done) return;
        done = false; holding = false;
        el.classList.remove('charging');
        setP(0);
        if (opts.onComplete) opts.onComplete();
        done = true;
      },
      lock: function () {
        done = true; holding = false;
        el.classList.remove('charging');
        setP(0);
        if (ringEl.parentNode) ringEl.parentNode.removeChild(ringEl);
      }
    };
  }
  window.SparkHoldCharge = holdCharge;

  /* ---------- 场景印记：交互结果永久留在全屏画面上 ----------
     火把的光、雪原的篝火、会师的金辉——点过之后，山河记得。 */
  function stageMark(ch, x, y, cls) {
    var stage = document.querySelector('#ch' + ch + ' .ch-stage');
    if (!stage) return null;
    var m = document.createElement('i');
    m.className = 'stage-mark ' + cls;
    m.style.left = x + '%';
    m.style.top = y + '%';
    stage.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('in'); });
    var r = m.getBoundingClientRect();
    spawn(r.left + r.width / 2, r.top + r.height / 2, 12, true);
    ring(r.left + r.width / 2, r.top + r.height / 2, false);
    return m;
  }
  window.SparkStageMark = stageMark;

  /* ---------- 悬停轻响 ---------- */
  var hovered = null;
  document.addEventListener('pointerover', function (e) {
    var t = e.target.closest('.ix-btn, .ix-hold-btn, #audio-btn, #auto-btn, #map-btn, .mn, .hs-dot, .hero-cta');
    if (t && t !== hovered) {
      hovered = t;
      if (window.SFX) SFX.tick();
    } else if (!t) hovered = null;
  }, { passive: true });

  /* ============ 二、HUD 星火念珠（点亮即音阶上行） ============ */
  var sparkBox = document.getElementById('hud-sparks');
  var visited = {};
  for (var s = 0; s < sections.length; s++) {
    var si = document.createElement('i');
    sparkBox.appendChild(si);
  }
  var sparkEls = [].slice.call(sparkBox.children);

  /* ============ 三、章节感知（念珠 + 湘江计数） ============ */
  var jxSec = 0, jxTimer = null;
  var jxCountEl = document.getElementById('jx-count');
  var jxSecEl = document.getElementById('jx-sec');

  function activeChapter() {
    /* 场景模式：直接读当前章 */
    if (window.SparkCur != null) return window.SparkCur;
    var y = window.scrollY || window.pageYOffset;
    var center = y + window.innerHeight / 2;
    var best = Infinity, act = 0;
    for (var i = 0; i < sections.length; i++) {
      var mid = sections[i].offsetTop + sections[i].offsetHeight / 2;
      var d = Math.abs(mid - center);
      if (d < best) { best = d; act = i; }
    }
    return act;
  }

  function onChapter(act) {
    if (!visited[act]) {
      visited[act] = true;
      var el = sparkEls[act];
      if (el) {
        el.classList.add('lit');
        /* 念珠点亮：音阶上行 + 光环 */
        var r = el.getBoundingClientRect();
        spawn(r.left + r.width / 2, r.top + r.height / 2, 8, true);
        ring(r.left + r.width / 2, r.top + r.height / 2, false);
      }
      if (window.SFX) SFX.ding(act);
    }
    /* 湘江致哀计数：仅在第二章停留时运行（致哀语境，不配音效） */
    if (act === 2 && !jxTimer) {
      jxTimer = setInterval(function () {
        jxSec += 0.5;
        jxSecEl.textContent = Math.round(jxSec);
        jxCountEl.textContent = '+' + Math.round(jxSec * 50000 / (5 * 24 * 3600));
        jxCountEl.classList.remove('pulse');
        void jxCountEl.getBoundingClientRect();
        jxCountEl.classList.add('pulse');
        /* 心跳声：低哑、克制，随致哀计数一同搏动 */
        if (window.SFX && SFX.isEnabled()) SFX.heart();
      }, 500);
    } else if (act !== 2 && jxTimer) {
      clearInterval(jxTimer);
      jxTimer = null;
    }
  }

  var lastAct = -1;
  function watch() {
    var act = activeChapter();
    if (act !== lastAct) { lastAct = act; onChapter(act); }
  }
  window.addEventListener('scroll', watch, { passive: true });
  window.addEventListener('load', watch);
  window.SparkSceneWatch = watch;   /* 场景引擎换幕时调用 */
  watch();

  /* ============ 四、四渡赤水 · 步进重演 ============ */
  var siduSvg = document.getElementById('sidu-svg');
  var siduCtl = document.getElementById('sidu-ctl');
  var siduStatus = document.getElementById('sidu-status');
  var SIDU_INFO = {
    1: '一渡 · 1月29日，土城浑溪口西渡，摆脱川军堵截',
    2: '二渡 · 2月18—21日，太平渡、二郎滩东渡，回师黔北',
    3: '三渡 · 3月16—17日，茅台西渡，再入川南佯动',
    4: '四渡 · 3月21—22日，二郎滩秘密东渡，挥师南下——跳出重围！'
  };

  var siduShown = 0;
  function addSiduFlow(cross) {
    var line = cross.querySelector('.c-line');
    if (!line) return;
    var flow = line.cloneNode(false);
    flow.setAttribute('class', 'c-flow');
    cross.insertBefore(flow, cross.querySelector('.c-head'));
  }
  function addSiduRipple(cross) {
    var line = cross.querySelector('.c-line');
    if (!line || !line.getTotalLength) return;
    var pt = line.getPointAtLength(line.getTotalLength());
    var NS = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 2; i++) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', pt.x);
      c.setAttribute('cy', pt.y);
      c.setAttribute('r', '5');
      c.setAttribute('class', 'c-ripple');
      c.style.animationDelay = (i * 0.18) + 's';
      cross.appendChild(c);
      (function (el) {
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
      })(c);
    }
  }
  siduCtl.addEventListener('click', function (e) {
    var btn = e.target.closest('.ix-btn');
    if (!btn || !siduSvg) return;
    var x = btn.getAttribute('data-x');
    var cross = siduSvg.querySelector('.cross[data-i="' + (x - 1) + '"]');
    btn.classList.add('on');
    /* 只让点过的那一渡出现；已渡过的路线保留，形成逐渡叠加的行程 */
    if (cross && !cross.classList.contains('show')) {
      cross.classList.add('show');
      addSiduFlow(cross);
      addSiduRipple(cross);
      siduShown++;
    }
    if (siduShown >= 4) siduSvg.classList.add('all');
    siduStatus.textContent = SIDU_INFO[x];
    siduStatus.classList.add('done');
    /* 部队真的在渡河：一枚红军光点沿本渡路线推进，渡毕在彼岸留下一枚渡痕 */
    var cLine = siduSvg.querySelector('.cross[data-i="' + (x - 1) + '"] .c-line');
    if (cLine) {
      var NS = 'http://www.w3.org/2000/svg';
      var troop = document.createElementNS(NS, 'circle');
      troop.setAttribute('r', '4.5');
      troop.setAttribute('class', 'sd-troop');
      var am = document.createElementNS(NS, 'animateMotion');
      am.setAttribute('dur', '0.9s');
      am.setAttribute('fill', 'freeze');
      am.setAttribute('path', cLine.getAttribute('d'));
      troop.appendChild(am);
      siduSvg.appendChild(troop);
      setTimeout(function () {
        troop.classList.add('landed');
        setTimeout(function () { if (troop.parentNode) troop.parentNode.removeChild(troop); }, 1400);
      }, 950);
    }
    /* 四渡完成：图卷化作影像 */
    if (x === '4' && window.SparkReward) SparkReward(4);
    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    spawn(cx, cy, 10, true);
    ring(cx, cy, false);
    if (window.SFX) SFX.pluck(520 + x * 62);
  });

  /* ============ 五、泸定桥 · 按住攀索（长按/连点 + 吱呀声 + 震动） ============ */
  var holdBtn = document.getElementById('hold-btn');
  var holdFill = document.getElementById('hold-fill');
  var holdStatus = document.getElementById('hold-status');
  var holding = false, holdP = 0, holdDone = false, holdLast = 0, pressStartP = 0, creakTimer = null;

  function holdFrame(t) {
    if (holding && !holdDone) {
      var dt = holdLast ? t - holdLast : 16;
      holdP = Math.min(1, holdP + dt / 4200);
      /* 攀索中的持续反馈：绳索晃动 + 手部火花 */
      if (Math.random() < 0.12) {
        var r = holdBtn.getBoundingClientRect();
        spawn(r.left + Math.random() * r.width, r.top + r.height, 1, true);
      }
    }
    if (!holdDone) holdFill.style.width = (holdP * 100).toFixed(1) + '%';
    if (holdP >= 1 && !holdDone) {
      holdDone = true;
      holding = false;
      clearInterval(creakTimer);
      holdBtn.classList.remove('holding');
      holdBtn.classList.add('done');
      holdBtn.textContent = '夺 桥 成 功';
      holdStatus.textContent = '你与二十二名勇士一起，抵达了对岸';
      holdStatus.classList.add('done');
      rumble(false);
      jolt(true);
      if (window.SparkReward) SparkReward(5);
      var r2 = holdBtn.getBoundingClientRect();
      var cx = r2.left + r2.width / 2, cy = r2.top + r2.height / 2;
      spawn(cx, cy, 30, true);
      ring(cx, cy, true);
      if (window.SFX) SFX.chime(true);
    }
    holdLast = t;
    requestAnimationFrame(holdFrame);
  }
  requestAnimationFrame(holdFrame);

  function holdStart(e) {
    if (holdDone) return;
    holding = true;
    pressStartP = holdP;
    holdBtn.classList.add('holding');
    holdStatus.textContent = '攀住铁索了……稳住，别回头';
    rumble(true);
    clearInterval(creakTimer);
    creakTimer = setInterval(function () {
      if (window.SFX) SFX.creak();
    }, 620);
    if (e && e.type === 'keydown') e.preventDefault();
  }
  function holdEnd() {
    if (holdDone || !holding) return;
    holding = false;
    clearInterval(creakTimer);
    holdBtn.classList.remove('holding');
    rumble(false);
    if (holdP < 1) holdStatus.textContent = '松手了。勇士们还挂在索上，再按住试试';
  }
  if (holdBtn) {
    holdBtn.addEventListener('pointerdown', holdStart);
    window.addEventListener('pointerup', holdEnd);
    holdBtn.addEventListener('pointerleave', holdEnd);
    holdBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') holdStart(e);
    });
    holdBtn.addEventListener('keyup', function (e) {
      if (e.key === 'Enter' || e.key === ' ') holdEnd();
    });
    holdBtn.addEventListener('click', function () {
      if (holdDone) return;
      holdP = Math.min(1, holdP + 0.16);
      holdStatus.textContent = '好一把火候！再点再进，或长按不放';
      var br = holdBtn.getBoundingClientRect();
      var cx = br.left + br.width / 2, cy = br.top + br.height / 2;
      spawn(cx, cy, 8, true);
      ring(cx, cy, false);
      if (window.SFX) SFX.pluck(440 + holdP * 260);
    });
  }

  /* ============ 六、会师 · 点燃会师之火（蓄力点火，金辉永驻高原） ============ */
  var celebBtn = document.getElementById('celebrate-btn');
  var celebDone = false;
  function celebStatus(txt, doneCls) {
    var st = celebBtn && celebBtn.parentElement.querySelector('.ix-status');
    if (st) { st.textContent = txt; if (doneCls) st.classList.add('done'); }
  }
  if (celebBtn) {
    celebBtn.classList.add('locked');
    var celebHold = holdCharge(celebBtn, {
      duration: 1500,
      canStart: function () { return (window.SparkFlagsLit || 0) >= 3; },
      onBlocked: function () { celebStatus('先点亮三面军旗，再点燃会师之火'); },
      onStart: function () { if (!celebDone) celebStatus('火把凑近篝火堆了……稳住，别松'); },
      onRelease: function () { if (!celebDone) celebStatus('火苗熄了。三军还在等——再蓄一次力'); },
      onComplete: function () {
        if (celebDone) return;
        celebDone = true;
        celebHold.lock();
        celebBtn.classList.remove('urge', 'locked');   /* 催促脉冲退场，避免与 .on 同色吞字 */
        celebBtn.classList.add('on');
        var r = celebBtn.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        spawn(cx, cy, 24, true);
        ring(cx, cy, true);
        setTimeout(function () { spawn(cx - 90, cy - 40, 14, true); ring(cx - 90, cy - 40, false); }, 160);
        setTimeout(function () { spawn(cx + 90, cy - 60, 14, true); ring(cx + 90, cy - 60, false); }, 320);
        if (window.SFX) { SFX.fwoosh(); SFX.crackle(8); }
        jolt(false);
        /* 场景印记：会师金辉自高原升起，三堆篝火连成一片 */
        stageMark(7, 50, 50, 'mark-glory');
        setTimeout(function () { stageMark(7, 30, 62, 'mark-fire'); }, 350);
        setTimeout(function () { stageMark(7, 70, 60, 'mark-fire'); }, 700);
        if (window.SparkReward) SparkReward(7);
        celebStatus('三军既会，星火已连成一片', true);
        /* 点火完成即停住自动行军：结果块与"到达下一站"留给用户自己决定 */
        if (window.SparkCancelAuto) window.SparkCancelAuto();
        setTimeout(function () { if (window.SFX) SFX.chime(true); }, 500);
      }
    });
    /* 三旗点名完毕：催促点火（脉冲），由用户亲手蓄力点燃 */
    window.SparkCelebUrge = function () {
      celebBtn.classList.remove('locked');
      celebBtn.classList.add('urge');
      celebStatus('三军既会——按住点火！');
    };
  }

  /* ============ 七、于都 · 点起火把（蓄力一支、河面亮一处，光留在水上） ============ */
  var torchBtn = document.getElementById('torch-btn');
  var torchStatus = document.getElementById('torch-status');
  var torchN = 0;
  var TORCH_POS = [[16, 64], [33, 60], [50, 66], [67, 61], [83, 66]];
  var TORCH_STEPS = [
    '第一支火把亮了……河面上有了光',
    '第二支。桥影被火光拉长',
    '第三支。浮桥的轮廓清晰起来',
    '第四支。于都河醒了',
    '五座浮桥全部点亮——大军，可以出发了'
  ];
  if (torchBtn) {
    var torchHold = holdCharge(torchBtn, {
      duration: 950,
      onStart: function () {
        if (torchN < 5 && torchStatus) torchStatus.textContent = '火绒正在发烫……按住，别松';
      },
      onRelease: function () {
        if (torchN < 5 && torchStatus) torchStatus.textContent = '火苗熄了。河面还黑着——再蓄一次力';
      },
      onComplete: function () {
        if (torchN >= 5) { torchHold.lock(); return; }
        var pos = TORCH_POS[torchN];
        stageMark(1, pos[0], pos[1], 'mark-torch');
        torchN++;
        if (window.SFX) SFX.crackle(4);
        torchStatus.textContent = TORCH_STEPS[torchN - 1];
        if (torchN >= 5) {
          torchHold.lock();
          torchStatus.classList.add('done');
          torchBtn.classList.add('on');
          /* 满河火把：河面整条亮起暖光带 */
          stageMark(1, 50, 63, 'mark-riverglow');
          jolt(false);
          if (window.SparkReward) SparkReward(1);
          setTimeout(function () { if (window.SFX) SFX.chime(false); }, 350);
        }
      }
    });
  }

  /* ============ 八、雪原 · 为战友生火（蓄力揉燃，篝火留在雪线上） ============ */
  var fireBtn = document.getElementById('fire-btn');
  var fireStatus = document.getElementById('fire-status');
  var fireN = 0;
  var FIRE_POS = [[28, 72], [50, 76], [70, 69]];
  var FIRE_STEPS = [
    '第一堆篝火燃起来了。雪粒还在落，火却很稳',
    '又一堆。雪线上有了暖意',
    '火光连成了一小片——足够战士们熬过今夜'
  ];
  if (fireBtn) {
    var fireHold = holdCharge(fireBtn, {
      duration: 1100,
      onStart: function () {
        if (fireN < 3 && fireStatus) fireStatus.textContent = '火石相击，火星溅进绒草……稳住';
      },
      onRelease: function () {
        if (fireN < 3 && fireStatus) fireStatus.textContent = '火星暗了。风雪还在——再蓄一次力';
      },
      onComplete: function () {
        if (fireN >= 3) { fireHold.lock(); return; }
        var pos = FIRE_POS[fireN];
        stageMark(6, pos[0], pos[1], 'mark-fire');
        fireN++;
        if (window.SFX) SFX.crackle(6);
        fireStatus.textContent = FIRE_STEPS[fireN - 1];
        if (fireN >= 3) {
          fireHold.lock();
          fireStatus.classList.add('done');
          fireBtn.classList.add('on');
          jolt(false);
          if (window.SparkReward) SparkReward(6);
          setTimeout(function () { if (window.SFX) SFX.chime(false); }, 350);
        }
      }
    });
  }

  /* 对外暴露 */
  window.SparkFX = { burst: spawn, ring: ring, jolt: jolt };
})();
