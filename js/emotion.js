/* ============================================================
   星火之路 · 共情引擎 v2
   星火行囊 / 入伍登记（战士证） / 于都家书 / 湘江河灯 /
   风雪棉衣抉择 / 行军思考题 / 纪念证书与"你的长征路" / 结语收束
   ============================================================ */
(function () {
  'use strict';

  var soldier = {
    name: '红军战士',
    road: '',          /* 你的长征路 */
    roadText: ''       /* 专属寄语 */
  };
  window.SparkSoldier = soldier;

  /* ============ 一、星火行囊：全程反馈中枢 ============ */
  var sparks = 0;
  /* 左上角紧凑化：行囊/战士证/图鉴 并排一行（#hud-chips），避免纵向堆叠挤压章节头 */
  var chips = document.createElement('div');
  chips.id = 'hud-chips';
  var hudLeft = document.getElementById('hud-left');
  hudLeft.appendChild(chips);
  var colChip = document.getElementById('hud-col');   /* explore.js 先建好的图鉴计数 */
  if (colChip) chips.appendChild(colChip);
  var pouch = document.createElement('div');
  pouch.id = 'spark-pouch';
  pouch.innerHTML = '星火行囊 <b>✦ 0</b>';
  chips.appendChild(pouch);

  function toast(html) {
    var box = document.getElementById('toast-box');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    box.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 600);
    }, 2600);
  }

  window.SparkGain = function (n, label) {
    sparks += n;
    pouch.classList.add('show');
    pouch.innerHTML = '星火行囊 <b>✦ ' + sparks + '</b>';
    pouch.classList.remove('pulse');
    void pouch.offsetWidth;
    pouch.classList.add('pulse');
    if (window.SFX) SFX.ding(Math.min(10, 3 + sparks));
    if (window.SparkFX) {
      var r = pouch.getBoundingClientRect();
      SparkFX.burst(r.left + r.width / 2, r.top + r.height / 2, 8, true);
    }
    if (label) toast('✦ 星火 <b>+' + n + '</b> · ' + label);
    return sparks;
  };
  window.SparkSparks = function () { return sparks; };

  /* 原有奖励互动（火把/四渡/攀索/篝火/会师）也计星火 */
  var REASON = { 1: '火把满河', 4: '四渡完成', 5: '夺桥成功', 6: '篝火连片', 7: '会师之火' };
  var _reward = window.SparkReward;
  window.SparkReward = function (ch) {
    if (_reward) _reward(ch);
    if (REASON[ch]) SparkGain(2, REASON[ch]);
  };

  /* ============ 二、于都家书（意象创作） ============ */
  var fl = document.querySelector('.family-letter');
  var letterModal = document.createElement('div');
  letterModal.id = 'letter-modal';
  letterModal.setAttribute('aria-hidden', 'true');
  letterModal.innerHTML =
    '<div class="lm-backdrop"></div>' +
    '<div class="lm-paper" role="dialog" aria-modal="true" aria-label="于都家书">' +
    '<button class="lm-close" aria-label="收起家书">✕</button>' +
    '<p class="lm-head">娘：</p>' +
    '<p>部队今夜就要开拔了。开到哪里去、要走多远，儿都不能说。</p>' +
    '<p>家里的门板您莫要找了——儿把它拆了，抬去河边架了桥。大军过河要用，乡亲们都在拆，儿不能落在人后。</p>' +
    '<p>您纳的那双草鞋，儿穿上了，很合脚。</p>' +
    '<p>等革命成功的那天，儿一定回来，给您挑水、种田。</p>' +
    '<p class="lm-sign">——儿敬上<br>一九三四年十月十七日 · 于都河畔</p>' +
    '<p class="lm-note">（据史实情景创作的意象家书：当年，三十万于都人共同守住了这个秘密）</p>' +
    '</div>';
  document.body.appendChild(letterModal);

  function openLetter() {
    letterModal.classList.add('show');
    letterModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ov-lock');
    if (window.SFX) SFX.ink();
    if (fl && !fl._read) {
      fl._read = true;
      fl.classList.add('read');   /* 供自动行军检测交互完成；CSS 将其隐去 */
      setTimeout(function () { SparkGain(2, '读完家书'); }, 900);
    }
  }
  function closeLetter() {
    letterModal.classList.remove('show');
    letterModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ov-lock');
    if (window.SFX) SFX.pluck(320);
    /* 首读收起后：家书卡片已隐去，自动前进一步，不停在空步骤上 */
    if (fl && fl._read && fl.classList.contains('on')) {
      setTimeout(function () {
        if (fl.classList.contains('on')) {
          var n = document.getElementById('sc-next');
          if (n) n.click();
        }
      }, 700);
    }
  }
  if (fl) {
    fl.addEventListener('click', openLetter);
    fl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLetter(); }
    });
  }
  letterModal.querySelector('.lm-close').addEventListener('click', closeLetter);
  letterModal.querySelector('.lm-backdrop').addEventListener('click', closeLetter);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && letterModal.classList.contains('show')) closeLetter();
  });

  /* ============ 三、湘江河灯：为英烈点一盏灯 ============ */
  var lanternBtn = document.getElementById('lantern-btn');
  var lanternStatus = document.getElementById('lantern-status');
  var lanternN = 0;
  var L_STEPS = ['一盏河灯亮了，随水漂远', '两盏。江面有了微光', '三盏。英灵们看见了'];

  function spawnLantern() {
    var stage = document.querySelector('#ch2 .ch-stage');
    if (!stage) return;
    /* 河灯顺水漂远：外层负责漂流位移，内层负责摇曳与火苗 */
    var w = document.createElement('div');
    w.className = 'lantern-drift';
    w.style.left = (34 + Math.random() * 50).toFixed(1) + '%';
    w.style.top = (50 + Math.random() * 14).toFixed(1) + '%';
    w.style.animationDuration = (26 + Math.random() * 16).toFixed(0) + 's';
    var l = document.createElement('div');
    l.className = 'lantern';
    l.style.animationDelay = (-Math.random() * 3).toFixed(1) + 's';
    l.style.scale = (0.75 + Math.random() * 0.5).toFixed(2);
    w.appendChild(l);
    stage.appendChild(w);
    /* 落水生漪 */
    var r = w.getBoundingClientRect();
    if (window.SparkFX) SparkFX.ring(r.left + r.width / 2, r.top + r.height * 0.8, false);
  }
  if (lanternBtn && window.SparkHoldCharge) {
    /* 河灯亦需亲手护住火苗：蓄力点亮，松手则被江风吹熄 */
    var lanternHold = window.SparkHoldCharge(lanternBtn, {
      duration: 1000,
      onStart: function () {
        if (lanternN < 3) lanternStatus.textContent = '灯芯燃了……用手护住，江风大';
      },
      onRelease: function () {
        if (lanternN < 3) lanternStatus.textContent = '火苗被江风吹熄了。再护一次';
      },
      onComplete: function () {
        if (lanternN >= 3) { lanternHold.lock(); return; }
        spawnLantern();
        lanternN++;
        lanternStatus.textContent = L_STEPS[lanternN - 1];
        if (window.SFX) SFX.pluck(430 - lanternN * 45);
        if (lanternN >= 3) {
          lanternHold.lock();
          lanternBtn.classList.add('on');
          lanternStatus.classList.add('done');
          lanternStatus.textContent = '你们的名字无人知晓，你们的功勋与世长存';
          SparkGain(3, '河灯三盏');
          if (window.SFX) setTimeout(function () { SFX.chime(false); }, 420);
          setTimeout(spawnLantern, 650);
          setTimeout(spawnLantern, 1300);
        }
      }
    });
  }

  /* ============ 三·乙、湘江负重：背起行囊，亲手清点 ============ */
  /* 通过操作"失去"体认历史：行囊越背越重，名字一个个暗下去，最后亲手清点连队 */
  (function () {
    var box = document.getElementById('burden-ix');
    if (!box) return;
    var hold = document.getElementById('bi-hold');
    var fill = document.getElementById('bi-fill');
    var note = document.getElementById('bi-note');
    var packEl = document.getElementById('bi-pack');
    var weightEl = document.getElementById('bi-weight');
    var namesBox = document.getElementById('rs-names');
    var rsHint = document.getElementById('rs-hint');
    var resultEl = document.getElementById('bi-result');

    var NAMES = ['王有福', '李长贵', '陈满仓', '赵德山', '刘二娃', '张树根', '周春生', '吴铁蛋', '郑家旺', '孙来喜', '何栓柱', '马石娃'];
    var FALLEN = ['王有福', '李长贵', '陈满仓'];
    var nameEls = {};
    NAMES.forEach(function (n) {
      var s = document.createElement('span');
      s.className = 'rs-name';
      s.textContent = n;
      namesBox.appendChild(s);
      nameEls[n] = s;
    });

    var MILES = [
      { at: 0.18, text: '一里：草鞋磨穿了——你扯下布条缠住脚，继续走。' },
      { at: 0.36, text: '二里：干粮袋空了——你勒了勒腰带。' },
      { at: 0.54, text: '三里：弹药打光了——你留好了最后一颗手榴弹。', speed: 0.85 },
      { at: 0.72, text: '四里：身边的战友把枪塞进你怀里——"替我背回去。"【王有福】的名字，暗了。', fall: ['王有福'], weight: 16, speed: 0.65 },
      { at: 0.88, text: '五里：又一个战友倒下，没来得及留话。【李长贵】【陈满仓】的名字，也暗了。', fall: ['李长贵', '陈满仓'], weight: 20, speed: 0.5 }
    ];

    var p = 0, speed = 1, holding = false, phase = 'march', mile = 0, counted = 0, lastT = 0;

    function footstep() {
      if (phase !== 'march' || !holding) return;
      if (window.SFX) SFX.tom(74, 0.05);
      setTimeout(footstep, 880);
    }

    function frame(t) {
      var dt = lastT ? Math.min(t - lastT, 64) : 16;
      lastT = t;
      if (phase === 'march') {
        if (holding) p = Math.min(1, p + dt / 5200 * speed);
        fill.style.width = (p * 100).toFixed(1) + '%';
        while (mile < MILES.length && p >= MILES[mile].at) {
          var m = MILES[mile];
          note.textContent = m.text;
          if (m.speed) speed = m.speed;
          if (m.weight) {
            weightEl.textContent = '负重 ' + m.weight + ' 斤';
            packEl.style.scale = (1 + (m.weight - 12) * 0.02).toFixed(2);
          }
          if (m.fall) {
            m.fall.forEach(function (n) { nameEls[n].classList.add('fall'); });
            if (window.SFX) SFX.heart();
          } else if (window.SFX) {
            SFX.pluck(380 - mile * 45);
          }
          mile++;
        }
        if (p >= 1) cross();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function cross() {
      phase = 'count';
      box.classList.remove('moving');
      box.classList.add('live');
      hold.style.display = 'none';
      note.textContent = '过了江。现在清点你的连队——把还活着的名字，一个一个点亮。';
      rsHint.hidden = false;
      rsHint.textContent = '（灰暗的名字已无法点亮——他们留在了东岸。）';
      if (window.SFX) SFX.chime(false);
      SparkGain(2, '背过了湘江');
    }

    function holdStart(e) {
      if (phase !== 'march') return;
      holding = true;
      box.classList.add('moving');
      hold.classList.add('holding');
      footstep();
      if (e && e.type === 'keydown') e.preventDefault();
    }
    function holdEnd() {
      if (phase !== 'march') return;
      holding = false;
      box.classList.remove('moving');
      hold.classList.remove('holding');
      if (p < 1) note.textContent = p > 0.3 ? '松手了。湘江的浪还在打——继续，别停。' : '追兵就在身后。按住，别松手。';
    }
    hold.addEventListener('pointerdown', holdStart);
    window.addEventListener('pointerup', holdEnd);
    hold.addEventListener('pointerleave', holdEnd);
    hold.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') holdStart(e); });
    hold.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') holdEnd(); });
    hold.addEventListener('click', function () {
      if (phase !== 'march') return;
      p = Math.min(1, p + 0.045);
      var r = hold.getBoundingClientRect();
      if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top, 3, true);
    });

    /* 清点：亲手点亮还活着的名字 */
    NAMES.forEach(function (n) {
      var el = nameEls[n];
      el.addEventListener('click', function () {
        if (phase !== 'count') return;
        if (el.classList.contains('fall')) {
          el.classList.add('deny');
          setTimeout(function () { el.classList.remove('deny'); }, 450);
          if (window.SFX) SFX.pluck(180);
          return;
        }
        if (el.classList.contains('count')) return;
        counted++;
        el.classList.add('count');
        el.dataset.n = counted;
        if (window.SFX) SFX.tick();
        var r = el.getBoundingClientRect();
        if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top, 5, true);
        if (counted === NAMES.length - FALLEN.length) {
          phase = 'done';
          rsHint.hidden = true;
          resultEl.hidden = false;
          resultEl.innerHTML = '清点完毕：<b>九个人</b>。<br>出发那天，你们连一百二十人，站满了于都河的渡口。<br>而你，只是于都出发的八万六千分之一。';
          SparkGain(3, '清点了连队');
          if (window.SFX) { SFX.heart(); setTimeout(function () { SFX.chime(true); }, 900); }
          if (window.SparkFX) SparkFX.jolt(false);
        }
      });
    });
  })();

  /* ============ 三·丙、遵义表决：亲手划掉错误路线 ============ */
  (function () {
    var box = document.getElementById('route-ix');
    if (!box) return;
    var note = box.querySelector('#rt-note');
    var cards = [].slice.call(box.querySelectorAll('.rt-card'));
    var struck = 0;
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (card.classList.contains('struck') || card.classList.contains('lit')) return;
        if (card.classList.contains('bad')) {
          card.classList.add('struck');
          struck++;
          if (window.SFX) SFX.pluck(300 - struck * 40);
          var r = card.getBoundingClientRect();
          if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top + r.height / 2, 6, true);
          note.textContent = struck === 1 ? '划掉了一条。' : '都划掉了。';
          if (struck === 2) {
            var good = box.querySelector('.rt-card.good');
            setTimeout(function () {
              good.classList.add('lit');
              note.textContent = '错误划掉了，剩下的一条亮起来——会议的转折，从否定错误开始。';
              SparkGain(2, '参与了表决');
              if (window.SFX) SFX.chime(false);
              var gr = good.getBoundingClientRect();
              if (window.SparkFX) SparkFX.burst(gr.left + gr.width / 2, gr.top + gr.height / 2, 12, true);
            }, 650);
          }
        } else {
          card.classList.add('deny');
          setTimeout(function () { card.classList.remove('deny'); }, 450);
          note.textContent = '先把错误的两条划掉。';
          if (window.SFX) SFX.pluck(200);
        }
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
  })();

  /* ============ 七·乙、会师点名：三旗升起来，再点火 ============ */
  (function () {
    var flags = [].slice.call(document.querySelectorAll('#huishi-ix .flag-btn'));
    if (!flags.length) return;
    var lit = 0;
    flags.forEach(function (f) {
      f.addEventListener('click', function () {
        if (f.classList.contains('lit')) return;
        f.classList.add('lit');
        lit++;
        var r = f.getBoundingClientRect();
        if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top + 10, 8, true);
        if (window.SFX) { SFX.pluck(420 + lit * 80); }
        if (lit === 3) {
          /* 三旗既点名：催促用户亲手蓄力点火（不再自动代点） */
          if (window.SparkCelebUrge) window.SparkCelebUrge();
        }
      });
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); }
      });
    });
  })();

  /* ============ 四、风雪棉衣：有正确答案的抉择（盖在战友身上才对） ============ */
  var coatBlock = document.getElementById('coat-ix');
  if (coatBlock) {
    var coatDone = false;
    [].forEach.call(coatBlock.querySelectorAll('.co-opt'), function (opt) {
      opt.addEventListener('click', function () {
        if (coatDone) return;
        var res = coatBlock.querySelector('.co-result');
        if (opt.getAttribute('data-k') === 'self') {
          /* 选"披在自己身上"：错。风雪里的正确答案，是把暖让给别人 */
          opt.classList.add('wrong');
          setTimeout(function () { opt.classList.remove('wrong'); }, 500);
          res.hidden = false;
          res.classList.add('retry');
          res.textContent = '再想想：风雪夜里，你放不下的该是自己的冷，还是战友的呼吸？';
          if (window.SFX) SFX.pluck(220);
          return;
        }
        coatDone = true;
        res.classList.remove('retry');
        res.hidden = false;
        res.textContent = '战友在棉衣里睡着了，呼吸很稳。老班长往火里又添了一把柴："好小子。"';
        [].forEach.call(coatBlock.querySelectorAll('.co-opt'), function (o) { o.disabled = true; });
        opt.classList.add('on');
        SparkGain(2, '温暖，让给了别人');
        if (window.SFX) SFX.warm();
        var r = opt.getBoundingClientRect();
        if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top, 12, true);
      });
    });
  }

  /* ============ 五、行军思考题：答对有启发，答错有引导 ============ */
  [].forEach.call(document.querySelectorAll('.quiz-block'), function (block) {
    var ans = block.getAttribute('data-ans');
    var done = false;
    var exp = block.querySelector('.qz-exp');
    [].forEach.call(block.querySelectorAll('.qz-opt'), function (opt) {
      opt.addEventListener('click', function () {
        if (done) return;
        if (opt.getAttribute('data-k') === ans) {
          done = true;
          opt.classList.add('on');
          [].forEach.call(block.querySelectorAll('.qz-opt'), function (o) { o.disabled = true; });
          exp.hidden = false;
          exp.classList.remove('retry');
          exp.textContent = block.getAttribute('data-exp');
          SparkGain(2, '读懂了这一章');
          if (window.SFX) SFX.chime(false);
          var r = opt.getBoundingClientRect();
          if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top, 12, true);
        } else {
          opt.classList.add('wrong');
          setTimeout(function () { opt.classList.remove('wrong'); }, 500);
          exp.hidden = false;
          exp.classList.add('retry');
          exp.textContent = '再想想：' + block.getAttribute('data-hint');
          if (window.SFX) SFX.pluck(220);
        }
      });
    });
  });

  /* ============ 六、入伍登记：成为队伍中的一员 ============ */
  var enlistModal = document.createElement('div');
  enlistModal.id = 'enlist-modal';
  enlistModal.setAttribute('aria-hidden', 'true');
  enlistModal.innerHTML =
    '<div class="em-backdrop"></div>' +
    '<div class="em-card" role="dialog" aria-modal="true" aria-label="入伍登记">' +
    '<div class="em-kid" aria-hidden="true">' +
      '<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">' +
        /* 阴影 */
        '<ellipse cx="100" cy="208" rx="44" ry="7" fill="rgba(0,0,0,.18)"/>' +
        /* 身体（灰蓝军装） */
        '<path d="M62 140 Q60 130 72 126 L128 126 Q140 130 138 140 L142 200 Q143 208 135 208 L65 208 Q57 208 58 200 Z" fill="#5a6470"/>' +
        /* 腰带 */
        '<rect x="60" y="172" width="80" height="8" fill="#3a3f47"/>' +
        '<rect x="96" y="170" width="8" height="12" fill="#c8a24a"/>' +
        /* 红领巾 */
        '<path d="M78 122 L100 138 L122 122 L118 150 L100 142 L82 150 Z" fill="#c8342a"/>' +
        '<path d="M88 148 L100 142 L112 148 L108 172 L100 166 L92 172 Z" fill="#a82820"/>' +
        /* 衣领 */
        '<path d="M82 126 L100 138 L118 126 L115 120 L100 128 L85 120 Z" fill="#47505c"/>' +
        /* 脖子 */
        '<rect x="90" y="108" width="20" height="22" fill="#f0c9a0"/>' +
        /* 脸 */
        '<circle cx="100" cy="92" r="34" fill="#f4d2a8"/>' +
        /* 腮红 */
        '<ellipse cx="78" cy="96" rx="7" ry="5" fill="#e89078" opacity=".5"/>' +
        '<ellipse cx="122" cy="96" rx="7" ry="5" fill="#e89078" opacity=".5"/>' +
        /* 眼睛 */
        '<ellipse cx="88" cy="90" rx="3.5" ry="4.5" fill="#2a2018"/>' +
        '<ellipse cx="112" cy="90" rx="3.5" ry="4.5" fill="#2a2018"/>' +
        '<circle cx="89" cy="88" r="1.2" fill="#fff"/>' +
        '<circle cx="113" cy="88" r="1.2" fill="#fff"/>' +
        /* 嘴 */
        '<path d="M92 104 Q100 110 108 104" stroke="#8b3a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        /* 眉毛 */
        '<path d="M82 82 Q88 79 94 82" stroke="#5a3a28" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M106 82 Q112 79 118 82" stroke="#5a3a28" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        /* 红军八角帽 */
        '<path d="M66 70 Q62 50 100 44 Q138 50 134 70 L130 78 L70 78 Z" fill="#4a5566"/>' +
        '<path d="M66 70 L134 70 L130 82 L70 82 Z" fill="#3d4754"/>' +
        /* 帽檐 */
        '<ellipse cx="100" cy="80" rx="40" ry="6" fill="#2e3640"/>' +
        /* 红星 */
        '<polygon points="100,50 103,58 111,58 105,63 107,71 100,67 93,71 95,63 89,58 97,58" fill="#e8c84a" stroke="#c8a24a" stroke-width="1"/>' +
        /* 胳膊 */
        '<path d="M62 142 Q50 160 56 180 L66 178 Q62 160 72 146 Z" fill="#5a6470"/>' +
        '<path d="M138 142 Q150 160 144 180 L134 178 Q138 160 128 146 Z" fill="#5a6470"/>' +
        /* 手 */
        '<circle cx="56" cy="181" r="7" fill="#f0c9a0"/>' +
        '<circle cx="144" cy="181" r="7" fill="#f0c9a0"/>' +
      '</svg>' +
    '</div>' +
    '<div class="em-head"><span class="em-kicker">中国工农红军 · 入伍登记</span></div>' +
    '<p class="em-line">一九三四年十月，于都河畔。大军即将开拔——</p>' +
    '<p class="em-line">写下你的名字，领一顶红星帽，随队出征。</p>' +
    '<div class="em-form"><label>姓名</label><input id="enlist-name" type="text" maxlength="8" placeholder="红军战士" autocomplete="off"></div>' +
    '<div class="em-go" id="enlist-go" role="button" tabindex="0">盖 章 入 伍</div>' +
    '<div class="em-stamp"><i>红星</i><b>中国工农红军</b><span>于都 · 一九三四</span></div>' +
    '</div>';
  document.body.appendChild(enlistModal);
  var nameInput = enlistModal.querySelector('#enlist-name');
  var emGo = enlistModal.querySelector('#enlist-go');

  var idCard = document.createElement('div');
  idCard.id = 'soldier-card';
  idCard.title = '我的战士证';
  idCard.innerHTML = '<i class="sc-star">✦</i><span class="sc-name">红军战士</span><span class="sc-unit">红一方面军</span>';
  idCard.style.display = 'none';
  chips.appendChild(idCard);
  idCard.addEventListener('click', function () { toast('✦ ' + soldier.name + ' · 红一方面军 · 一九三四年于都入伍'); });

  function showEnlist() {
    enlistModal.classList.add('show');
    enlistModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ov-lock');
    setTimeout(function () { try { nameInput.focus(); } catch (e) {} }, 400);
    if (window.SFX) SFX.ink();
  }
  function finishEnlist() {
    var v = (nameInput.value || '').trim();
    soldier.name = v ? v.slice(0, 8) : '红军战士';
    idCard.querySelector('.sc-name').textContent = soldier.name;
    idCard.style.display = '';
    enlistModal.classList.add('stamped');
    if (window.SFX) { SFX.tom(80, 0.4); SFX.fwoosh(); }
    if (window.SparkFX) {
      SparkFX.jolt(true);
      var r = enlistModal.querySelector('.em-stamp').getBoundingClientRect();
      SparkFX.burst(r.left + r.width / 2, r.top + r.height / 2, 22, true);
    }
    setTimeout(function () {
      enlistModal.classList.remove('show', 'stamped');
      enlistModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('ov-lock');
      toast('✦ 欢迎入伍，' + soldier.name + ' —— 你的长征开始了');
      if (window.SFX) setTimeout(function () { SFX.chime(false); }, 300);
      if (window.SparkMarchBegin) SparkMarchBegin();
    }, 1500);
  }
  window.SparkEnlist = function () {
    if (idCard.style.display === 'none') { showEnlist(); return; }
    if (window.SparkMarchBegin) SparkMarchBegin();
  };
  emGo.addEventListener('click', finishEnlist);
  emGo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishEnlist(); }
  });
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); finishEnlist(); }
  });

  /* ============ 七、纪念证书与"你的长征路" ============ */
  var certModal = document.createElement('div');
  certModal.id = 'cert-modal';
  certModal.setAttribute('aria-hidden', 'true');
  certModal.innerHTML = '<div class="cm-backdrop"></div><div class="cm-card" role="dialog" aria-modal="true" aria-label="长征纪念证书"></div>';
  document.body.appendChild(certModal);

  var ROADS = {
    study: { label: '求学之路', text: '书山亦是雪山，题海亦如草地——你在灯下走的每一步，都算数。' },
    startup: { label: '创业之路', text: '没有根据地，就自己开辟根据地。愿你亦有四渡赤水的机变，和走完草地的韧劲。' },
    research: { label: '科研之路', text: '攻关如夺桥：铁索再寒，也要爬过去。山顶的风景，只留给不回头的人。' },
    guard: { label: '守卫之路', text: '九十年前他们守山河，今天你守万家灯火。接力棒，在你手里。' },
    ordinary: { label: '平凡之路', text: '把平凡的日子过好，就是这一代人的长征。柴米油盐里，亦有星火。' }
  };

  function buildCert() {
    var done = 0;
    try { done = document.querySelectorAll('.quiz-block .qz-opt.on').length; } catch (e) {}
    var card = certModal.querySelector('.cm-card');
    card.innerHTML =
      '<div class="cm-frame">' +
      '<div class="cm-kicker">纪念中国工农红军长征胜利九十周年</div>' +
      '<h3 class="cm-title">长 征 纪 念 证 书</h3>' +
      '<p class="cm-to"><em>' + soldier.name + '</em> 同志：</p>' +
      '<p class="cm-body">你于一九三四年十月自江西于都入伍，随红一方面军跋涉<b>二万五千里</b>，翻雪山、过草地、飞夺泸定桥，于一九三六年十月胜利抵达陕北。现授予"星火战士"称号，以志纪念。</p>' +
      '<div class="cm-stats">' +
      '<div class="cms"><b>' + sparks + '</b><span>点燃星火</span></div>' +
      '<div class="cms"><b>' + done + '</b><span>读懂征程</span></div>' +
      '<div class="cms"><b>' + lanternCount() + '</b><span>湘江河灯</span></div>' +
      '</div>' +
      (soldier.road
        ? '<div class="cm-road"><b>你的长征路 · ' + ROADS[soldier.road].label + '</b><p>' + ROADS[soldier.road].text + '</p></div>'
        : '<div class="cm-ask"><p>走完了他们的长征——你的长征路是什么？</p><div class="cm-roads">' +
          Object.keys(ROADS).map(function (k) { return '<button class="cm-road-btn" data-k="' + k + '">' + ROADS[k].label + '</button>'; }).join('') +
          '</div></div>') +
      '<div class="cm-foot"><span>星火之路 · 二〇二六年十月</span><i class="cm-seal">星火<br>不灭</i></div>' +
      '</div>';
    /* 选择"你的长征路" */
    [].forEach.call(card.querySelectorAll('.cm-road-btn'), function (b) {
      b.addEventListener('click', function () {
        soldier.road = b.getAttribute('data-k');
        if (window.SFX) SFX.chime(false);
        if (window.SparkFX) {
          var r = b.getBoundingClientRect();
          SparkFX.burst(r.left + r.width / 2, r.top, 14, true);
        }
        buildCert();   /* 重新渲染，带入寄语 */
      });
    });
  }
  function lanternCount() {
    return document.querySelectorAll('#ch2 .lantern').length;
  }
  /* 证书弹窗期间暂停结语星河影像与升腾粒子：把算力让给弹窗，消除卡顿 */
  function setEndVideo(paused) {
    var v = document.querySelector('.ending .end-figure video');
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    }
  }
  function openCert() {
    buildCert();
    certModal.classList.add('show');
    certModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ov-lock', 'cert-open');
    setEndVideo(true);
    if (window.SFX) { SFX.march(); setTimeout(function () { SFX.chime(true); }, 800); }
    if (window.SparkFX) SparkFX.jolt(false);
    var la = document.getElementById('cert-launch');
    if (la && !la._got) {
      la._got = true;
      la.querySelector('.cl-text').textContent = '证书已领取 · 星火不灭';
      setTimeout(function () { SparkGain(5, '走完了这条星火之路'); }, 1200);
    }
  }
  function closeCert() {
    certModal.classList.remove('show');
    certModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ov-lock', 'cert-open');
    setEndVideo(false);
  }
  var certLaunch = document.getElementById('cert-launch');
  if (certLaunch) {
    certLaunch.addEventListener('click', openCert);
    certLaunch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCert(); }
    });
  }
  certModal.querySelector('.cm-backdrop').addEventListener('click', closeCert);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && certModal.classList.contains('show')) closeCert();
  });

  /* ============ 九、今昔同框：已融入场景引擎（app.js 终章步） ============ */

  /* ============ 八、结语收束：你点燃的星火，都落在这里 ============ */
  var finaleDone = false;
  setInterval(function () {
    if (!finaleDone && window.SparkCur === 9) {
      finaleDone = true;
      var el = document.querySelector('.finale-line');
      if (el) {
        el.textContent = sparks > 0
          ? soldier.name + '，这一路你亲手点燃了 ' + sparks + ' 点星火——它们没有熄灭，都落在了这里。'
          : soldier.name + '，星火正等着你的手。';
      }
      if (sparks >= 6) {
        setTimeout(function () {
          toast('✦ 星火不灭 · 山河无恙');
          if (window.SFX) SFX.chime(true);
        }, 1400);
      }
    }
  }, 800);
})();
