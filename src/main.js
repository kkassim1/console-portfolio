import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { projects } from './projects.js';

buildFallbackGrid();
buildProjectNavigation();

if (!isWebGLAvailable()) {
  document.querySelectorAll('.site-header, .hero-copy, .project-dock, .hint').forEach((el) => el.remove());
} else {
  document.body.classList.add('has-webgl');
  bootScene();
}

function bootScene() {
  const app = document.getElementById('app');
  const useRoomBackplate = true;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ alpha: useRoomBackplate, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.6 : 2));
  renderer.setSize(app.clientWidth, app.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = !isTouch;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (!useRoomBackplate) {
    scene.background = new THREE.Color('#100d0a');
    scene.fog = new THREE.FogExp2('#100d0a', 0.034);
  }

  const camera = new THREE.PerspectiveCamera(39, app.clientWidth / app.clientHeight, 0.1, 80);
  const desktopPosition = new THREE.Vector3(0, 3.1, 11.5);
  const mobilePosition = new THREE.Vector3(0, 3.7, 12.8);
  camera.position.copy(window.innerWidth < 820 ? mobilePosition : desktopPosition);

  scene.add(new THREE.HemisphereLight('#d9ffb3', '#10120d', 1.4));
  const key = new THREE.DirectionalLight('#fff8dc', 3.5);
  key.position.set(-4, 8, 6);
  key.castShadow = !isTouch;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.PointLight('#c6ff44', 20, 14, 2);
  rim.position.set(4, 1, -3);
  scene.add(rim);
  const warm = new THREE.PointLight('#ff7548', 12, 10, 2);
  warm.position.set(-4, 0, 2);
  scene.add(warm);

  const stage = new THREE.Group();
  stage.position.y = -0.25;
  scene.add(stage);

  const room = useRoomBackplate ? buildBackplateRoom() : buildRoom(stage, isTouch);
  const consoleModel = buildConsoleFallback();
  if (useRoomBackplate) {
    consoleModel.position.set(0, -0.3, -0.72);
    consoleModel.scale.setScalar(0.58);
    stage.add(consoleModel);
    room.bindConsole(consoleModel);
  } else {
    consoleModel.position.set(0, -0.04, -1.3);
    consoleModel.scale.setScalar(0.78);
    stage.add(consoleModel);
    room.bindConsole(consoleModel);
  }
  loadModeledConsole(stage, consoleModel);
  const slot = new THREE.Object3D();
  slot.position.set(0, useRoomBackplate ? -0.13 : 0.82, useRoomBackplate ? -0.8 : -1.42);
  stage.add(slot);

  const cartridges = buildCartridges(projects);
  cartridges.forEach((cart) => stage.add(cart.mesh));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.enableZoom = !isTouch;
  controls.minDistance = 7.5;
  controls.maxDistance = 15;
  controls.minAzimuthAngle = -0.48;
  controls.maxAzimuthAngle = 0.48;
  controls.minPolarAngle = 0.78;
  controls.maxPolarAngle = 1.28;
  controls.target.set(0, 0.55, -1.25);
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.22;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(99, 99);
  const downXY = { x: 0, y: 0 };
  const cartridgeTooltip = document.getElementById('cartridge-tooltip');
  let hovered = null;
  let selected = null;
  let cameraGoal = null;
  let insertionStartedAt = 0;
  let loadTimer = null;

  function setPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickCartridge() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(cartridges.map((cart) => cart.mesh), true);
    if (!hits.length) return null;
    const index = hits[0].object.userData.cartIndex;
    return Number.isInteger(index) ? cartridges[index] : null;
  }

  function pickRoomInteraction() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(room.pickables, true);
    if (!hits.length) return null;
    return hits[0].object.userData.roomAction || null;
  }

  function positionCartridgeTooltip(cart) {
    const rect = renderer.domElement.getBoundingClientRect();
    const point = cart.mesh.getWorldPosition(new THREE.Vector3());
    point.y += 0.48;
    point.project(camera);
    cartridgeTooltip.style.left = `${rect.left + ((point.x + 1) / 2) * rect.width}px`;
    cartridgeTooltip.style.top = `${rect.top + ((1 - point.y) / 2) * rect.height}px`;
  }

  renderer.domElement.addEventListener('pointermove', (event) => {
    if (selected || event.pointerType === 'touch') return;
    setPointer(event);
    hovered = pickCartridge();
    const roomAction = hovered ? null : pickRoomInteraction();
    document.body.style.cursor = hovered || roomAction ? 'pointer' : 'default';
    if (hovered) {
      cartridgeTooltip.textContent = hovered.data.title;
      positionCartridgeTooltip(hovered);
      cartridgeTooltip.hidden = false;
    } else {
      cartridgeTooltip.hidden = true;
    }
    syncActiveButton(hovered?.data.id);
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    if (!selected) {
      hovered = null;
      cartridgeTooltip.hidden = true;
      syncActiveButton();
    }
  });

  renderer.domElement.addEventListener('pointerdown', (event) => {
    downXY.x = event.clientX;
    downXY.y = event.clientY;
  });

  renderer.domElement.addEventListener('pointerup', (event) => {
    if (selected || Math.hypot(event.clientX - downXY.x, event.clientY - downXY.y) > 8) return;
    setPointer(event);
    const cart = pickCartridge();
    if (cart) selectCartridge(cart);
    else room.interact(pickRoomInteraction());
  });

  document.getElementById('project-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-project]');
    if (!button) return;
    const cart = cartridges.find((item) => item.data.id === button.dataset.project);
    if (cart) selectCartridge(cart);
  });

  function selectCartridge(cart) {
    if (selected) return;
    selected = cart;
    cart.selectFrom = cart.mesh.position.clone();
    insertionStartedAt = performance.now();
    hovered = null;
    cartridgeTooltip.hidden = true;
    controls.autoRotate = false;
    controls.enabled = false;
    document.body.style.cursor = 'default';
    document.querySelector('.hero-copy').classList.add('is-hidden');
    document.querySelector('.project-dock').classList.add('is-hidden');
    hideHint();
    syncActiveButton(cart.data.id);
    room.setTV(true, cart.data.color);
    room.setPlatformMode(cart.data.id === 'kwam-developer-platform');
    cameraGoal = {
      position: new THREE.Vector3(0, 2.55, 8.45),
      target: new THREE.Vector3(0, 0.75, -1.25),
    };
    loadTimer = window.setTimeout(
      () => openDetail(cart.data, projects.indexOf(cart.data)),
      reduceMotion ? 0 : cart.data.id === 'kwam-developer-platform' ? 3150 : 1150
    );
  }

  function deselect() {
    if (!selected) return;
    window.clearTimeout(loadTimer);
    selected = null;
    controls.enabled = true;
    controls.autoRotate = !reduceMotion;
    room.setTV(false);
    room.setPlatformMode(false);
    cameraGoal = {
      position: (window.innerWidth < 820 ? mobilePosition : desktopPosition).clone(),
      target: new THREE.Vector3(0, 0.55, -1.25),
    };
    document.querySelector('.hero-copy').classList.remove('is-hidden');
    document.querySelector('.project-dock').classList.remove('is-hidden');
    syncActiveButton();
    closeDetail();
  }

  document.getElementById('detail-close').addEventListener('click', deselect);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') deselect();
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    room.update(time);

    cartridges.forEach((cart, index) => {
      const mesh = cart.mesh;
      if (cart === selected) {
        const progress = reduceMotion ? 1 : Math.min(1, (performance.now() - insertionStartedAt) / 980);
        const hoverPoint = slot.position.clone().add(new THREE.Vector3(0, 1.0, 0.12));
        if (progress < 0.62) {
          const lift = THREE.MathUtils.smoothstep(progress / 0.62, 0, 1);
          mesh.position.lerpVectors(cart.selectFrom, hoverPoint, lift);
        } else {
          const insert = THREE.MathUtils.smoothstep((progress - 0.62) / 0.38, 0, 1);
          mesh.position.lerpVectors(hoverPoint, slot.position, insert);
        }
        mesh.rotation.x += (0 - mesh.rotation.x) * 0.14;
        mesh.rotation.y += (0 - mesh.rotation.y) * 0.14;
        mesh.rotation.z += (0 - mesh.rotation.z) * 0.14;
        mesh.scale.lerp(new THREE.Vector3(1.08, 1.08, 1.08), 0.1);
      } else {
        const isHovered = cart === hovered;
        const y = cart.baseY + (reduceMotion ? 0 : Math.sin(time * 1.05 + index * 1.7) * 0.07) + (isHovered ? 0.28 : 0);
        mesh.position.x += (cart.baseX - mesh.position.x) * 0.09;
        mesh.position.y += (y - mesh.position.y) * 0.09;
        mesh.position.z += (cart.baseZ - mesh.position.z) * 0.09;
        mesh.rotation.x += (cart.baseRotX - mesh.rotation.x) * 0.09;
        mesh.rotation.y += (cart.baseRotY - mesh.rotation.y) * 0.09;
        mesh.rotation.z += (cart.baseRotZ - mesh.rotation.z) * 0.09;
        const scale = isHovered ? 1.1 : 1;
        mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.12);
      }
    });
    if (hovered && !selected) positionCartridgeTooltip(hovered);

    if (cameraGoal) {
      camera.position.lerp(cameraGoal.position, reduceMotion ? 1 : 0.055);
      controls.target.lerp(cameraGoal.target, reduceMotion ? 1 : 0.055);
      if (camera.position.distanceTo(cameraGoal.position) < 0.02) cameraGoal = null;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = app.clientWidth / app.clientHeight;
    camera.fov = window.innerWidth < 520 ? 44 : 42;
    camera.updateProjectionMatrix();
    renderer.setSize(app.clientWidth, app.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.6 : 2));
  });

  window.setTimeout(hideHint, 8500);
}

