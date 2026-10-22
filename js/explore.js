/* ============================================================
   星火之路 · 探索引擎 v1
   图卷星标（人物/桥/河等皆可点，各藏一段故事）
   图卷微动效（呼吸缩放 + 光晕扫过 + 指针视差）
   征程总图（SVG 路线 ×2：首屏内嵌 + 全域浮窗，点击星标跳转）
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* ============ 一、图卷星标数据（位置为图内百分比） ============ */
  var HS = {
    '1': [
      { x: 52, y: 42, tag: '事件', t: '守口如瓶', s: '大军在于都河畔集结整备十数日，三十万于都群众无人走漏半点风声。国民党的飞机侦察、谍报暗探竟无一人察觉——直到大军西去，对岸守军才如梦初醒。' },
      { x: 36, y: 55, tag: '器物', t: '门板与寿材', s: '架桥木料不够，于都人拆下自家的门板、床板，连老人备好的寿材也抬了出来。周恩来在河畔动情地说："于都人民真好，苏区人民真亲。"' },
      { x: 29, y: 68, tag: '地理', t: '无声的送别', s: '乡亲们把炒米、草鞋、斗笠塞进战士怀里，送别的山歌压得极低极低——这是一次不能说出口的出征。许多于都子弟踏上浮桥，从此再未回乡。' },
      { x: 74, y: 30, tag: '事件', t: '三十里夜桥', s: '五个渡口、多座浮桥，只在夜色里架起、黎明前拆去。数万大军过河后，于都河面恢复平静，仿佛一切都未发生——只留下满河碎星光。' }
    ],
    '2': [
      { x: 27, y: 44, tag: '战事', t: '绝命后卫师', s: '全军渡江后，红三十四师被隔在东岸，六千闽西子弟为掩护主力血战至几乎全师覆没。他们用生命，换回了中央西行的道路。' },
      { x: 28, y: 64, tag: '人物', t: '陈树湘', s: '师长陈树湘腹部中弹、昏迷被俘。敌人抬他去邀功，他趁隙从伤口处绞断自己的肠子，壮烈牺牲，年仅二十九岁——"为苏维埃新中国流尽最后一滴血。"' },
      { x: 68, y: 48, tag: '战事', t: '第四道封锁线', s: '蒋介石调集三十万重兵，布下第四道封锁线。五昼夜血战，红军以血肉之躯撕开缺口——队伍从八万六千人，锐减至三万余人。' },
      { x: 50, y: 24, tag: '民谣', t: '三年不饮湘江水', s: '战后，江水赤红，英烈的遗体顺流而下。桂北百姓含泪立誓，多年流传："三年不饮湘江水，十年不食湘江鱼。"' }
    ],
    '3': [
      { x: 60, y: 32, tag: '事件', t: '三天的会议', s: '遵义老城一栋小楼的二楼，二十个人开了三天会。在最危急的关头，这场会议挽救了党、挽救了红军、挽救了中国革命——党史称之为"生死攸关的转折点"。' },
      { x: 57, y: 54, tag: '器物', t: '马灯不熄', s: '会议之外的长夜，走廊里的马灯彻夜不熄。此后，毛泽东重回军事指挥岗位——中国革命的航向，从这盏灯火里重新亮起。' },
      { x: 30, y: 48, tag: '事件', t: '红军进城', s: '一月九日红军进驻遵义，战士们宁睡屋檐、不扰民宅，买卖公平、秋毫无犯。老百姓感叹：从没见过这样的军队。' },
      { x: 17, y: 38, tag: '事件', t: '担架上的谋划', s: '长征初期，毛泽东因病与王稼祥、张闻天同行，三人在担架与马背上长谈，一路酝酿着这场伟大转折——史称"担架上的谋划"。' }
    ],
    '4': [
      { x: 30, y: 36, tag: '战事', t: '忽东忽西', s: '三个月里，红军四次渡过赤水河，忽东忽西、忽南忽北，把数十万追兵拖得疲于奔命。多年后毛泽东对来访的蒙哥马利说：四渡赤水，才是我的得意之笔。' },
      { x: 50, y: 55, tag: '事件', t: '一渡土城', s: '土城战役失利，红军果断一渡赤水、避敌锋芒，从此不再与敌人硬碰硬——打得赢就打，打不赢就走。' },
      { x: 78, y: 60, tag: '地理', t: '美酒河', s: '三渡赤水于茅台渡口，两岸酒香扑鼻。战士们舍不得喝，用美酒擦洗伤口、舒活冻僵的双脚。这条河，后来被称作"美酒河"。' },
      { x: 16, y: 26, tag: '战事', t: '四十万张罗网', s: '蒋介石坐镇重庆，调四十万大军织成罗网，却一次次收到"共军去向不明"的电报——三万红军，已从网眼里钻了出去。' }
    ],
    '5': [
      { x: 60, y: 42, tag: '器物', t: '十三根铁链', s: '泸定桥建于康熙四十五年，一百零三米桥身由十三根铁链拉起。红军赶到时，守军已拆去桥板——只剩十三根寒光凛冽的铁索，横在天险之上。' },
      { x: 42, y: 50, tag: '人物', t: '二十二勇士', s: '二连连长廖大珠带领二十一名勇士，攀着铁索、冒着弹雨向东桥头冲去。他们中的大多数人没有留下姓名，只有四个名字流传至今。' },
      { x: 53, y: 64, tag: '战事', t: '一昼夜二百四十里', s: '接到命令时，红四团距桥头还有二百四十里。大雨滂沱、山路泥泞，对岸敌人打着火把行军，红军也点起火把"赛跑"——硬是提前赶到桥头。' },
      { x: 27, y: 38, tag: '事件', t: '桥头的大火', s: '守军在东桥头纵火，火焰封住桥门、铁索烫手。勇士们没有停——穿过火海，一举夺桥。当晚，全军从泸定桥越过天险大渡河。' }
    ],
    '6': [
      { x: 49, y: 56, tag: '器物', t: '一盏马灯', s: '风雪里，队伍把仅有的灯与火传给后面的人。老兵说：路，是一步一步走出来的；光，是一个人传给另一个人的。' },
      { x: 18, y: 66, tag: '人物', t: '金色的鱼钩', s: '过草地时，炊事班长用缝衣针弯成鱼钩，钓鱼给三个生病的小战士吃，自己嚼草根、吞鱼骨。老班长倒下时，那枚长满红锈的鱼钩，闪着金色的光芒。' },
      { x: 79, y: 30, tag: '地理', t: '神山夹金山', s: '夹金山终年积雪，当地人说"神鸟也飞不过"。六月里，红军还穿着单衣草鞋，喝下一碗辣椒水，一步一喘，翻过了这座大山。' },
      { x: 45, y: 15, tag: '事件', t: '草地七天', s: '松潘草地纵横五百余里，草皮下是黑色泥沼，一脚踩空就再难起身。战士们煮皮带、挖草根，互相搀扶着，走了整整七天。' }
    ],
    '7': [
      { x: 48, y: 48, tag: '事件', t: '三军尽开颜', s: '红一、红二、红四方面军在会宁、将台堡相继会师。三股铁流汇作一片——"更喜岷山千里雪，三军过后尽开颜"，从诗句变成了现实。' },
      { x: 54, y: 60, tag: '事件', t: '相拥而泣', s: '会师那天，两军将士认出彼此的军旗，发疯似的冲向对方，帽子抛上了天，抱头痛哭——他们从不同方向走来，走了整整两年。' },
      { x: 13, y: 62, tag: '人物', t: '三支铁流', s: '红一方面军跋涉二万五千里，红二方面军转战两万余里，红四方面军三过草地——三大主力纵横十余省，相继抵达西北。' },
      { x: 50, y: 22, tag: '事件', t: '奠基西北', s: '会师不到一年，全面抗战爆发。这支衣衫褴褛却信念如铁的队伍改编为八路军，东渡黄河、开赴前线——长征的终点，成了抗战的起点。' }
    ],
    '9': [
      { x: 11, y: 32, tag: '事件', t: '星星之火，可以燎原', s: '一九三〇年，毛泽东写下这个著名的判断。二十六年后，从长征走出来的队伍，让一个崭新的中国站了起来——星星之火，果真燎原。' },
      { x: 89, y: 20, tag: '事件', t: '山河无恙', s: '九十年后的今天，泸定桥上车流如织，会宁城里书声琅琅，于都河畔灯火万家。你们当年用生命守护的愿望，如今都实现了。' }
    ]
  };
  var CH_LABEL = {
    '1': '第壹章 · 于都', '2': '第贰章 · 湘江', '3': '第叁章 · 遵义',
    '4': '第肆章 · 赤水河', '5': '第伍章 · 泸定桥', '6': '第陆章 · 雪山草地',
    '7': '第柒章 · 会宁会师', '9': '终章 · 星火不灭'
  };

  /* ============ 二、注入星标 / 光晕 / 计数徽标 / 视差 ============ */
  var figures = [].slice.call(document.querySelectorAll('[data-hs]'));
  figures.forEach(function (fig) {
    var ch = fig.getAttribute('data-hs');
    var stage = fig.querySelector('.ch-stage');
    if (!stage) return;

    /* 光晕扫过层 */
    var shine = document.createElement('div');
    shine.className = 'ch-shine';
    stage.appendChild(shine);

    var list = HS[ch];
    if (list) {
      list.forEach(function (d, i) {
        var dot = document.createElement('div');
        dot.className = 'hs-dot';
        dot.dataset.x = d.x;
        dot.dataset.y = d.y;
        dot.style.left = d.x + '%';
        dot.style.top = d.y + '%';
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute('aria-label', '探索故事：' + d.t);
        var tip = '【' + d.tag + '】' + d.t;
        dot.innerHTML = '<i style="animation-delay:' + (i * 0.6).toFixed(1) + 's"></i><em>' + tip + '</em>';
        function open(e) {
          if (e.type === 'keydown') {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
          }
          openStory(ch, i, dot, fig);
        }
        dot.addEventListener('click', open);
        dot.addEventListener('keydown', open);
        stage.appendChild(dot);
      });

      /* 探索计数徽标 */
      var badge = document.createElement('div');
      badge.className = 'hs-badge';
      badge.innerHTML = '✦ 图中星标 <b>0/' + list.length + '</b>';
      fig.appendChild(badge);
      /* 寻遍本图后的完成提示：贴在点击区下缘，避开右上角里程 HUD */
      var doneNote = document.createElement('div');
      doneNote.className = 'hs-done';
      doneNote.setAttribute('aria-live', 'polite');
      doneNote.textContent = '图中星标已全部学完 · 继续前行';
      fig.appendChild(doneNote);
      fig._hs = { badge: badge, total: list.length, seen: 0, done: doneNote };
    }

    /* 指针视差 + 滚动视差（仅长卷模式；场景模式由全屏舞台接管） */
    if (canHover && !reduced && !window.SPARK_SCENE) {
      fig.addEventListener('pointermove', function (e) {
        var r = fig.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        fig.style.transform = 'perspective(900px) rotateX(' + (-py * 2.6).toFixed(2) + 'deg) rotateY(' + (px * 2.6).toFixed(2) + 'deg) translateY(var(--py,0px))';
      });
      fig.addEventListener('pointerleave', function () { fig.style.transform = 'translateY(var(--py,0px))'; });
    }
  });

  /* 图卷随滚动上下轻漂（仅长卷模式） */
  if (!reduced && !window.SPARK_SCENE) {
    var parallaxTick = function () {
      figures.forEach(function (fig) {
        var r = fig.getBoundingClientRect();
        if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        fig.style.setProperty('--py', (mid / window.innerHeight * -16).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', parallaxTick, { passive: true });
    parallaxTick();
  }

  /* 场景模式：图卷满屏 cover 裁切补偿（热点贴住画中物，且避开底部字幕带） */
  function mapXY(fig, x, y) {
    if (!window.SPARK_SCENE) return { x: x, y: y };
    var w = fig.clientWidth || 1, h = fig.clientHeight || 1;
    var ac = w / h, ai = 16 / 9;
    var rx = x, ry = y;
    if (ac > ai) ry = 50 + (y - 50) * (ac / ai);
    else if (ac < ai) rx = 50 + (x - 50) * (ai / ac);
    /* 钳制在可点区域：顶部避开 HUD，底部必须在字幕带之上（字幕带占底部约 45%） */
    ry = Math.max(11, Math.min(40, ry));
    rx = Math.max(8, Math.min(92, rx));
    return { x: rx, y: ry };
  }
  function placeAllDots() {
    figures.forEach(function (fig) {
      [].forEach.call(fig.querySelectorAll('.hs-dot'), function (dot) {
        var p = mapXY(fig, parseFloat(dot.dataset.x), parseFloat(dot.dataset.y));
        dot.style.left = p.x.toFixed(2) + '%';
        dot.style.top = p.y.toFixed(2) + '%';
      });
    });
  }
  window.addEventListener('resize', placeAllDots);
  placeAllDots();

  /* ============ 三、故事弹窗（逐句浮现 + 图鉴收集） ============ */
  var modal = document.getElementById('story-modal');
  var smTag = modal.querySelector('.sm-tag');
  var smCh = modal.querySelector('.sm-ch');
  var smTitle = modal.querySelector('.sm-title');
  var smText = modal.querySelector('.sm-text');
  var smFoot = modal.querySelector('.sm-foot');
  var smClose = modal.querySelector('.sm-close');

  /* 全程星火图鉴 */
  var colFound = 0;
  var colTotal = 0;
  Object.keys(HS).forEach(function (k) { colTotal += HS[k].length; });
  var hudCol = document.createElement('div');
  hudCol.id = 'hud-col';
  hudCol.innerHTML = '星火图鉴 <b>0/' + colTotal + '</b>';
  document.getElementById('hud-left').appendChild(hudCol);

  var toastBox = document.getElementById('toast-box');
  function showToast(html) {
    if (!toastBox) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    toastBox.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('show'); }); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 600);
    }, 2800);
  }

  /* 需要高亮的关键词（地名/人名/数字/精神词） */
  var KW = ['于都','湘江','遵义','赤水','大渡河','泸定','铁索','雪山','草地','会宁','延安',
    '红军','战士','战友','师长','团长','政委','总司令','主席','八万','五万','十三','二十二','三万',
    '浮桥','火把','棉衣','草鞋','篝火','河灯','军旗','星火','信念','牺牲','坚守','出发','胜利','会师'];
  function hl(text) {
    /* 对文本做关键词高亮，返回带 <em class="kw"> 的 HTML */
    var re = new RegExp('(' + KW.join('|') + ')', 'g');
    return text.replace(re, '<em class="kw">$1</em>');
  }
  function openStory(ch, i, dot, fig) {
    var d = HS[ch][i];
    smTag.textContent = d.tag;
    smCh.textContent = CH_LABEL[ch] || '';
    smTitle.textContent = d.t;
    /* 按章节给弹窗打标，CSS 据此刻画氛围动画（火光/水流/铁索/风雪…） */
    var card = modal.querySelector('.sm-card');
    if (card) {
      for (var ci = 0; ci < 10; ci++) card.classList.remove('sm-ch-' + ci);
      card.classList.add('sm-ch-' + ch);
    }
    /* 弹窗背景：优先用该章"史料瞬间"专属配图，缺图时降级回章节主图卷 */
    var smImg = modal.querySelector('.sm-img');
    var src = '';
    var secImg = fig && fig.querySelector('img');
    if (secImg) src = secImg.currentSrc || secImg.src;
    var sceneSrc = 'assets/img/scene/ch' + ch + '_story.jpg';
    var probe = new Image();
    probe.onload = function () { smImg.style.backgroundImage = 'url(' + sceneSrc + ')'; };
    probe.onerror = function () { smImg.style.backgroundImage = src ? 'url(' + src + ')' : 'none'; };
    probe.src = sceneSrc;
    /* 正文分句，逐句浮现（如墨迹次第晕开）+ 关键词高亮 */
    smText.innerHTML = '';
    var segs = d.s.match(/[^。！？]+[。！？]??/g) || [d.s];
    segs.forEach(function (seg, k) {
      var sp = document.createElement('span');
      sp.className = 'sm-seg';
      sp.innerHTML = hl(seg);
      sp.style.animationDelay = (0.3 + k * 0.55) + 's';
      smText.appendChild(sp);
    });
    var hs = fig._hs;
    var willSee = hs ? hs.seen + (dot.classList.contains('seen') ? 0 : 1) : 0;
    var allDone = hs && willSee >= hs.total;
    smFoot.textContent = allDone
      ? '✦ 图中的星标已全部学完 · 继续前行'
      : '✦ 图中还有其他星标 · 继续探索' + (hs ? '（' + willSee + '/' + hs.total + '）' : '');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ov-lock');
    if (window.SFX) {
      SFX.ink();
      /* v30 · 故事氛围音：随章节故事的画面响起对应声场 */
      if (SFX.isEnabled()) {
        if (ch === 2 || ch === 4 || ch === 5) SFX.water(3);
        else if (ch === 6) SFX.wind(3.5);
        else if (ch === 1 || ch === 7) SFX.crackle(5);
      }
    }

    /* 标记已发现 + 图鉴 */
    if (!dot.classList.contains('seen')) {
      dot.classList.add('seen');
      var h = fig._hs;
      if (h) {
        h.seen++;
        if (h.seen >= h.total) {
          h.badge.innerHTML = '✦ ' + h.total + ' / ' + h.total + ' · 已寻遍';
          h.badge.classList.add('all');
          if (h.done) h.done.classList.add('show');
          var r = fig.getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          if (window.SparkFX) { SparkFX.burst(cx, cy, 22, true); SparkFX.ring(cx, cy, true); }
          if (window.SFX) setTimeout(function () { SFX.chime(false); }, 300);
        } else {
          h.badge.innerHTML = '✦ 图中星标 <b>' + h.seen + '/' + h.total + '</b>';
        }
      }
      colFound++;
      hudCol.classList.add('show');
      hudCol.innerHTML = '星火图鉴 <b>' + colFound + '/' + colTotal + '</b>';
      showToast('✦ 寻得故事 · <em>' + d.t + '</em>（' + colFound + '/' + colTotal + '）');
      if (colFound === colTotal) {
        setTimeout(function () {
          showToast('✦ 三十段星火，尽数寻得 —— 你把这条路走成了自己的');
          if (window.SFX) SFX.chime(true);
        }, 3000);
      }
    }
    var dr = dot.getBoundingClientRect();
    if (window.SparkFX) SparkFX.burst(dr.left + dr.width / 2, dr.top + dr.height / 2, 10, true);
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ov-lock');
    if (window.SFX) SFX.pluck(320);
  }
  smClose.addEventListener('click', closeModal);
  modal.querySelector('.sm-backdrop').addEventListener('click', closeModal);

  /* ============ 四、征程总图（SVG） ============ */
  var NODES = [
    { ch: 1, name: '于都',     sub: '1934.10 · 出发',  x: 860, y: 430, f: 0 },
    { ch: 2, name: '湘江',     sub: '1934.12 · 血战',  x: 700, y: 378, f: 0.15 },
    { ch: 3, name: '遵义',     sub: '1935.1 · 转折',   x: 565, y: 292, f: 0.30 },
    { ch: 4, name: '赤水',     sub: '1935.1-3 · 四渡', x: 452, y: 330, f: 0.45 },
    { ch: 5, name: '泸定桥',   sub: '1935.5 · 飞夺',   x: 300, y: 190, f: 0.65 },
    { ch: 6, name: '雪山草地', sub: '1935.6-8',        x: 382, y: 98,  f: 0.82 },
    { ch: 7, name: '会宁会师', sub: '1936.10',         x: 618, y: 72,  f: 1 }
  ];
  var MAP_PATH = 'M860,430 C812,424 748,402 700,378 C655,356 610,322 565,292 C528,282 482,296 452,330 C400,368 320,372 268,330 C230,300 262,232 300,190 C325,155 348,120 382,98 C440,62 540,52 618,72';
  var MAP_LOOP = 'M452,330 C436,306 402,310 406,330 C409,346 438,348 446,336';
  var MAP_TAIL = 'M646,64 C706,42 762,36 822,44';

  var maps = [];
  function buildMap(host) {
    var uid = 'rmg-' + maps.length;
    var nodes = NODES.map(function (n) {
      return '<g class="mn" data-ch="' + n.ch + '" data-f="' + n.f + '" transform="translate(' + n.x + ',' + n.y + ')" role="button" tabindex="0" aria-label="前往' + n.name + '">' +
        '<circle class="mn-hit" r="30" fill="transparent"></circle>' +
        '<circle class="mn-ring" r="13"></circle>' +
        '<circle class="mn-core" r="' + (n.ch === 7 ? 12 : 9) + '"></circle>' +
        '<circle class="mn-dot" r="3"></circle>' +
        '<text class="mn-name" y="42">' + n.name + '</text>' +
        '<text class="mn-sub" y="59">' + n.sub + '</text>' +
        '</g>';
    }).join('');
    host.innerHTML =
      '<svg viewBox="0 0 1000 520" class="rm-svg" preserveAspectRatio="xMidYMid meet" aria-label="长征路线图">' +
      '<defs><linearGradient id="' + uid + '" x1="0" y1="1" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#e8842d"></stop><stop offset="1" stop-color="#ffc46b"></stop>' +
      '</linearGradient></defs>' +
      '<text class="rm-cap" x="838" y="404">一九三四 · 江西于都</text>' +
      '<path class="rm-tail" d="' + MAP_TAIL + '"></path>' +
      '<text class="rm-cap rm-tail-t" x="832" y="34">陕北 · 延安</text>' +
      '<path class="rm-base" pathLength="1" d="' + MAP_PATH + '"></path>' +
      '<path class="rm-loop" d="' + MAP_LOOP + '"></path>' +
      '<path class="rm-lit" pathLength="1" style="stroke:url(#' + uid + ')" d="' + MAP_PATH + '"></path>' +
      '<circle class="rm-spark" r="3.5"><animateMotion dur="26s" repeatCount="indefinite" path="' + MAP_PATH + '"></animateMotion></circle>' +
      nodes + '</svg>';
    var svg = host.querySelector('svg');
    svg.addEventListener('click', function (e) {
      var g = e.target.closest('.mn');
      if (g) goChapter(+g.getAttribute('data-ch'), g);
    });
    svg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('.mn');
      if (g) { e.preventDefault(); goChapter(+g.getAttribute('data-ch'), g); }
    });
    var inst = { svg: svg, lit: svg.querySelector('.rm-lit'), nodes: [].slice.call(svg.querySelectorAll('.mn')) };
    maps.push(inst);
    return inst;
  }

  /* 首屏内嵌图 */
  var heroMap = document.getElementById('route-map');
  if (heroMap) {
    buildMap(heroMap);
    var mapIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { heroMap.classList.add('play'); mapIO.disconnect(); }
      });
    }, { threshold: 0.25 });
    mapIO.observe(heroMap);
  }

  /* ============ 五、征程图浮窗 ============ */
  var overlay = document.getElementById('map-overlay');
  var ovMap = document.getElementById('route-map-2');
  var ovBuilt = false;

  function openOverlay() {
    if (!ovBuilt) {
      buildMap(ovMap);
      ovBuilt = true;
      requestAnimationFrame(function () { ovMap.classList.add('play'); });
    }
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ov-lock');
    if (window.SFX) SFX.tick();
    syncMaps();
  }
  function closeOverlay() {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ov-lock');
  }

  var mapBtn = document.getElementById('map-btn');
  mapBtn.addEventListener('click', openOverlay);
  mapBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(); }
  });
  overlay.querySelector('.mo-close').addEventListener('click', closeOverlay);
  overlay.querySelector('.mo-backdrop').addEventListener('click', closeOverlay);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('show')) closeModal();
    else if (overlay.classList.contains('show')) closeOverlay();
  });

  function goChapter(ch, g) {
    var r = g.getBoundingClientRect();
    if (window.SparkFX) SparkFX.burst(r.left + r.width / 2, r.top + r.height / 2, 14, true);
    if (window.SFX) SFX.pluck(480 + ch * 40);
    closeOverlay();
    if (window.SparkGoTo) {
      window.SparkGoTo(ch);
    } else {
      var sec = document.getElementById('ch' + ch);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ============ 五点五、图卷环境粒子（风雪/火星/雨幕/浮尘/浪雾/星光） ============ */
  var AMBIENT = {
    '1': { type: 'ember', n: 26 },
    '2': { type: 'rain', n: 55 },
    '3': { type: 'mote', n: 22 },
    '4': { type: 'ember', n: 20 },
    '5': { type: 'mist', n: 16 },
    '6': { type: 'snow', n: 70 },
    '7': { type: 'ember', n: 30 },
    '9': { type: 'ember', n: 40 }   /* 星火燎原：满屏升腾的火星 */
  };
  var ambientList = [];

  function sizeAmbient(item) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = item.cv.clientWidth, h = item.cv.clientHeight;
    if (!w || !h) return;
    item.cv.width = w * dpr; item.cv.height = h * dpr;
    item.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    item.w = w; item.h = h;
  }

  function newAmbientP(item, anywhere) {
    var t = item.conf.type, w = item.w || 300, h = item.h || 170;
    var p = { x: Math.random() * w, y: Math.random() * h, r: 1, a: 1, vx: 0, vy: 0, tw: Math.random() * 6.28, ph: Math.random() * 6.28 };
    if (t === 'ember') { p.r = 0.8 + Math.random() * 1.8; p.vy = -(0.22 + Math.random() * 0.55); p.vx = (Math.random() - 0.5) * 0.3; p.a = 0.25 + Math.random() * 0.55; }
    else if (t === 'rain') { p.len = 9 + Math.random() * 14; p.vy = 4.2 + Math.random() * 3; p.vx = 0.55; p.a = 0.1 + Math.random() * 0.15; if (!anywhere) p.y = -p.len; }
    else if (t === 'mote') { p.r = 0.7 + Math.random() * 1.4; p.vy = -(0.05 + Math.random() * 0.14); p.vx = (Math.random() - 0.5) * 0.14; p.a = 0.18 + Math.random() * 0.38; }
    else if (t === 'mist') { p.r = 16 + Math.random() * 30; p.vy = -(0.08 + Math.random() * 0.22); p.vx = (Math.random() - 0.3) * 0.2; p.a = 0.028 + Math.random() * 0.045; if (!anywhere) p.y = h + p.r; }
    else if (t === 'snow') { p.r = 0.8 + Math.random() * 2.1; p.vy = 0.45 + Math.random() * 1.05; p.vx = -0.3 - Math.random() * 0.5; p.a = 0.26 + Math.random() * 0.5; if (!anywhere) p.y = -8; }
    else if (t === 'star') { p.r = 0.6 + Math.random() * 1.5; p.a = 0.28 + Math.random() * 0.55; if (p.y > h * 0.6) p.y = Math.random() * h * 0.6; }
    return p;
  }

  function runAmbient(item) {
    if (!item.ps.length) {
      item.ps = [];
      for (var i = 0; i < item.conf.n; i++) item.ps.push(newAmbientP(item, true));
    }
    cancelAnimationFrame(item.raf);
    (function tick() {
      if (!item.running) return;
      var ctx = item.ctx, w = item.w, h = item.h, t = item.conf.type;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < item.ps.length; i++) {
        var p = item.ps[i];
        if (t === 'star') {
          p.tw += 0.018;
          var sa = p.a * (0.4 + 0.6 * Math.abs(Math.sin(p.tw)));
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(255,228,175,' + sa.toFixed(3) + ')'; ctx.fill();
          continue;
        }
        p.x += p.vx; p.y += p.vy;
        if (t === 'snow') { p.ph += 0.012; p.x += Math.sin(p.ph) * 0.4; }
        if (t === 'ember' || t === 'mote') p.tw += 0.05;
        if (p.y < -50 || p.y > h + 60 || p.x < -70 || p.x > w + 70) {
          item.ps[i] = newAmbientP(item, false);
          if (t === 'rain') item.ps[i].y = -item.ps[i].len;
          if (t === 'mist') item.ps[i].y = h + item.ps[i].r;
          continue;
        }
        var al = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        if (t === 'rain') {
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.len * 0.16, p.y + p.len);
          ctx.strokeStyle = 'rgba(172,192,218,' + al.toFixed(3) + ')';
          ctx.lineWidth = 1; ctx.stroke();
        } else if (t === 'mist') {
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(188,204,226,' + al.toFixed(3) + ')'; ctx.fill();
        } else if (t === 'snow') {
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(236,243,251,' + al.toFixed(3) + ')'; ctx.fill();
        } else {
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(255,190,100,' + al.toFixed(3) + ')'; ctx.fill();
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.6, 0, 6.2832);
          ctx.fillStyle = 'rgba(255,160,60,' + (al * 0.15).toFixed(3) + ')'; ctx.fill();
        }
      }
      item.raf = requestAnimationFrame(tick);
    })();
  }

  if (!reduced) {
    figures.forEach(function (fig) {
      var conf = AMBIENT[fig.getAttribute('data-hs')];
      var stage = fig.querySelector('.ch-stage');
      if (!conf || !stage) return;
      var cv = document.createElement('canvas');
      cv.className = 'afx-canvas';
      stage.appendChild(cv);
      var item = { fig: fig, cv: cv, ctx: cv.getContext('2d'), conf: conf, ps: [], running: false, raf: 0, w: 0, h: 0 };
      ambientList.push(item);
      var aio = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          /* 场景模式：仅当前幕运行 */
          var on = en.isIntersecting &&
            (!window.SPARK_SCENE || fig.closest('.panel').classList.contains('current'));
          if (on !== item.running) {
            item.running = on;
            if (on) { sizeAmbient(item); runAmbient(item); }
            else cancelAnimationFrame(item.raf);
          }
        });
      }, { threshold: 0.04 });
      aio.observe(fig);
    });
    window.addEventListener('resize', function () {
      ambientList.forEach(function (it) { sizeAmbient(it); });
    });
    /* 场景引擎换幕时同步启停 */
    window.SparkAmbientRefresh = function () {
      ambientList.forEach(function (it) {
        var on = it.fig.closest('.panel').classList.contains('current');
        if (on !== it.running) {
          it.running = on;
          if (on) { sizeAmbient(it); runAmbient(it); }
          else cancelAnimationFrame(it.raf);
        }
      });
    };
  }

  /* ============ 五点六、互动达成奖励：全屏影像苏醒 ============ */
  window.SparkReward = function (ch) {
    var key = String(ch);
    var fig = document.querySelector('[data-hs="' + key + '"]');
    if (!fig || fig._rewarded) return;
    fig._rewarded = true;
    /* 本章背景影像常驻（含影像步） */
    if (window.SparkSceneVideo) SparkSceneVideo(+key);
    /* 庆祝：行军鼓 + 琶音 + 星火迸发 */
    if (window.SFX) { SFX.march(); setTimeout(function () { SFX.chime(true); }, 700); }
    if (window.SparkFX) {
      var r = fig.getBoundingClientRect();
      SparkFX.jolt(false);
      SparkFX.burst(r.left + r.width / 2, r.top + r.height / 2, 30, true);
      SparkFX.ring(r.left + r.width / 2, r.top + r.height / 2, true);
    }
    showToast('✦ 图卷苏醒 · 影像浮现');
  };

  /* ============ 六、行军进度 / 当前章节 → 双图同步 ============ */
  var exSecs = [].slice.call(document.querySelectorAll('.panel'));

  function syncMaps() {
    var p = window.SparkRouteP || 0;
    var cur;
    if (window.SparkCur != null) {
      cur = window.SparkCur;
    } else {
      var center = (window.scrollY || 0) + window.innerHeight / 2;
      var best = Infinity;
      cur = -1;
      exSecs.forEach(function (s, i) {
        var mid = s.offsetTop + s.offsetHeight / 2;
        var dd = Math.abs(mid - center);
        if (dd < best) { best = dd; cur = i; }
      });
    }
    maps.forEach(function (m) {
      m.lit.style.strokeDashoffset = (1 - p).toFixed(4);
      m.nodes.forEach(function (n) {
        n.classList.toggle('lit', p >= parseFloat(n.getAttribute('data-f')) - 0.02);
        n.classList.toggle('cur', +n.getAttribute('data-ch') === cur);
      });
    });
  }
  window.SparkMapsSync = syncMaps;

  window.addEventListener('scroll', function () {
    syncMaps();
    if (!window.SPARK_SCENE) {
      mapBtn.classList.toggle('show', (window.scrollY || 0) > window.innerHeight * 0.35);
    }
  }, { passive: true });
  syncMaps();
})();
