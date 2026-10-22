/* ============================================================
   星火之路 · 自研程序化配乐引擎 v2（Web Audio 实时合成）
   场景化配乐：每章独立 音阶 / 节奏型 / 拨弦音色 / 钟琴 / 换场风声
   低音持续层 · 和声铺底 · 行军鼓点 · 风雪声场 · 五声星光
   —— 全程无采样、零版权 ——
   ============================================================ */
(function () {
  'use strict';

  function MarchMusic() {
    this.ctx = null;
    this.started = false;
    this.playing = false;
    this.chapter = 0;
    this.lastFanfare = -1;
    this.nodes = {};
    this.timers = [];
    this.ostStep = 0;
    this._moodApplied = false;
  }

  /* ============ 十个场景情绪 ============
     root 基频 | tempo BPM(0=无鼓点) | drum 鼓力度 | bright 星光亮度
     wind 风雪 | pad 铺底 | maj 大/小三度
     scale 五声音阶(半音) | pat 16步节奏型(0休止/1拨/2重拨)
     ost 拨弦速度倍率(null=无) | bell 钟琴 | label 场景名 */
  MarchMusic.prototype.MOODS = [
    { label: '封面·夜',   root: 55.0, tempo: 0,   drum: 0.00, bright: 0.05, wind: 0.06, pad: 0.050, maj: false, scale: [0, 3, 5, 7, 10],    pat: null,                              ost: null, bell: false },
    { label: '于都·行军', root: 55.0, tempo: 78,  drum: 0.30, bright: 0.16, wind: 0.12, pad: 0.065, maj: false, scale: [0, 3, 5, 7, 10],    pat: [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0], ost: 1.0,  bell: false },
    { label: '湘江·血战', root: 46.2, tempo: 122, drum: 0.92, bright: 0.10, wind: 0.26, pad: 0.075, maj: false, scale: [0, 1, 3, 5, 6],      pat: [1,0,1,0, 1,0,2,0, 1,0,1,0, 1,0,2,1], ost: 1.4,  bell: false },
    { label: '遵义·微光', root: 65.4, tempo: 60,  drum: 0.14, bright: 0.42, wind: 0.10, pad: 0.085, maj: true,  scale: [0, 2, 4, 7, 9],    pat: [1,0,0,1, 0,0,1,0, 0,0,1,0, 0,0,0,0], ost: 0.7,  bell: false },
    { label: '赤水·灵动', root: 58.3, tempo: 96,  drum: 0.46, bright: 0.26, wind: 0.10, pad: 0.068, maj: false, scale: [0, 2, 3, 7, 9],    pat: [1,0,1,1, 0,1,0,1, 1,0,1,0, 1,1,0,0], ost: 1.2,  bell: false },
    { label: '泸定·飞夺', root: 51.9, tempo: 144, drum: 0.82, bright: 0.20, wind: 0.26, pad: 0.070, maj: false, scale: [0, 3, 5, 6, 10],    pat: [1,1,1,1, 1,1,2,1, 1,1,1,1, 1,2,1,1], ost: 1.8,  bell: false },
    { label: '雪山·风雪', root: 46.2, tempo: 36,  drum: 0.05, bright: 0.12, wind: 0.80, pad: 0.055, maj: false, scale: [0, 3, 7, 10, 12],   pat: [1,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0], ost: 0.35, bell: true  },
    { label: '会师·燎原', root: 65.4, tempo: 72,  drum: 0.36, bright: 0.72, wind: 0.08, pad: 0.100, maj: true,  scale: [0, 2, 4, 7, 9],    pat: [1,0,1,0, 1,0,2,0, 1,0,1,0, 2,0,1,0], ost: 0.9,  bell: true  },
    { label: '长卷·回望', root: 58.3, tempo: 66,  drum: 0.26, bright: 0.46, wind: 0.06, pad: 0.080, maj: false, scale: [0, 3, 5, 7, 10],    pat: [1,0,0,0, 1,0,0,1, 0,0,1,0, 0,1,0,0], ost: 0.8,  bell: false },
    { label: '结语·星河', root: 65.4, tempo: 46,  drum: 0.08, bright: 0.56, wind: 0.05, pad: 0.090, maj: true,  scale: [0, 2, 4, 7, 9],    pat: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0], ost: 0.5,  bell: true  }
  ];

  /* ---------- 启动（须由用户手势触发） ---------- */
  MarchMusic.prototype.begin = function () {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var ctx = this.ctx = new AC();
    this.started = true;
    this.playing = true;

    var n = this.nodes;
    n.master = ctx.createGain();
    n.master.gain.value = 0.0001;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.ratio.value = 6;
    n.master.connect(comp);
    comp.connect(ctx.destination);
    n.master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2);

    this._buildDrone();
    this._buildPad();
    this._buildWind();
    this._startDrums();
    this._startOstinato();
    this._startSparkle();
    this._startBells();

    this._moodApplied = false;
    this.setChapter(this.chapter);
  };

  /* ---------- 低音持续层 ---------- */
  MarchMusic.prototype._buildDrone = function () {
    var ctx = this.ctx, n = this.nodes;
    var g = n.droneGain = ctx.createGain();
    g.gain.value = 0.09;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 190;
    lp.Q.value = 0.6;
    g.connect(lp);
    lp.connect(n.master);

    var self = this;
    this.droneOscs = [];
    [0, 5, -4].forEach(function (det) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 55;
      o.detune.value = det;
      o.connect(g);
      o.start();
      self.droneOscs.push(o);
    });

    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    var lg = ctx.createGain();
    lg.gain.value = 60;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    lfo.start();
  };

  /* ---------- 和声铺底 ---------- */
  MarchMusic.prototype._buildPad = function () {
    var ctx = this.ctx, n = this.nodes;
    var g = n.padGain = ctx.createGain();
    g.gain.value = 0.0;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    g.connect(lp);
    lp.connect(n.master);
    this.padOscs = [];
    for (var i = 0; i < 3; i++) {
      var o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = 110;
      o.detune.value = (i - 1) * 5;
      o.connect(g);
      o.start();
      this.padOscs.push(o);
    }
  };

  /* ---------- 风雪声场 ---------- */
  MarchMusic.prototype._buildWind = function () {
    var ctx = this.ctx, n = this.nodes;
    var len = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.6;
    var g = n.windGain = ctx.createGain();
    g.gain.value = 0.0;
    src.connect(bp);
    bp.connect(g);
    g.connect(n.master);
    src.start();

    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    var lg = ctx.createGain();
    lg.gain.value = 320;
    lfo.connect(lg);
    lg.connect(bp.frequency);
    lfo.start();
  };

  /* ---------- 行军鼓点 ---------- */
  MarchMusic.prototype._startDrums = function () {
    var self = this;
    var nextBeat = this.ctx.currentTime + 0.2;
    var beatCount = 0;
    var timer = setInterval(function () {
      if (!self.ctx) return;
      var now = self.ctx.currentTime;
      var mood = self.MOODS[self.chapter] || self.MOODS[0];
      var period = mood.tempo > 0 ? 60 / mood.tempo : 0;
      if (period <= 0) { nextBeat = now + 0.4; return; }
      while (nextBeat < now + 0.35) {
        self._beat(nextBeat, mood.drum, beatCount);
        nextBeat += period;
        beatCount++;
      }
    }, 120);
    this.timers.push(timer);
  };

  MarchMusic.prototype._beat = function (t, level, count) {
    if (level <= 0.01) return;
    var ctx = this.ctx;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(62, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.22);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level * 0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g);
    g.connect(this.nodes.master);
    o.start(t);
    o.stop(t + 0.3);

    if (count % 2 === 1 && level > 0.2) {
      var len = Math.floor(ctx.sampleRate * 0.12);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var s = ctx.createBufferSource();
      s.buffer = buf;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      bp.Q.value = 0.8;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(level * 0.14, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      s.connect(bp);
      bp.connect(ng);
      ng.connect(this.nodes.master);
      s.start(t);
    }
  };

  /* ---------- 场景拨弦音序器（筝式拨弦，按节奏型行进） ---------- */
  MarchMusic.prototype._startOstinato = function () {
    var self = this;
    var nextStep = this.ctx.currentTime + 0.3;
    this.ostStep = 0;
    var lastChapter = -1;
    var timer = setInterval(function () {
      if (!self.ctx) return;
      var now = self.ctx.currentTime;
      var mood = self.MOODS[self.chapter] || self.MOODS[0];
      if (!mood.pat || mood.ost === null) { nextStep = now + 0.25; return; }
      var beat = 60 / Math.max(50, mood.tempo * (mood.ost >= 1 ? 1 : 1));
      var step = beat / 4 * (mood.ost >= 1.5 ? 0.5 : 1);
      if (self.chapter !== lastChapter) { self.ostStep = 0; lastChapter = self.chapter; }
      while (nextStep < now + 0.3) {
        var v = mood.pat[self.ostStep % 16];
        if (v > 0 && self.playing) {
          /* 音高沿音阶随机游走，重拨落低八度增强律动 */
          var sc = mood.scale;
          var idx = Math.floor(Math.random() * sc.length);
          var oct = v === 2 ? 1 : 2;
          var f = mood.root * Math.pow(2, sc[idx] / 12) * oct;
          self._pluck(f, nextStep, v === 2 ? 0.10 : 0.055, mood);
        }
        self.ostStep++;
        nextStep += step;
      }
    }, 90);
    this.timers.push(timer);
  };

  /* 筝式拨弦：三角波 + 快衰减 + 带通 */
  MarchMusic.prototype._pluck = function (freq, t, vol, mood) {
    var ctx = this.ctx;
    var o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 1.4;
    bp.Q.value = 1.1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(bp);
    bp.connect(g);
    g.connect(this.nodes.master);
    o.start(t);
    o.stop(t + 0.55);
  };

  /* ---------- 星光点缀 ---------- */
  MarchMusic.prototype._startSparkle = function () {
    var self = this;
    var timer = setInterval(function () {
      if (!self.ctx || !self.playing) return;
      var mood = self.MOODS[self.chapter] || self.MOODS[0];
      if (mood.bright <= 0.06) return;
      var sc = mood.scale;
      var f = mood.root * Math.pow(2, sc[Math.floor(Math.random() * sc.length)] / 12) * 4;
      self._ping(f, mood.bright * 0.15 + 0.02);
    }, 2600);
    this.timers.push(timer);
  };

  MarchMusic.prototype._ping = function (freq, vol) {
    var ctx = this.ctx, t = ctx.currentTime;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    var delay = ctx.createDelay();
    delay.delayTime.value = 0.38;
    var fb = ctx.createGain();
    fb.gain.value = 0.34;
    o.connect(g);
    g.connect(this.nodes.master);
    g.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    fb.connect(this.nodes.master);
    o.start(t);
    o.stop(t + 1.8);
  };

  /* ---------- 钟琴（雪山 / 会师 / 结语） ---------- */
  MarchMusic.prototype._startBells = function () {
    var self = this;
    var timer = setInterval(function () {
      if (!self.ctx || !self.playing) return;
      var mood = self.MOODS[self.chapter] || self.MOODS[0];
      if (!mood.bell) return;
      var sc = mood.scale;
      var f = mood.root * Math.pow(2, sc[Math.floor(Math.random() * sc.length)] / 12) * 4;
      self._bell(f, 0.045);
    }, 3400);
    this.timers.push(timer);
  };

  MarchMusic.prototype._bell = function (freq, vol) {
    var ctx = this.ctx, t = ctx.currentTime;
    var self = this;
    /* 基音 + 2.76 倍分音，模拟钟体泛音 */
    [1, 2.76].forEach(function (mul, i) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mul;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * (i === 0 ? 1 : 0.35), t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g);
      g.connect(self.nodes.master);
      o.start(t);
      o.stop(t + 3.4);
    });
  };

  /* ---------- 换场风声（场景切换提示） ---------- */
  MarchMusic.prototype._whoosh = function () {
    if (!this.ctx || !this.playing) return;
    var ctx = this.ctx, t = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.55);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.nodes.master);
    src.start(t);
    src.stop(t + 0.8);
  };

  /* ---------- 会师军号 ---------- */
  MarchMusic.prototype.fanfare = function () {
    if (!this.ctx || !this.playing) return;
    var ctx = this.ctx, t0 = ctx.currentTime + 0.1;
    var notes = [196.0, 261.6, 329.6, 392.0];
    for (var i = 0; i < notes.length; i++) {
      this._bugle(notes[i], t0 + i * 0.32, i === notes.length - 1 ? 0.9 : 0.28);
    }
  };

  MarchMusic.prototype._bugle = function (freq, t, dur) {
    var ctx = this.ctx;
    var o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq * 0.985, t);
    o.frequency.linearRampToValueAtTime(freq, t + 0.05);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 2;
    bp.Q.value = 2;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
    g.gain.setValueAtTime(0.09, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    o.connect(bp);
    bp.connect(g);
    g.connect(this.nodes.master);
    o.start(t);
    o.stop(t + dur + 0.2);
  };

  /* ---------- 章节切换：换场 + 情绪过渡 ---------- */
  MarchMusic.prototype.setChapter = function (ch) {
    var changed = ch !== this.chapter;
    if (ch === this.chapter && this._moodApplied) {
      if (ch === 7 && this.lastFanfare !== 7) { this.lastFanfare = 7; this.fanfare(); }
      return;
    }
    this.chapter = ch;
    this._moodApplied = true;
    if (!this.ctx) return;

    /* 换场风声：每个场景切换都有可闻的“过场” */
    if (changed && this.started) this._whoosh();

    var mood = this.MOODS[ch] || this.MOODS[0];
    var t = this.ctx.currentTime;
    var T = 1.1;   /* v30：情绪切换更果断，对比更鲜明 */
    var n = this.nodes;
    n.windGain.gain.setTargetAtTime(mood.wind * 0.22, t, T);
    n.padGain.gain.setTargetAtTime(mood.pad, t, T);
    var third = mood.maj ? 1.25 : 1.2;
    this.padOscs[0].frequency.setTargetAtTime(mood.root * 2, t, T);
    this.padOscs[1].frequency.setTargetAtTime(mood.root * 2 * third, t, T);
    this.padOscs[2].frequency.setTargetAtTime(mood.root * 3, t, T);
    for (var i = 0; i < this.droneOscs.length; i++) {
      this.droneOscs[i].frequency.setTargetAtTime(mood.root, t, T);
    }

    if (ch === 7 && this.lastFanfare !== 7) {
      this.lastFanfare = 7;
      var self = this;
      setTimeout(function () { self.fanfare(); }, 1500);
    }
  };

  /* ---------- 开关 ---------- */
  MarchMusic.prototype.toggle = function () {
    this.begin();
    if (!this.ctx) return false;
    this.playing = !this.playing;
    var t = this.ctx.currentTime;
    this.nodes.master.gain.setTargetAtTime(this.playing ? 0.9 : 0.0001, t, 0.6);
    return this.playing;
  };

  /* ---------- 旁白压低 / 恢复 ---------- */
  MarchMusic.prototype.duck = function (level) {
    if (!this.ctx || !this.playing) return;
    this.nodes.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.35);
  };
  MarchMusic.prototype.restore = function () {
    if (!this.ctx || !this.playing) return;
    this.nodes.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.7);
  };

  window.MarchMusic = MarchMusic;
})();