function buildBackplateRoom() {
  let consoleModel = null;
  return {
    pickables: [],
    setTV() {},
    bindConsole(model) { consoleModel = model; },
    setPlatformMode() {},
    interact() {},
    update() {
      if (consoleModel?.userData.setReady) consoleModel.userData.setReady(false);
    },
  };
}

function buildRoom(stage, simplified) {
  const wallMat = new THREE.MeshStandardMaterial({ color: '#29251f', roughness: 0.94 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#3a271c', roughness: 0.78 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#201813', roughness: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#4d5047', roughness: 0.48, metalness: 0.32 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.18, 14), woodMat);
  floor.position.set(0, -1.25, 0.4);
  floor.receiveShadow = true;
  stage.add(floor);

  for (let x = -8; x <= 8; x += 0.8) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.006, 13.5),
      new THREE.MeshBasicMaterial({ color: '#1d1510', transparent: true, opacity: 0.38 })
    );
    seam.position.set(x, -1.15, 0.5);
    stage.add(seam);
  }

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 0.2), wallMat);
  backWall.position.set(0, 2.75, -4.15);
  backWall.receiveShadow = true;
  stage.add(backWall);

  const baseboard = new THREE.Mesh(new THREE.BoxGeometry(18, 0.22, 0.15), metalMat);
  baseboard.position.set(0, -1.02, -4.0);
  stage.add(baseboard);

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.055, 4.2),
    new THREE.MeshStandardMaterial({ color: '#703e2d', roughness: 1 })
  );
  rug.position.set(0, -1.12, 1.2);
  rug.receiveShadow = true;
  stage.add(rug);
  if (!simplified) buildCouch(stage);
  [-2.5, -1.25, 0, 1.25, 2.5].forEach((x) => {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.01, 4.05),
      new THREE.MeshBasicMaterial({ color: '#d58a57', transparent: true, opacity: 0.38 })
    );
    stripe.position.set(x, -1.085, 1.2);
    stage.add(stripe);
  });

  const cabinet = new THREE.Mesh(new RoundedBoxGeometry(6.2, 1.05, 1.55, 4, 0.1), darkWoodMat);
  cabinet.position.set(0, -0.58, -2.88);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  stage.add(cabinet);
  [-2.02, 0, 2.02].forEach((x, index) => {
    const cubby = new THREE.Mesh(
      new RoundedBoxGeometry(1.52, 0.56, 0.08, 3, 0.03),
      new THREE.MeshStandardMaterial({ color: '#100d0a', roughness: 0.85 })
    );
    cubby.position.set(x, -0.61, -2.075);
    stage.add(cubby);
    for (let item = 0; item < 3; item += 1) {
      const media = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.33 + item * 0.05, 0.1),
        new THREE.MeshStandardMaterial({ color: ['#263a4b', '#593829', '#394333'][item], roughness: 0.8 })
      );
      media.position.set(x - 0.42 + item * 0.25, -0.58, -2.02);
      stage.add(media);
    }
  });
  [-1.9, 0, 1.9].forEach((x) => {
    const doorLine = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.72, 0.03), metalMat);
    doorLine.position.set(x, -0.58, -2.085);
    stage.add(doorLine);
  });

  const tvShell = new THREE.Mesh(
    new RoundedBoxGeometry(5.15, 2.72, 0.72, 7, 0.25),
    new THREE.MeshStandardMaterial({ color: '#494a3f', roughness: 0.55, metalness: 0.16 })
  );
  tvShell.position.set(0, 1.45, -3.48);
  tvShell.castShadow = true;
  stage.add(tvShell);

  const tvBezel = new THREE.Mesh(
    new RoundedBoxGeometry(4.55, 2.18, 0.11, 4, 0.04),
    new THREE.MeshStandardMaterial({ color: '#0b0d09', roughness: 0.68 })
  );
  tvBezel.position.set(-0.12, 1.48, -3.075);
  stage.add(tvBezel);

  const homeTVTexture = makeRoomTVTexture();
  const systemTVTexture = makeRoomSystemTexture();
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: homeTVTexture,
    color: '#d8e6c2',
    emissive: '#c6ff44',
    emissiveIntensity: 0.05,
    roughness: 0.34,
  });
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.15, 1.78), screenMaterial);
  tvScreen.position.set(-0.12, 1.48, -3.01);
  stage.add(tvScreen);

  const tvPower = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#4a4e42', emissive: '#c6ff44', emissiveIntensity: 0.08 })
  );
  tvPower.position.set(2.13, 0.67, -3.02);
  stage.add(tvPower);
  tvScreen.userData.roomAction = 'tv';
  const pickables = [tvScreen];

  const tableTop = new THREE.Mesh(new RoundedBoxGeometry(6, 0.2, 1.65, 4, 0.09), darkWoodMat);
  tableTop.position.set(0, -0.83, 1.65);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  stage.add(tableTop);
  [-2.45, 2.45].forEach((x) => {
    [-0.55, 0.55].forEach((zOffset) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), darkWoodMat);
      leg.position.set(x, -1.02, 1.65 + zOffset);
      stage.add(leg);
    });
  });
  const controller = buildController(stage, darkWoodMat);
  pickables.push(controller);

  let lamp = null;
  let leftPoster = null;
  let rightPoster = null;
  let terminal = null;
  if (!simplified) {
    lamp = buildFloorLamp(stage);
    pickables.push(lamp.pull);
    leftPoster = buildPoster(stage, -4.45, 2.5, '#ef4444', 'MULTIPLAYER', 'SIMON SAYS');
    rightPoster = buildPoster(stage, 4.45, 2.5, '#5eead4', 'REALTIME', 'DEBATE APP');
    leftPoster.art.userData.roomAction = 'left-poster';
    rightPoster.art.userData.roomAction = 'right-poster';
    pickables.push(leftPoster.art, rightPoster.art);

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.48), darkWoodMat);
    shelf.position.set(5.3, 0.05, -3.72);
    stage.add(shelf);
    ['ABOUT', 'RESUME', 'CONTACT'].forEach((label, index) => {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.72 + index * 0.06, 0.32),
        new THREE.MeshStandardMaterial({ color: ['#c6ff44', '#ff7548', '#9f7aea'][index], roughness: 0.7 })
      );
      book.position.set(4.7 + index * 0.52, 0.47, -3.63);
      book.rotation.z = (index - 1) * 0.035;
      stage.add(book);
    });

    terminal = buildPlatformTerminal(stage, darkWoodMat);
  }

  let active = false;
  let tvSystemMode = false;
  let platformMode = false;
  let pipelineStartedAt = 0;
  let consoleModel = null;
  const posterSets = {
    'left-poster': [
      ['#ef4444', 'MULTIPLAYER', 'SIMON SAYS'],
      ['#f97316', 'GODOT 4.5', 'HURRY UP'],
      ['#f4d35e', 'EXPERIMENTS', 'KWAM KASSIM'],
    ],
    'right-poster': [
      ['#5eead4', 'REALTIME', 'DEBATE APP'],
      ['#c6ff44', 'PLATFORM', 'GOLDEN PATH'],
      ['#f472b6', 'CONTACT', 'LET\'S BUILD'],
    ],
  };
  const posterIndex = { 'left-poster': 0, 'right-poster': 0 };

  function cyclePoster(action) {
    const target = action === 'left-poster' ? leftPoster : rightPoster;
    if (!target) return;
    posterIndex[action] = (posterIndex[action] + 1) % posterSets[action].length;
    const [color, smallText, title] = posterSets[action][posterIndex[action]];
    target.art.material.map = makePosterTexture(color, smallText, title);
    target.art.material.needsUpdate = true;
  }

  return {
    pickables,
    setTV(isActive, color = '#c6ff44') {
      active = Boolean(isActive);
      const selectedColor = new THREE.Color(color);
      screenMaterial.map = tvSystemMode ? systemTVTexture : homeTVTexture;
      screenMaterial.emissive.copy(selectedColor);
      screenMaterial.emissiveIntensity = active ? 0.8 : tvSystemMode ? 0.52 : 0.05;
      tvPower.material.color.copy(active || tvSystemMode ? selectedColor : new THREE.Color('#4a4e42'));
      tvPower.material.emissive.copy(selectedColor);
      tvPower.material.emissiveIntensity = active || tvSystemMode ? 2.2 : 0.08;
    },
    bindConsole(model) { consoleModel = model; },
    setPlatformMode(enabled) {
      platformMode = enabled && Boolean(terminal);
      pipelineStartedAt = performance.now();
      if (rightPoster) {
        rightPoster.art.material.map = platformMode
          ? makeArchitectureTexture()
          : makePosterTexture('#5eead4', 'REALTIME', 'DEBATE APP');
        rightPoster.art.material.needsUpdate = true;
      }
      if (consoleModel?.userData.setReady) consoleModel.userData.setReady(false);
    },
    interact(action) {
      if (action === 'lamp' && lamp) lamp.toggle();
      if (action === 'tv') {
        tvSystemMode = !tvSystemMode;
        screenMaterial.map = tvSystemMode ? systemTVTexture : homeTVTexture;
        screenMaterial.emissiveIntensity = active ? 0.8 : tvSystemMode ? 0.52 : 0.05;
        tvPower.material.color.copy(tvSystemMode || active ? new THREE.Color('#c6ff44') : new THREE.Color('#4a4e42'));
        tvPower.material.emissiveIntensity = tvSystemMode || active ? 2.2 : 0.08;
        screenMaterial.needsUpdate = true;
      }
      if (action === 'left-poster' || action === 'right-poster') cyclePoster(action);
      if (action === 'controller') {
        controller.userData.tug = 1;
        playControllerSound();
      }
    },
    update(time) {
      lamp?.update(time);
      controller.userData.tug = Math.max(0, (controller.userData.tug || 0) - 0.09);
      controller.rotation.z = 0.08 + Math.sin((controller.userData.tug || 0) * Math.PI) * 0.16;
      if (!platformMode || !terminal) return;
      const stageIndex = Math.min(4, Math.floor((performance.now() - pipelineStartedAt) / 720));
      terminal.draw(stageIndex);
      if (consoleModel?.userData.setReady) consoleModel.userData.setReady(stageIndex === 4);
    },
  };
}

