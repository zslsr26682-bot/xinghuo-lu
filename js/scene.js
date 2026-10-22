/* ============================================================
   星火之路 · 3D 场景引擎（Three.js r128，本地离线运行）
   地形 / 长征路线 / 星火粒子 / 滚动驱动运镜 / 节点标注
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 坐标与地形 ---------- */
  var LNG0 = 105, LAT0 = 31, S = 1.6;
  function px(lng) { return (lng - LNG0) * S; }
  function pz(lat) { return -(lat - LAT0) * S; }

  function gauss(x, z, cx, cz, s) {
    var dx = x - cx, dz = z - cz;
    return Math.exp(-(dx * dx + dz * dz) / (2 * s * s));
  }

  /* 地形高度场：噪声基底 + 山系高斯隆起 */
  function terrainH(x, z) {
    var h = 0;
    h += 0.55 * Math.sin(x * 0.32 + 1.7) * Math.cos(z * 0.27 + 0.4);
    h += 0.28 * Math.sin(x * 0.85 + z * 0.62);
    h += 0.16 * Math.cos(x * 1.7 - z * 1.3);
    h += Math.max(0, -x - 3.2) * 0.5;              // 川西高原整体抬升
    h += gauss(x, z, -3.68, 0.32, 1.35) * 3.6;     // 夹金山
    h += gauss(x, z, -4.1, -0.9, 1.15) * 2.9;      // 梦笔山
    h += gauss(x, z, -4.5, 1.7, 1.6) * 2.6;        // 邛崃山脉
    h += gauss(x, z, -5.3, 3.7, 1.8) * 2.1;        // 大凉山
    h += gauss(x, z, -3.2, -2.8, 1.3) * 2.0;       // 草地西北高地
    h += gauss(x, z, 2.4, 5.9, 1.1) * 1.3;         // 娇山（娄山关）
    h += gauss(x, z, 3.2, -7.4, 1.5) * 1.8;        // 六盘山
    h += gauss(x, z, 14.5, 7.2, 2.6) * 1.1;        // 于都东南丘陵
    h += gauss(x, z, 6.8, 10.2, 2.6) * 1.0;        // 南岭余脉
    h += gauss(x, z, -1.2, -11.0, 3.0) * 1.4;      // 黄土高原北缘
    h += gauss(x, z, 9.8, -9.5, 2.6) * 1.2;        // 陕北梁峁
    return h;
  }

  /* ---------- 长征路线途经点（经纬度概略，风格化表达） ---------- */
  var WPTS = [
    { n: '于都', sub: '1934.10 出发', lng: 115.40, lat: 25.90, major: true },
    { lng: 114.20, lat: 25.45 },
    { n: '湘江', sub: '血战 1934.12', lng: 111.05, lat: 25.90, major: true },
    { lng: 109.40, lat: 25.85 },
    { lng: 108.20, lat: 26.60 },
    { n: '遵义', sub: '转折 1935.1', lng: 106.90, lat: 27.70, major: true },
    { lng: 106.00, lat: 28.15 },
    { lng: 105.35, lat: 28.05 },
    { lng: 106.15, lat: 27.95 },
    { n: '赤水', sub: '四渡赤水 1935.1—3', lng: 105.80, lat: 27.80, major: true },
    { lng: 104.20, lat: 26.90 },
    { n: '皎平渡', sub: '巧渡金沙江', lng: 102.35, lat: 26.25, major: true },
    { lng: 102.25, lat: 27.40 },
    { n: '安顺场', sub: '强渡大渡河', lng: 102.18, lat: 29.25, major: true },
    { n: '泸定桥', sub: '飞夺 1935.5.29', lng: 102.23, lat: 29.90, major: true },
    { n: '夹金山', sub: '翻越第一座大雪山', lng: 102.70, lat: 30.75, major: true },
    { lng: 102.36, lat: 31.20 },
    { lng: 103.10, lat: 32.60 },
    { n: '草地', sub: '穿越水草地', lng: 102.55, lat: 33.10, major: true },
    { n: '腊子口', sub: '突破天险', lng: 103.95, lat: 34.00, major: false },
    { n: '哈达铺', sub: '整编陕甘支队', lng: 104.90, lat: 34.05, major: false },
    { n: '吴起镇', sub: '1935.10 到达陕北', lng: 108.20, lat: 36.90, major: true },
    { n: '会宁·将台堡', sub: '会师 1936.10.22', lng: 105.35, lat: 35.85, major: true }
  ];

  /* 各章节对应的路线进度 u（0~1）与运镜参数 */
  var CH_CAM = [
    { special: 'hero' },                                            // 0 封面
    { u: 0.000, az: 1.05, d: 12.0, h: 7.5 },                       // 1 于都
    { u: 0.118, az: 1.20, d: 11.0, h: 7.0 },                       // 2 湘江（弧长标定）
    { u: 0.244, az: 0.50, d: 11.0, h: 7.5 },                       // 3 遵义（弧长标定）
    { u: 0.323, az: -0.60, d: 8.5, h: 5.5 },                       // 4 赤水（弧长标定）
    { u: 0.559, az: 0.35, d: 8.5, h: 5.0 },                        // 5 泸定（弧长标定）
    { u: 0.660, az: -0.50, d: 12.0, h: 9.5 },                      // 6 雪山草地（夹金山—草地之间）
    { u: 0.990, az: 0.90, d: 14.0, h: 9.0 },                       // 7 会师（弧长标定）
    { special: 'data' },                                            // 8 数据长卷
    { special: 'end' }                                              // 9 结语
  ];

  function SparkScene(canvas, labelRoot) {
    this.canvas = canvas;
    this.labelRoot = labelRoot;
    this.isMobile = window.matchMedia('(max-width: 820px)').matches;
    this.mouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this.hotNode = -1;
    this._build();
    this._bind();
  }

  SparkScene.prototype._build = function () {
    var renderer = this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0a0e14, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0e14, 0.021);
    this._bg = new THREE.Color(0x0a0e14);
    this._bgTarget = new THREE.Color(0x0a0e14);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
    this.camera.position.set(10, 24, 30);
    this.camLook = new THREE.Vector3(4, 0, 2);

    /* 光照 */
    this.scene.add(new THREE.HemisphereLight(0x33414f, 0x0b0e13, 1.0));
    var sun = new THREE.DirectionalLight(0xffd9a6, 0.5);
    sun.position.set(8, 14, 6);
    this.scene.add(sun);

    this._buildTerrain();
    this._buildRoute();
    this._buildMarkers();
    this._buildStarFire();
    this._buildEmbers();
    this._buildLabels();
    this.resize();
  };

  /* ---------- 地形 ---------- */
  SparkScene.prototype._buildTerrain = function () {
    var geo = new THREE.PlaneGeometry(44, 34, 132, 102);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    var colors = new Float32Array(pos.count * 3);
    var cLow = new THREE.Color(0x0b0f15),
        cMid = new THREE.Color(0x1a2431),
        cHigh = new THREE.Color(0x2e3a49),
        cSnow = new THREE.Color(0x7f8ea6);
    var tmp = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      var h = terrainH(x, z);
      pos.setY(i, h);
      if (h < 1.2) tmp.copy(cLow).lerp(cMid, Math.max(0, h) / 1.2);
      else tmp.copy(cMid).lerp(cHigh, Math.min(1, (h - 1.2) / 1.8));
      if (h > 2.9) tmp.lerp(cSnow, Math.min(1, (h - 2.9) / 1.4));
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    var mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0;
    this.scene.add(mesh);
  };

  /* ---------- 路线 ---------- */
  SparkScene.prototype._buildRoute = function () {
    var pts = [];
    for (var i = 0; i < WPTS.length; i++) {
      var w = WPTS[i];
      var x = px(w.lng), z = pz(w.lat);
      pts.push(new THREE.Vector3(x, terrainH(x, z) + 0.32, z));
    }
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);

    /* 光晕管 */
    var haloGeo = new THREE.TubeGeometry(this.curve, 420, 0.30, 8, false);
    var haloMat = new THREE.MeshBasicMaterial({
      color: 0xff7a2d, transparent: true, opacity: 0.20,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloCount = haloGeo.index.count;
    this.scene.add(this.haloMesh);

    /* 核心亮管 */
    var coreGeo = new THREE.TubeGeometry(this.curve, 420, 0.075, 8, false);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0xffc46b });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreCount = coreGeo.index.count;
    this.scene.add(this.coreMesh);

    /* 行军火种（路线前端光点） */
    var glowTex = this._glowTexture();
    var sparkGeo = new THREE.SphereGeometry(0.16, 12, 12);
    var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffe0a8 });
    this.spark = new THREE.Mesh(sparkGeo, sparkMat);
    this.scene.add(this.spark);
    var sprMat = new THREE.SpriteMaterial({
      map: glowTex, color: 0xffb84d, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.sparkGlow = new THREE.Sprite(sprMat);
    this.sparkGlow.scale.set(2.6, 2.6, 1);
    this.scene.add(this.sparkGlow);

    this.setRouteProgress(0);
  };

  SparkScene.prototype._glowTexture = function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,200,120,0.9)');
    grad.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  };

  SparkScene.prototype.setRouteProgress = function (p) {
    p = Math.max(0.0001, Math.min(1, p));
    this.routeP = p;
    this.coreMesh.geometry.setDrawRange(0, Math.floor(this.coreCount * p));
    this.haloMesh.geometry.setDrawRange(0, Math.floor(this.haloCount * p));
    var pt = this.curve.getPointAt(p);
    var tan = this.curve.getTangentAt(p);
    this.spark.position.copy(pt);
    this.sparkGlow.position.copy(pt);
    this.sparkGlow.material.opacity = 0.55 + Math.sin(this.clock.elapsedTime * 5) * 0.25;
  };

  /* 飞行段：全程路线淡影先行铺出，进度亮管在其上生长 */
  SparkScene.prototype.setGhostRoute = function (on) {
    if (on) {
      this.haloMesh.geometry.setDrawRange(0, this.haloCount);
      this.haloMesh.material.opacity = 0.12;
      this.coreMesh.material.transparent = true;
      this.coreMesh.material.opacity = 0.28;
      this.coreMesh.geometry.setDrawRange(0, this.coreCount);
    } else {
      this.haloMesh.material.opacity = 0.20;
      this.coreMesh.material.opacity = 1;
      this.setRouteProgress(this.routeP);
    }
  };

  /* ---------- 途经点标记 ---------- */
  SparkScene.prototype._buildMarkers = function () {
    var glowTex = this._glowTexture();
    this.markers = [];
    var majorIdx = [];
    for (var i = 0; i < WPTS.length; i++) {
      var w = WPTS[i];
      if (!w.major && !w.n) continue;
      var x = px(w.lng), z = pz(w.lat);
      var y = terrainH(x, z) + 0.45;
      var sprMat = new THREE.SpriteMaterial({
        map: glowTex, color: 0xff9a4d, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      var spr = new THREE.Sprite(sprMat);
      spr.scale.set(w.major ? 1.7 : 1.1, w.major ? 1.7 : 1.1, 1);
      spr.position.set(x, y + 0.35, z);
      this.scene.add(spr);
      this.markers.push({ w: w, spr: spr, x: x, y: y, z: z, idx: i });
    }
  };

  /* ---------- 大地星火（散布的火种） ---------- */
  SparkScene.prototype._buildStarFire = function () {
    var N = this.isMobile ? 260 : 520;
    var pos = new Float32Array(N * 3);
    var sz = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var x = (Math.random() - 0.5) * 40;
      var z = (Math.random() - 0.5) * 30;
      pos[i * 3] = x;
      pos[i * 3 + 1] = terrainH(x, z) + 0.06 + Math.random() * 0.6;
      pos[i * 3 + 2] = z;
      sz[i] = Math.random();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffa85c, size: 0.34, map: this._glowTexture(),
      transparent: true, opacity: 0.55, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    this.starFire = new THREE.Points(geo, mat);
    this.scene.add(this.starFire);
  };

  /* ---------- 空中飞舞的余烬 ---------- */
  SparkScene.prototype._buildEmbers = function () {
    var N = this.isMobile ? 350 : 700;
    var pos = new Float32Array(N * 3);
    var spd = new Float32Array(N);
    var pha = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 42;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 32;
      spd[i] = 0.25 + Math.random() * 0.6;
      pha[i] = Math.random() * Math.PI * 2;
    }
    this.emberSpd = spd; this.emberPha = pha;
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffb168, size: 0.22, map: this._glowTexture(),
      transparent: true, opacity: 0.7, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    this.embers = new THREE.Points(geo, mat);
    this.scene.add(this.embers);
  };

  /* ---------- HTML 标注 ---------- */
  SparkScene.prototype._buildLabels = function () {
    this.labels = [];
    for (var i = 0; i < this.markers.length; i++) {
      var m = this.markers[i];
      if (!m.w.n) continue;
      var el = document.createElement('div');
      el.className = 'node-label';
      el.innerHTML = '<span class="nl-name">' + m.w.n + '</span>' +
        (m.w.sub ? '<span class="nl-sub">' + m.w.sub + '</span>' : '');
      this.labelRoot.appendChild(el);
      this.labels.push({ el: el, m: m, base: m.y });
    }
  };

  /* ---------- 运镜 ---------- */
  SparkScene.prototype._camStateFor = function (ch) {
    var c = CH_CAM[Math.max(0, Math.min(9, ch))];
    if (c.special === 'hero') {
      return { pos: new THREE.Vector3(10, 24, 30), look: new THREE.Vector3(4, 0, 2) };
    }
    if (c.special === 'data') {
      return { pos: new THREE.Vector3(6, 20, 26), look: new THREE.Vector3(2, 0, 0) };
    }
    if (c.special === 'end') {
      return { pos: new THREE.Vector3(0, 27, 13), look: new THREE.Vector3(2, 0, -2) };
    }
    var p = this.curve.getPointAt(c.u);
    var tan = this.curve.getTangentAt(c.u);
    var pos = new THREE.Vector3(
      p.x + Math.cos(c.az) * c.d, p.y + c.h, p.z + Math.sin(c.az) * c.d
    );
    var look = new THREE.Vector3(p.x + tan.x * 5, p.y + 0.8, p.z + tan.z * 5);
    return { pos: pos, look: look };
  };

  function smootherstep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /* p: 整页滚动进度0~1；ts: 各章节中心对应的进度断点；active: 当前章节 */
  SparkScene.prototype.updateCamera = function (p, ts, active) {
    /* 断点间平滑插值 */
    var i = 0;
    while (i < ts.length - 1 && p > ts[i + 1]) i++;
    var t0 = ts[i], t1 = ts[Math.min(i + 1, ts.length - 1)];
    var f = t1 > t0 ? Math.max(0, Math.min(1, (p - t0) / (t1 - t0))) : 0;
    f = smootherstep(f);

    var a = this._camStateFor(i), b = this._camStateFor(Math.min(i + 1, 9));
    var pos = new THREE.Vector3().lerpVectors(a.pos, b.pos, f);
    var look = new THREE.Vector3().lerpVectors(a.look, b.look, f);

    /* 呼吸漂移 + 鼠标视差 */
    var et = this.clock.getElapsedTime();
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      pos.x += Math.sin(et * 0.4) * 0.5 + this.mouse.x * 1.1;
      pos.y += Math.sin(et * 0.27) * 0.3 - this.mouse.y * 0.55;
      pos.z += Math.cos(et * 0.34) * 0.5;
    }
    this.camera.position.copy(pos);
    this.camLook.lerp(look, 0.12);
    this.camera.lookAt(this.camLook);
  };

  /* 标注随镜头投影更新 */
  SparkScene.prototype._updateLabels = function (active) {
    var v = new THREE.Vector3();
    var w = this.width, h = this.height;
    /* 封面与结尾区隐藏标签，避免与文案重叠 */
    var showLabels = active >= 1 && active <= 7;
    var chapterNode = { 1: '于都', 2: '湘江', 3: '遵义', 4: '赤水', 5: '泸定桥', 6: '夹金山', 7: '会宁·将台堡' };
    var hotName = chapterNode[active];
    if (!showLabels) {
      for (var k = 0; k < this.labels.length; k++) this.labels[k].el.style.opacity = '0';
      return;
    }
    for (var i = 0; i < this.labels.length; i++) {
      var L = this.labels[i];
      v.set(L.m.x, L.m.y + 0.6, L.m.z).project(this.camera);
      var vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      var el = L.el;
      if (!vis) { el.style.opacity = '0'; continue; }
      var sx = (v.x * 0.5 + 0.5) * w;
      var sy = (-v.y * 0.5 + 0.5) * h;
      el.style.transform = 'translate(-50%,-130%) translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      el.style.opacity = '1';
      el.classList.toggle('hot', !!hotName && L.m.w.n === hotName);
    }
  };

  /* ---------- 场景色调：随章节情绪渐变（雾色即天色） ---------- */
  var ATMO = {
    0: 0x0a0e14, 1: 0x0d1014, 2: 0x150d0d, 3: 0x0b0e13,
    4: 0x0c1013, 5: 0x120d10, 6: 0x0a1220, 7: 0x170f08,
    8: 0x0d0e14, 9: 0x100e12
  };
  SparkScene.prototype.setAtmosphere = function (ch) {
    this._bgTarget.setHex(ATMO[ch] != null ? ATMO[ch] : ATMO[0]);
  };

  /* ---------- 每帧 ---------- */
  SparkScene.prototype._tick = function () {
    var dt = Math.min(this.clock.getDelta(), 0.05);
    var et = this.clock.getElapsedTime();

    /* 天色随章节情绪渐变 */
    this._bg.lerp(this._bgTarget, 0.02);
    this.scene.fog.color.copy(this._bg);
    this.renderer.setClearColor(this._bg);

    /* 余烬上浮 */
    var arr = this.embers.geometry.attributes.position.array;
    for (var i = 0; i < this.emberSpd.length; i++) {
      var y = arr[i * 3 + 1] + this.emberSpd[i] * dt;
      if (y > 16) y = 0;
      arr[i * 3 + 1] = y;
      arr[i * 3] += Math.sin(et * 0.8 + this.emberPha[i]) * 0.004;
    }
    this.embers.geometry.attributes.position.needsUpdate = true;

    /* 大地星火呼吸 */
    this.starFire.material.opacity = 0.42 + Math.sin(et * 1.6) * 0.14;

    /* 火种脉冲 */
    if (this.sparkGlow.material) {
      this.sparkGlow.material.opacity = 0.5 + Math.sin(et * 5) * 0.3;
    }

    if (this.onFrame) this.onFrame();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tickBound);
  };

  SparkScene.prototype._bind = function () {
    var self = this;
    this._tickBound = function () { self._tick(); };
    requestAnimationFrame(this._tickBound);
    window.addEventListener('resize', function () { self.resize(); });
    window.addEventListener('pointermove', function (e) {
      self.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      self.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  };

  SparkScene.prototype.resize = function () {
    this.isMobile = window.matchMedia('(max-width: 820px)').matches;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  };

  /* 供 app.js 调用：更新进度与章节 */
  SparkScene.prototype.setFrame = function (p, ts, active) {
    this.updateCamera(p, ts, active);
    this._updateLabels(active);
  };

  window.SparkScene = SparkScene;
})();
