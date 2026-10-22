/* ============================================================
   星火之路 · 互动音效引擎（Web Audio 实时合成，无采样零版权）
   悬停轻响 / 点击拨弦 / 迸溅呼啸 / 转场鼓 / 攀索吱呀 /
   念珠音阶 / 成功琶音 / 火把篝火声 —— 全部程序合成
   ============================================================ */
(function () {
  'use strict';

  var ctx = null, master = null, noise = null;
  /* 默认关闭：与"行军配乐"开关联动，首次开启声音后生效 */
  var enabled = false;

  function ensure() {
    if (!enabled) return false;
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      master.connect(comp);
      comp.connect(ctx.destination);
      var len = ctx.sampleRate;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 基元 ---------- */
  function tone(freq, dur, vol, type, decay) {
    if (!ensure()) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (decay || 1));
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noiseBurst(dur, vol, f0, f1, q) {
    if (!ensure()) return;
    var t = ctx.currentTime;
    var s = ctx.createBufferSource();
    s.buffer = noise;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = q || 0.9;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  /* ---------- 音效库 ---------- */
  var SFX = {
    /* 总开关（与配乐开关联动） */
    enable: function (on) { enabled = !!on; if (on) ensure(); },
    isEnabled: function () { return enabled; },

    /* 悬停轻响 */
    tick: function () { tone(1560, 0.05, 0.035, 'sine', 0.6); },

    /* 点击拨弦 */
    pluck: function (f) { tone(f || 660, 0.22, 0.09, 'triangle', 0.9); },

    /* 火把/迸溅 呼啸 */
    fwoosh: function () { noiseBurst(0.42, 0.12, 900, 130, 0.7); },

    /* 火花噼啪 */
    crackle: function (n) {
      if (!ensure()) return;
      var t0 = ctx.currentTime;
      n = n || 6;
      for (var i = 0; i < n; i++) {
        var dt = 0.02 + Math.random() * 0.3;
        setTimeout(function (dt) {
          noiseBurst(0.05, 0.05 + Math.random() * 0.05, 2200 + Math.random() * 2500, 900, 2);
        }.bind(null, dt), dt * 1000);
      }
    },

    /* 转场大鼓 */
    boom: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(88, t);
      o.frequency.exponentialRampToValueAtTime(34, t + 0.5);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.9);
      noiseBurst(0.3, 0.1, 300, 60, 1.2);
    },

    /* 攀索吱呀（长按中） */
    creak: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(64 + Math.random() * 18, t);
      o.frequency.linearRampToValueAtTime(52 + Math.random() * 14, t + 0.14);
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = 5;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(bp); bp.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.2);
    },

    /* 念珠点亮：音阶逐级上行（十进制五声） */
    ding: function (step) {
      var steps = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      var f = 523.25 * Math.pow(2, steps[Math.min(step, steps.length - 1)] / 12);
      tone(f, 0.7, 0.08, 'sine', 2.2);
      tone(f * 2.76, 0.5, 0.02, 'sine', 2);
    },

    /* 成功琶音（夺桥/点火完成/成就） */
    chime: function (big) {
      if (!ensure()) return;
      var base = big ? 392 : 523.25;
      [1, 1.25, 1.5, big ? 2 : 1.875].forEach(function (mul, i) {
        setTimeout(function () {
          tone(base * mul, 1.1, 0.085, 'sine', 2.4);
          tone(base * mul * 2.76, 0.8, 0.02, 'sine', 2);
        }, i * 110);
      });
    },

    /* 篝火暖声（生火） */
    warm: function () { noiseBurst(0.9, 0.08, 240, 640, 0.55); },

    /* 单个低音鼓点 */
    tom: function (f, vol) {
      if (!ensure()) return;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f || 110, t);
      o.frequency.exponentialRampToValueAtTime((f || 110) * 0.42, t + 0.22);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.22, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.34);
    },

    /* 行军转场：四声脚步 + 战鼓推进 + 风声 */
    march: function () {
      if (!ensure()) return;
      /* 脚步：闷噪短击，左右交替 */
      [0, 150, 300, 450].forEach(function (d, i) {
        setTimeout(function () {
          noiseBurst(0.07, 0.05 + (i === 3 ? 0.03 : 0), i % 2 ? 520 : 380, 110, 1.6);
        }, d);
      });
      /* 战鼓：由缓到密，推进感 */
      [180, 420, 620, 760, 880].forEach(function (d, i) {
        setTimeout(function () {
          SFX.tom(96 - i * 4, 0.14 + i * 0.022);
        }, d);
      });
      /* 风 */
      setTimeout(function () { noiseBurst(1.4, 0.05, 620, 180, 0.5); }, 120);
    },

    /* 心跳（湘江致哀，低哑双击） */
    heart: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      [0, 0.18].forEach(function (d, i) {
        var o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(i ? 46 : 54, t + d);
        o.frequency.exponentialRampToValueAtTime(30, t + d + 0.16);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(i ? 0.1 : 0.16, t + d + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.24);
        o.connect(g); g.connect(master);
        o.start(t + d); o.stop(t + d + 0.28);
      });
    },

    /* 墨滴（弹窗开启，水墨晕开） */
    ink: function () {
      if (!ensure()) return;
      noiseBurst(0.5, 0.06, 1400, 240, 0.8);
      tone(196, 0.5, 0.05, 'sine', 1.6);
    },

    /* 冲锋号（短促军号，用于章节起势/关键时刻） */
    bugle: function () {
      if (!ensure()) return;
      var t = ctx.currentTime + 0.05;
      var notes = [392.0, 523.2, 659.2, 783.9];
      for (var i = 0; i < notes.length; i++) {
        var tt = t + i * 0.18;
        var dur = i === notes.length - 1 ? 0.7 : 0.16;
        var o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(notes[i] * 0.985, tt);
        o.frequency.linearRampToValueAtTime(notes[i], tt + 0.04);
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = notes[i] * 2.2;
        bp.Q.value = 3;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(0.13, tt + 0.04);
        g.gain.setValueAtTime(0.12, tt + dur * 0.55);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + dur + 0.1);
        o.connect(bp); bp.connect(g); g.connect(master);
        o.start(tt); o.stop(tt + dur + 0.15);
      }
    },

    /* 水流（江河，用于湘江/赤水/泸定；恒定涌动+缓慢起伏，淡入淡出由增益包络控制） */
    water: function (dur) {
      if (!ensure()) return;
      dur = dur || 2.5;
      var t = ctx.currentTime;
      var bufSize = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        var x = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin(x * 5.3)) * (0.6 + 0.4 * Math.sin(x * 1.7 + 1));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      lp.Q.value = 0.7;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.4);
      g.gain.setValueAtTime(0.09, t + dur - 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur + 0.1);
    },

    /* 强风（雪山/草地） */
    wind: function (dur) {
      if (!ensure()) return;
      dur = dur || 3;
      var t = ctx.currentTime;
      var bufSize = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var last = 0;
      for (var i = 0; i < bufSize; i++) {
        var x = i / ctx.sampleRate;
        last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
        data[i] = last * (0.6 + 0.4 * Math.sin(x * 1.5)) * Math.exp(-Math.abs(x - dur / 2) * 0.4);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 480;
      bp.Q.value = 0.6;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.6);
      g.gain.setValueAtTime(0.12, t + dur - 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur + 0.1);
    }
  };

  window.SFX = SFX;
})();