function buildFloorLamp(stage) {
  const metal = new THREE.MeshStandardMaterial({ color: '#2f302a', roughness: 0.52, metalness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 4.15, 16), metal);
  pole.position.set(-3.85, 0.83, -2.6);
  stage.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.12, 24), metal);
  base.position.set(-3.85, -1.06, -2.6);
  stage.add(base);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.82, 1.05, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: '#d9b47b', roughness: 0.9, side: THREE.DoubleSide })
  );
  shade.position.set(-3.85, 3.05, -2.6);
  stage.add(shade);
  const light = new THREE.PointLight('#ffbd78', 32, 8, 2);
  light.position.set(-3.85, 2.82, -2.45);
  stage.add(light);
  const pull = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.72, 0.12),
    new THREE.MeshStandardMaterial({ color: '#d7a849', emissive: '#8f5e16', emissiveIntensity: 0.25 })
  );
  pull.position.set(-3.5, 2.64, -2.22);
  pull.userData.roomAction = 'lamp';
  stage.add(pull);
  let isOn = true;
  let tug = 0;
  return {
    pull,
    toggle() { isOn = !isOn; tug = 1; },
    update() {
      tug = Math.max(0, tug - 0.08);
      pull.position.y = 2.64 - Math.sin(tug * Math.PI) * 0.18;
      light.intensity += ((isOn ? 32 : 0) - light.intensity) * 0.12;
      shade.material.emissive = new THREE.Color(isOn ? '#634018' : '#000000');
      shade.material.emissiveIntensity = isOn ? 0.32 : 0;
    },
  };
}

function buildCouch(stage) {
  const couch = new THREE.Group();
  couch.position.set(-4.85, -0.72, -1.1);
  couch.rotation.y = 0.2;
  const fabric = new THREE.MeshStandardMaterial({ color: '#26313e', roughness: 0.96 });
  const accent = new THREE.MeshStandardMaterial({ color: '#b74b2e', roughness: 0.95 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(2.38, 0.68, 1.42, 4, 0.14), fabric);
  couch.add(seat);
  const back = new THREE.Mesh(new RoundedBoxGeometry(2.38, 1.1, 0.32, 4, 0.12), fabric);
  back.position.set(0, 0.62, -0.5);
  couch.add(back);
  [-1.0, 1.0].forEach((x) => {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.7, 1.3, 4, 0.08), fabric);
    arm.position.set(x, 0.12, 0);
    couch.add(arm);
  });
  const pillow = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.48, 0.12, 3, 0.06), accent);
  pillow.position.set(-0.38, 0.43, 0.22);
  pillow.rotation.set(0.12, 0.1, 0.18);
  couch.add(pillow);
  stage.add(couch);
}

function buildPoster(stage, x, y, color, smallText, title) {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 2.65, 0.11),
    new THREE.MeshStandardMaterial({ color: '#15120f', roughness: 0.62 })
  );
  frame.position.set(x, y, -4.0);
  stage.add(frame);
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 2.38),
    new THREE.MeshStandardMaterial({ map: makePosterTexture(color, smallText, title), roughness: 0.82 })
  );
  art.position.set(x, y, -3.935);
  stage.add(art);
  return { art };
}

function buildController(stage, material) {
  const controller = new THREE.Group();
  controller.position.set(-3.05, -0.62, 0.76);
  controller.rotation.set(-0.23, 0.14, 0.08);
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.9, 0.16, 0.48, 4, 0.11),
    new THREE.MeshStandardMaterial({ color: '#3b3f38', roughness: 0.48, metalness: 0.26 })
  );
  controller.add(body);
  const dpad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.18), material);
  dpad.position.set(-0.22, 0.1, -0.02);
  controller.add(dpad);
  [-0.05, 0.12].forEach((x) => {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#6b1111', emissiveIntensity: 0.5 })
    );
    button.rotation.x = Math.PI / 2;
    button.position.set(x, 0.1, -0.01);
    controller.add(button);
  });
  controller.traverse((child) => { child.userData.roomAction = 'controller'; });
  stage.add(controller);
  return controller;
}

let audioContext;
function playControllerSound() {
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(320, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(640, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.13);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.14);
  } catch {
    // Sound is optional; browser audio permissions should never break interaction.
  }
}

function buildPlatformTerminal(stage, woodMat) {
  const terminal = new THREE.Group();
  terminal.position.set(4.45, 1.27, -3.16);
  const shell = new THREE.Mesh(
    new RoundedBoxGeometry(1.72, 1.24, 0.62, 4, 0.11),
    new THREE.MeshStandardMaterial({ color: '#383d35', roughness: 0.48, metalness: 0.28 })
  );
  terminal.add(shell);
  const terminalCanvas = document.createElement('canvas');
  terminalCanvas.width = 640;
  terminalCanvas.height = 420;
  const terminalTexture = new THREE.CanvasTexture(terminalCanvas);
  terminalTexture.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.38, 0.88),
    new THREE.MeshStandardMaterial({ map: terminalTexture, emissive: '#9dff37', emissiveIntensity: 0.48, roughness: 0.4 })
  );
  screen.position.set(0, 0.05, 0.325);
  terminal.add(screen);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.12, 0.78), woodMat);
  base.position.set(0, -0.72, 0.09);
  terminal.add(base);
  const light = new THREE.PointLight('#c6ff44', 2.2, 2.8, 2);
  light.position.set(0, 0.05, 0.8);
  terminal.add(light);
  stage.add(terminal);

  const stages = ['TEMPLATE', 'TEST', 'SCAN', 'DEPLOY', 'OBSERVE'];
  const draw = (activeStage = -1) => {
    const ctx = terminalCanvas.getContext('2d');
    ctx.fillStyle = '#081006';
    ctx.fillRect(0, 0, terminalCanvas.width, terminalCanvas.height);
    ctx.fillStyle = '#c6ff44';
    ctx.font = '700 28px monospace';
    ctx.fillText('PLATFORM PIPELINE', 36, 54);
    stages.forEach((label, index) => {
      const y = 92 + index * 60;
      const ready = index < activeStage;
      const current = index === activeStage;
      ctx.fillStyle = ready ? '#c6ff44' : current ? '#f4d35e' : '#405039';
      ctx.fillRect(40, y, 22, 22);
      ctx.strokeStyle = index < stages.length - 1 ? '#597634' : '#081006';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(51, y + 24);
      ctx.lineTo(51, y + 57);
      ctx.stroke();
      ctx.fillStyle = ready || current ? '#e8f5d9' : '#7d8876';
      ctx.font = '600 24px monospace';
      ctx.fillText(label, 84, y + 20);
    });
    ctx.fillStyle = activeStage === 4 ? '#c6ff44' : '#95a88a';
    ctx.font = '19px monospace';
    ctx.fillText(activeStage === 4 ? 'SERVICE READY' : 'RUNNING...', 385, 384);
    terminalTexture.needsUpdate = true;
  };
  draw(-1);
  return { screen, draw };
}

// This remains as the guaranteed, fast-loading fallback until a compressed GLB is supplied.
function buildConsoleFallback() {
  const group = new THREE.Group();
  group.rotation.x = -0.03;

  const shellMat = new THREE.MeshStandardMaterial({ color: '#292d25', roughness: 0.48, metalness: 0.32 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#090a08', roughness: 0.72, metalness: 0.28 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#4a5043', roughness: 0.38, metalness: 0.55 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(4.5, 1.25, 2.65, 5, 0.18), shellMat);
  body.position.y = -0.48;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const topDeck = new THREE.Mesh(new RoundedBoxGeometry(3.9, 0.15, 2.18, 3, 0.08), trimMat);
  topDeck.position.set(0, 0.16, -0.04);
  group.add(topDeck);

  const slot = new THREE.Mesh(new RoundedBoxGeometry(1.35, 0.09, 0.42, 3, 0.04), darkMat);
  slot.position.set(0, 0.255, -0.13);
  group.add(slot);

  const slotGlow = new THREE.PointLight('#c6ff44', 1.8, 2.5, 2);
  slotGlow.position.set(0, 0.42, -0.08);
  group.add(slotGlow);

  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.55, 0.82, 0.12, 4, 0.08), darkMat);
  bezel.position.set(-0.25, -0.48, 1.32);
  group.add(bezel);

  const screenMaterial = new THREE.MeshStandardMaterial({
    map: makeScreenTexture(),
    emissive: '#91bd35',
    emissiveIntensity: 0.22,
    roughness: 0.35,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.59), screenMaterial);
  screen.position.set(-0.25, -0.48, 1.386);
  group.add(screen);

  const power = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: '#c6ff44', emissive: '#c6ff44', emissiveIntensity: 1.2 })
  );
  power.rotation.x = Math.PI / 2;
  power.position.set(1.55, -0.42, 1.34);
  group.add(power);

  const action = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.08, 32),
    new THREE.MeshStandardMaterial({ color: '#ff7548', roughness: 0.4 })
  );
  action.rotation.x = Math.PI / 2;
  action.position.set(1.91, -0.63, 1.31);
  group.add(action);

  [-1.8, 1.8].forEach((x) => {
    [-0.87, -0.12].forEach((y) => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 12), darkMat);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, 1.345);
      group.add(screw);
    });
  });

  for (let i = 0; i < 7; i += 1) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.35, 0.03), darkMat);
    vent.position.set(1.42 + i * 0.1, -0.15, 1.355);
    group.add(vent);
  }

  return group;
}

function loadModeledConsole(stage, fallback) {
  const modelUrl = import.meta.env.VITE_CONSOLE_MODEL_URL;
  if (!modelUrl) return;

  new GLTFLoader().load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0.18, -1.05);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      stage.add(model);
      stage.remove(fallback);
    },
    undefined,
    () => {
      // A model is an enhancement; keep the working procedural fallback if it cannot load.
    }
  );
}

function buildCartridges(list) {
  const positions = [
    [-3.25, -0.58, 1.55, 0.18, -0.05],
    [-1.95, -0.58, 1.42, 0.1, -0.03],
    [-0.65, -0.58, 1.5, 0.03, -0.01],
    [0.65, -0.58, 1.5, -0.03, 0.01],
    [1.95, -0.58, 1.42, -0.1, 0.03],
    [3.25, -0.58, 1.55, -0.18, 0.05],
  ];

  return list.map((data, index) => {
    const preset = positions[index] || [((index % 5) - 2) * 1.2, -0.04, 1.3 - Math.floor(index / 5) * 0.5, 0, 0];
    const group = new THREE.Group();
    const shell = new THREE.Mesh(
      new RoundedBoxGeometry(1.05, 1.42, 0.3, 4, 0.065),
      new THREE.MeshStandardMaterial({ color: '#30362c', roughness: 0.42, metalness: 0.25 })
    );
    shell.castShadow = true;
    group.add(shell);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 0.78),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture(data), roughness: 0.64 })
    );
    label.position.set(0, 0.08, 0.157);
    group.add(label);

    const ridge = new THREE.Mesh(
      new RoundedBoxGeometry(0.93, 0.17, 0.29, 3, 0.035),
      new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.43, metalness: 0.1 })
    );
    ridge.position.y = 0.78;
    group.add(ridge);

    for (let pin = 0; pin < 6; pin += 1) {
      const contact = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.04, 0.015),
        new THREE.MeshStandardMaterial({ color: '#b8a15c', metalness: 0.75, roughness: 0.28 })
      );
      contact.position.set(-0.31 + pin * 0.125, -0.72, 0.16);
      group.add(contact);
    }

    group.position.set(preset[0], preset[1], preset[2]);
    group.rotation.set(-Math.PI / 2, preset[3], preset[4]);
    group.traverse((child) => { child.userData.cartIndex = index; });

    return {
      mesh: group,
      data,
      baseX: preset[0],
      baseY: preset[1],
      baseZ: preset[2],
      baseRotX: -Math.PI / 2,
      baseRotY: preset[3],
      baseRotZ: preset[4],
    };
  });
}

function makeRoomTVTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(512, 220, 20, 512, 220, 520);
  gradient.addColorStop(0, '#182016');
  gradient.addColorStop(1, '#050704');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c6ff44';
  ctx.font = '600 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KWAM HOME ENTERTAINMENT SYSTEM', 512, 174);
  ctx.fillStyle = '#71834f';
  ctx.font = '22px monospace';
  ctx.fillText('INSERT A PROJECT CARTRIDGE', 512, 232);
  ctx.fillStyle = '#c6ff44';
  ctx.fillRect(430, 276, 164, 4);
  for (let y = 0; y < canvas.height; y += 7) {
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    ctx.fillRect(0, y, canvas.width, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeRoomSystemTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#071005';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(198,255,68,.14)';
  ctx.lineWidth = 2;
  for (let x = 50; x < canvas.width; x += 100) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 40; y < canvas.height; y += 70) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.fillStyle = '#c6ff44';
  ctx.font = '600 30px monospace';
  ctx.fillText('KWAM SYSTEM DIAGNOSTICS', 64, 78);
  const items = [['UPTIME', '99.99%'], ['SERVICES', '06 ONLINE'], ['DEPLOYS', 'READY'], ['OBSERVE', 'ACTIVE']];
  items.forEach(([key, value], index) => {
    const x = 72 + (index % 2) * 470;
    const y = 160 + Math.floor(index / 2) * 130;
    ctx.fillStyle = '#70895c'; ctx.font = '21px monospace'; ctx.fillText(key, x, y);
    ctx.fillStyle = '#eaf8dd'; ctx.font = '700 35px monospace'; ctx.fillText(value, x, y + 48);
  });
  for (let y = 0; y < canvas.height; y += 7) {
    ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.fillRect(0, y, canvas.width, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeArchitectureTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b1008';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#c6ff44';
  ctx.lineWidth = 4;
  const nodes = [
    [256, 116, 'CLI'], [150, 255, 'CI'], [362, 255, 'IAC'], [150, 404, 'SCAN'], [362, 404, 'OBSERVE'],
  ];
  [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]].forEach(([from, to]) => {
    ctx.beginPath(); ctx.moveTo(nodes[from][0], nodes[from][1]); ctx.lineTo(nodes[to][0], nodes[to][1]); ctx.stroke();
  });
  nodes.forEach(([x, y, label]) => {
    ctx.fillStyle = '#192514'; ctx.fillRect(x - 62, y - 28, 124, 56);
    ctx.strokeStyle = '#c6ff44'; ctx.strokeRect(x - 62, y - 28, 124, 56);
    ctx.fillStyle = '#e8f7d7'; ctx.font = '700 20px monospace'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 7);
  });
  ctx.textAlign = 'center'; ctx.fillStyle = '#c6ff44'; ctx.font = '700 26px monospace'; ctx.fillText('GOLDEN PATH', 256, 558);
  ctx.fillStyle = '#8da77d'; ctx.font = '17px monospace'; ctx.fillText('PLATFORM ARCHITECTURE', 256, 590);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePosterTexture(color, smallText, title) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#11120f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, 42);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(45, 80, 422, 430);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(256, 250, 112, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(110, 410);
  ctx.lineTo(402, 120);
  ctx.stroke();
  ctx.fillStyle = '#f1f4e9';
  ctx.font = '700 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 568);
  ctx.fillStyle = color;
  ctx.font = '24px monospace';
  ctx.fillText(smallText, 256, 606);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b1008';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(198,255,68,.08)';
  for (let y = 4; y < canvas.height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#c6ff44';
  ctx.font = '600 38px monospace';
  ctx.fillText('PROJECT SYSTEM', 52, 90);
  ctx.fillStyle = '#7f9950';
  ctx.font = '24px monospace';
  ctx.fillText('INSERT CARTRIDGE TO CONTINUE', 52, 151);
  ctx.fillStyle = '#c6ff44';
  ctx.fillRect(52, 182, 260, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLabelTexture(data) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 464;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#11130f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = data.color;
  ctx.fillRect(0, 0, canvas.width, 72);
  ctx.fillStyle = '#070806';
  ctx.font = '600 20px monospace';
  ctx.fillText(`KWAM.DEV / ${data.id.toUpperCase().slice(0, 12)}`, 24, 46);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const drawLabel = (cover) => {
    ctx.fillStyle = '#11130f';
    ctx.fillRect(0, 72, canvas.width, canvas.height - 72);
    if (cover) drawCover(ctx, cover, 16, 88, 480, 212);
    else {
      ctx.fillStyle = data.color;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(16, 88, 480, 212);
      ctx.globalAlpha = 1;
    }
    const titleY = cover ? 342 : 138;
    ctx.fillStyle = '#f1f4e9';
    ctx.font = '700 35px sans-serif';
    wrapText(ctx, data.title, 25, titleY, 458, 40, 2);
    ctx.fillStyle = '#8f9786';
    ctx.font = '19px monospace';
    wrapText(ctx, data.tagline || '', 25, 422, 458, 24, 1);
    texture.needsUpdate = true;
  };
  drawLabel();
  if (data.cover) {
    const cover = new Image();
    cover.decoding = 'async';
    cover.onload = () => drawLabel(cover);
    cover.src = data.cover;
  }
  return texture;
}

function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(
    image,
    (image.width - sourceWidth) / 2,
    (image.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const words = String(text).split(' ');
  let line = '';
  let lines = 0;
  words.forEach((word, index) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line && lines < maxLines - 1) {
      ctx.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
      lines += 1;
    } else {
      line = test;
    }
    if (index === words.length - 1) ctx.fillText(line.trim(), x, y);
  });
}

function buildProjectNavigation() {
  const list = document.getElementById('project-list');
  const dock = document.querySelector('.project-dock');
  const toggle = document.getElementById('library-toggle');
  toggle.addEventListener('click', () => {
    const expanded = dock.classList.toggle('is-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
  });
  document.getElementById('project-count').textContent = String(projects.length).padStart(2, '0');
  projects.forEach((project, index) => {
    const button = document.createElement('button');
    button.className = 'project-button';
    button.dataset.project = project.id;
    button.style.setProperty('--project-color', project.color);
    button.innerHTML = `<span class="project-index">${String(index + 1).padStart(2, '0')}</span><span class="project-name">${project.title}</span><span class="project-arrow" aria-hidden="true">→</span>`;
    button.addEventListener('click', () => {
      dock.classList.remove('is-expanded');
      toggle.setAttribute('aria-expanded', 'false');
    });
    list.appendChild(button);
  });
}

function syncActiveButton(projectId) {
  document.querySelectorAll('.project-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.project === projectId);
  });
}

let tvBootTimer = null;

function openDetail(data, index) {
  const detail = document.getElementById('detail');
  detail.classList.remove('tv-ready');
  detail.style.setProperty('--detail-color', data.color);
  document.getElementById('detail-number').textContent = String(index + 1).padStart(2, '0');
  document.getElementById('detail-title').textContent = data.title;
  document.getElementById('detail-tagline').textContent = data.tagline || '';
  document.getElementById('detail-tags').textContent = (data.tags || []).join('  /  ');
  document.getElementById('detail-desc').textContent = data.description;
  const links = document.getElementById('detail-links');
  links.replaceChildren();
  const detailLinks = data.route
    ? [{ label: 'Share Project Page', url: data.route }, ...(data.links || [])]
    : data.links || [];
  detailLinks.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.textContent = link.label;
    if (link.url.startsWith('http')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    links.appendChild(anchor);
  });
  detail.hidden = false;
  document.getElementById('detail-close').focus();
  tvBootTimer = window.setTimeout(() => detail.classList.add('tv-ready'), 760);
}

function closeDetail() {
  window.clearTimeout(tvBootTimer);
  const detail = document.getElementById('detail');
  detail.hidden = true;
  detail.classList.remove('tv-ready');
}

function hideHint() {
  const hint = document.getElementById('hint');
  if (hint) hint.style.opacity = '0';
}

function buildFallbackGrid() {
  const grid = document.getElementById('fallback-grid');
  projects.forEach((project) => {
    const item = document.createElement('li');
    const title = document.createElement('h2');
    title.textContent = project.title;
    const tags = document.createElement('p');
    tags.className = 'tags';
    tags.textContent = (project.tags || []).join(' / ');
    const description = document.createElement('p');
    description.textContent = project.description;
    const links = document.createElement('div');
    (project.links || []).forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.textContent = link.label;
      links.appendChild(anchor);
    });
    item.append(title, tags, description, links);
    grid.appendChild(item);
  });
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}
