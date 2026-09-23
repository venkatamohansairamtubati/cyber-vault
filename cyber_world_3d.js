/**
 * ============================================================================
 * CYBER VAULT — 3D Cyber World & Cinematic 3D Eagle Engine
 * Visual Identity: BLACK + WHITE + YELLOW (MNC SOC Enterprise Standard)
 * Powered by Three.js (WebGL) + GSAP
 * ============================================================================
 */

class CyberWorld3D {
  constructor(containerId = "cyber-world-container") {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;

    // 3D Visual Objects
    this.eagleGroup = null;
    this.torsoMesh = null;
    this.headGroup = null;
    this.wingsLeft = null;
    this.wingsRight = null;
    this.tailGroup = null;
    this.leftWingBlades = [];
    this.rightWingBlades = [];
    this.particleSystem = null;
    this.slipstreamParticles = null;
    this.slipstreamGeo = null;
    this.slipstreamPositions = null;
    this.slipstreamIdx = 0;
    this.lightBeams = [];

    // Lighting
    this.ambientLight = null;
    this.distantGlowLight = null;
    this.eagleRimLight = null;
    this.yellowKeyLight = null;

    // State
    this.isIntro = true;
    this.introTime = 0;
    this.introCompleted = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.currentView = "view-dashboard";

    // Strict Palette
    this.colors = {
      black: 0x000000,
      nearBlack: 0x050505,
      charcoal: 0x0f0f13,
      darkTitanium: 0x16161c,
      pureWhite: 0xffffff,
      cyberYellow: 0xffd400,
      brightYellow: 0xffea70,
      warmYellow: 0xffc400,
      grayBorder: 0x22222a,
      grayMuted: 0x555560
    };

    this.init();
  }

  init() {
    if (!this.container) {
      this.container = document.getElementById("cyber-world-container");
      if (!this.container) return;
    }

    if (typeof THREE === "undefined") {
      console.warn("Three.js not loaded. Retrying in 100ms...");
      setTimeout(() => this.init(), 100);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Atmosphere Fog (Pure Black Void)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors.black);
    this.scene.fog = new THREE.FogExp2(this.colors.black, 0.018);
    this.clock = new THREE.Clock();

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 22);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Build 3D Entities
    this.buildCinematicEagle();
    this.buildAtmosphericParticles();
    this.buildSlipstreamTrails();
    this.buildVolumetricLightBeams();

    // 6. Listeners
    window.addEventListener("resize", () => this.onWindowResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));

    // 7. Start Animation Loop
    this.animate();
  }

  setupLighting() {
    // Subtle ambient
    this.ambientLight = new THREE.AmbientLight(0x111111, 1.2);
    this.scene.add(this.ambientLight);

    // Volumetric yellow point in deep distance (emerges in intro)
    this.distantGlowLight = new THREE.PointLight(this.colors.cyberYellow, 0, 80);
    this.distantGlowLight.position.set(0, 2, -50);
    this.scene.add(this.distantGlowLight);

    // Sharp directional yellow rim light (highlights metallic eagle feathers)
    this.eagleRimLight = new THREE.DirectionalLight(this.colors.brightYellow, 2.2);
    this.eagleRimLight.position.set(-6, 12, 10);
    this.scene.add(this.eagleRimLight);

    // Soft top-white key light for titanium specular
    this.yellowKeyLight = new THREE.DirectionalLight(this.colors.pureWhite, 1.0);
    this.yellowKeyLight.position.set(8, 14, 12);
    this.scene.add(this.yellowKeyLight);

    // Fill rim light from below
    const bottomFill = new THREE.PointLight(0x222228, 1.5, 40);
    bottomFill.position.set(0, -10, 5);
    this.scene.add(bottomFill);
  }

  /**
   * Constructs the high-detail Cyber-Sculpted 3D Eagle
   */
  buildCinematicEagle() {
    this.eagleGroup = new THREE.Group();
    this.eagleGroup.position.set(0, -2, -80); // Starts in deep darkness
    this.eagleGroup.scale.set(1.4, 1.4, 1.4);

    // Materials
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: this.colors.charcoal,
      roughness: 0.3,
      metalness: 0.92,
      emissive: 0x050508,
      emissiveIntensity: 0.3
    });

    const chestArmorMat = new THREE.MeshStandardMaterial({
      color: this.colors.darkTitanium,
      roughness: 0.22,
      metalness: 0.95
    });

    const yellowAccentMat = new THREE.MeshStandardMaterial({
      color: this.colors.cyberYellow,
      emissive: this.colors.cyberYellow,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.8
    });

    const opticEyeMat = new THREE.MeshBasicMaterial({
      color: this.colors.brightYellow
    });

    const featherMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.28,
      metalness: 0.9,
      emissive: 0x111100,
      emissiveIntensity: 0.2
    });

    const featherRimMat = new THREE.MeshBasicMaterial({
      color: this.colors.cyberYellow,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });

    // 1. Sleek Aerodynamic Torso
    const bodyGeo = new THREE.ConeGeometry(1.6, 4.8, 8);
    bodyGeo.rotateX(Math.PI);
    this.torsoMesh = new THREE.Mesh(bodyGeo, titaniumMat);
    this.torsoMesh.scale.set(1.25, 1, 0.85);
    this.eagleGroup.add(this.torsoMesh);

    // Chest Armor Keel Plate
    const keelGeo = new THREE.OctahedronGeometry(1.2, 0);
    const keelMesh = new THREE.Mesh(keelGeo, chestArmorMat);
    keelMesh.position.set(0, 0.5, 0.85);
    keelMesh.scale.set(0.95, 1.7, 0.55);
    this.eagleGroup.add(keelMesh);

    // Glowing Cyber Spine Ribs
    for (let r = 0; r < 4; r++) {
      const ribGeo = new THREE.BoxGeometry(1.5 - r * 0.25, 0.08, 0.4);
      const ribMesh = new THREE.Mesh(ribGeo, yellowAccentMat);
      ribMesh.position.set(0, -0.6 + r * 0.65, 0.75 - r * 0.05);
      this.eagleGroup.add(ribMesh);
    }

    // 2. Head & Visor
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 2.7, 0.5);

    const headGeo = new THREE.ConeGeometry(0.85, 1.8, 6);
    headGeo.rotateX(Math.PI / 2.6);
    const headMesh = new THREE.Mesh(headGeo, titaniumMat);
    this.headGroup.add(headMesh);

    // Crown / Crest Feathers
    for (let c = 0; c < 3; c++) {
      const crestGeo = new THREE.BoxGeometry(0.18, 0.8 - c * 0.15, 0.08);
      const crestMesh = new THREE.Mesh(crestGeo, yellowAccentMat);
      crestMesh.position.set(0, 0.5 + c * 0.15, -0.4 - c * 0.2);
      crestMesh.rotation.x = -0.5 - c * 0.2;
      this.headGroup.add(crestMesh);
    }

    // Hooked Predator Beak
    const beakGeo = new THREE.ConeGeometry(0.38, 1.4, 5);
    beakGeo.rotateX(Math.PI / 1.7);
    const beakMesh = new THREE.Mesh(beakGeo, yellowAccentMat);
    beakMesh.position.set(0, -0.22, 1.05);
    this.headGroup.add(beakMesh);

    // Glowing Visor / Optic Sensor Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeo, opticEyeMat);
    leftEye.position.set(0.42, 0.22, 0.6);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, opticEyeMat);
    rightEye.position.set(-0.42, 0.22, 0.6);
    this.headGroup.add(rightEye);

    this.eagleGroup.add(this.headGroup);

    // 3. Articulated Wings with Layered Primary/Secondary Feather Blades
    this.wingsLeft = new THREE.Group();
    this.wingsLeft.position.set(1.1, 0.9, 0.1);

    this.wingsRight = new THREE.Group();
    this.wingsRight.position.set(-1.1, 0.9, 0.1);

    this.leftWingBlades = [];
    this.rightWingBlades = [];

    const bladeCounts = 6;
    for (let i = 0; i < bladeCounts; i++) {
      const span = 3.6 - i * 0.45;
      const width = 0.55 - i * 0.04;
      const featherGeo = new THREE.BoxGeometry(span, width, 0.08);

      // Left Blade
      const bladeLGroup = new THREE.Group();
      bladeLGroup.position.set(span * 0.45, 0.35 - i * 0.25, -i * 0.12);
      bladeLGroup.rotation.z = -0.15 + i * 0.08;

      const bladeLMesh = new THREE.Mesh(featherGeo, featherMat);
      bladeLGroup.add(bladeLMesh);

      const rimLMesh = new THREE.Mesh(featherGeo, featherRimMat);
      rimLMesh.scale.set(1.02, 1.05, 1.1);
      bladeLGroup.add(rimLMesh);

      // Yellow energy strip along leading edge
      const edgeGeo = new THREE.BoxGeometry(span * 0.9, 0.06, 0.1);
      const edgeMesh = new THREE.Mesh(edgeGeo, yellowAccentMat);
      edgeMesh.position.set(0, width * 0.45, 0);
      bladeLGroup.add(edgeMesh);

      this.wingsLeft.add(bladeLGroup);
      this.leftWingBlades.push(bladeLGroup);

      // Right Blade
      const bladeRGroup = new THREE.Group();
      bladeRGroup.position.set(-span * 0.45, 0.35 - i * 0.25, -i * 0.12);
      bladeRGroup.rotation.z = 0.15 - i * 0.08;

      const bladeRMesh = new THREE.Mesh(featherGeo, featherMat);
      bladeRGroup.add(bladeRMesh);

      const rimRMesh = new THREE.Mesh(featherGeo, featherRimMat);
      rimRMesh.scale.set(1.02, 1.05, 1.1);
      bladeRGroup.add(rimRMesh);

      const edgeRMesh = new THREE.Mesh(edgeGeo, yellowAccentMat);
      edgeRMesh.position.set(0, width * 0.45, 0);
      bladeRGroup.add(edgeRMesh);

      this.wingsRight.add(bladeRGroup);
      this.rightWingBlades.push(bladeRGroup);
    }

    this.eagleGroup.add(this.wingsLeft);
    this.eagleGroup.add(this.wingsRight);

    // 4. Stabilizing Aerodynamic Tail Plumage
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, -2.4, -0.35);

    for (let t = -3; t <= 3; t++) {
      const tLen = 2.4 - Math.abs(t) * 0.3;
      const tGeo = new THREE.BoxGeometry(0.32, tLen, 0.06);
      const tMesh = new THREE.Mesh(tGeo, titaniumMat);
      tMesh.position.set(t * 0.28, -tLen * 0.45, 0);
      tMesh.rotation.z = t * 0.09;
      this.tailGroup.add(tMesh);

      const tEdgeGeo = new THREE.BoxGeometry(0.06, tLen * 0.8, 0.08);
      const tEdge = new THREE.Mesh(tEdgeGeo, yellowAccentMat);
      tEdge.position.set(t * 0.28, -tLen * 0.45, 0.02);
      this.tailGroup.add(tEdge);
    }
    this.eagleGroup.add(this.tailGroup);

    // 5. Tucked Cyber Talons
    for (let s of [-0.65, 0.65]) {
      const clawGeo = new THREE.ConeGeometry(0.2, 0.7, 4);
      clawGeo.rotateX(Math.PI / 1.5);
      const claw = new THREE.Mesh(clawGeo, yellowAccentMat);
      claw.position.set(s, -1.8, 0.35);
      this.eagleGroup.add(claw);
    }

    this.scene.add(this.eagleGroup);
  }

  /**
   * Atmospheric floating particles in the 3D space
   */
  buildAtmosphericParticles() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cYellow = new THREE.Color(this.colors.cyberYellow);
    const cWhite = new THREE.Color(this.colors.pureWhite);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90 - 10;

      const clr = Math.random() > 0.65 ? cYellow : cWhite;
      colors[i * 3] = clr.r;
      colors[i * 3 + 1] = clr.g;
      colors[i * 3 + 2] = clr.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.65
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  /**
   * Wingtip Slipstream Particle Trails
   */
  buildSlipstreamTrails() {
    const count = 180;
    this.slipstreamGeo = new THREE.BufferGeometry();
    this.slipstreamPositions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      this.slipstreamPositions[i] = 0;
    }

    this.slipstreamGeo.setAttribute("position", new THREE.BufferAttribute(this.slipstreamPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: this.colors.cyberYellow,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.slipstreamParticles = new THREE.Points(this.slipstreamGeo, mat);
    this.scene.add(this.slipstreamParticles);
  }

  /**
   * Thin volumetric yellow light beams in the background
   */
  buildVolumetricLightBeams() {
    for (let i = 0; i < 4; i++) {
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.4, 60, 6);
      beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.colors.cyberYellow,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set((i - 1.5) * 16, 8, -40);
      beam.rotation.z = (i - 1.5) * 0.12;
      this.scene.add(beam);
      this.lightBeams.push(beam);
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer || !this.container) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onMouseMove(e) {
    this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Main render loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock ? this.clock.getDelta() : 0.016;
    const time = this.clock ? this.clock.getElapsedTime() : 0;

    // Smooth mouse lerping
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // 1. Organic Flight Physics (Sinusoidal wing flexion + banking)
    const flapFreq = this.isIntro ? 3.2 : 1.8;
    const flapCycle = Math.sin(time * flapFreq);
    const flexCycle = Math.sin(time * flapFreq - 0.4);

    if (this.wingsLeft && this.wingsRight) {
      this.wingsLeft.rotation.z = flapCycle * 0.35 + 0.1;
      this.wingsRight.rotation.z = -flapCycle * 0.35 - 0.1;

      this.wingsLeft.rotation.y = flexCycle * 0.12;
      this.wingsRight.rotation.y = -flexCycle * 0.12;

      for (let i = 0; i < this.leftWingBlades.length; i++) {
        const bladeFlex = Math.sin(time * flapFreq - i * 0.15) * 0.08;
        this.leftWingBlades[i].rotation.x = bladeFlex;
        this.rightWingBlades[i].rotation.x = bladeFlex;
      }
    }

    if (this.headGroup) {
      this.headGroup.rotation.y = Math.sin(time * 0.8) * 0.1 + this.mouseX * 0.2;
      this.headGroup.rotation.x = Math.sin(time * 1.2) * 0.05 - this.mouseY * 0.15;
    }

    if (this.tailGroup) {
      this.tailGroup.rotation.x = -flapCycle * 0.1;
      this.tailGroup.rotation.y = Math.sin(time * 1.4) * 0.1;
    }

    // 2. Cinematic Intro Sequence Handler (Continuous cinematic flow)
    if (this.isIntro) {
      this.introTime += delta;

      // Phase 1 (0 to 1.5s): Dark void, particles drift, distant glow starts
      if (this.introTime < 1.5) {
        const p = this.introTime / 1.5;
        this.distantGlowLight.intensity = p * 1.5;
        this.eagleGroup.position.set(0, -2, -80 + p * 20);
      }
      // Phase 2 (1.5 to 4.5s): Eagle sweeps forward from darkness across the viewport
      else if (this.introTime < 4.5) {
        const p = (this.introTime - 1.5) / 3.0;
        this.distantGlowLight.intensity = 1.5 + p * 2.0;

        // Smooth flight path forward and banking across screen
        const curZ = -60 + p * 65; // from -60 to +5
        const curX = Math.sin(p * Math.PI) * 4.5;
        const curY = Math.cos(p * Math.PI) * 2.0 - 0.5;

        this.eagleGroup.position.set(curX, curY, curZ);
        this.eagleGroup.rotation.z = -Math.sin(p * Math.PI) * 0.35; // Banks naturally into the curve
        this.eagleGroup.rotation.y = -Math.sin(p * Math.PI) * 0.25;
        this.eagleGroup.rotation.x = 0.08;
      }
      // Phase 3 (4.5 to 7.0s): Eagle circles and glides smoothly into the distant background
      else if (this.introTime < 7.0) {
        const p = (this.introTime - 4.5) / 2.5;
        const curZ = 5 - p * 38; // glides back to -33
        const curX = 4.5 * (1 - p);
        const curY = 1.5 - p * 0.5;

        this.eagleGroup.position.set(curX, curY, curZ);
        this.eagleGroup.rotation.z = Math.sin(p * Math.PI) * 0.15;
        this.eagleGroup.rotation.y = Math.sin(p * Math.PI) * 0.1;

        if (!this.introCompleted && this.introTime > 5.5) {
          this.introCompleted = true;
          // Trigger branding elements if callback available
          if (window.onCyberVaultIntroReady) {
            window.onCyberVaultIntroReady();
          }
        }
      }
      // Phase 4 (7.0s+): Cruising in the distant background
      else {
        const patrolTime = this.introTime - 7.0;
        const curX = Math.sin(patrolTime * 0.4) * 6;
        const curY = 1.2 + Math.cos(patrolTime * 0.6) * 0.8;
        this.eagleGroup.position.set(curX, curY, -34);
        this.eagleGroup.rotation.z = Math.cos(patrolTime * 0.4) * 0.15;
        this.eagleGroup.rotation.y = Math.cos(patrolTime * 0.4) * 0.2;
      }
    } else {
      // Dashboard Mode: Eagle glides slowly in the distant background, always behind UI
      const patrolTime = time * 0.3;
      const curX = Math.sin(patrolTime) * 10;
      const curY = 2 + Math.cos(patrolTime * 1.3) * 1.5;
      this.eagleGroup.position.set(curX, curY, -38);
      this.eagleGroup.rotation.z = Math.cos(patrolTime) * 0.18;
      this.eagleGroup.rotation.y = Math.cos(patrolTime) * 0.25;

      // Camera parallax
      this.camera.position.x = this.mouseX * 2.5;
      this.camera.position.y = this.mouseY * 1.8;
      this.camera.lookAt(0, 0, -35);
    }

    // 3. Update Slipstream wingtip particles
    if (this.slipstreamGeo && this.eagleGroup) {
      const pArr = this.slipstreamPositions;
      const wingTipX = this.eagleGroup.position.x + (flapCycle > 0 ? 5.2 : 4.4);
      const wingTipY = this.eagleGroup.position.y + flapCycle * 0.8;
      const wingTipZ = this.eagleGroup.position.z - 0.5;

      pArr[this.slipstreamIdx * 3] = wingTipX;
      pArr[this.slipstreamIdx * 3 + 1] = wingTipY;
      pArr[this.slipstreamIdx * 3 + 2] = wingTipZ;

      this.slipstreamIdx = (this.slipstreamIdx + 1) % (pArr.length / 3);

      for (let i = 0; i < pArr.length / 3; i++) {
        pArr[i * 3 + 2] -= 0.3; // Particles drift backward
      }
      this.slipstreamGeo.attributes.position.needsUpdate = true;
    }

    // 4. Slow drift of ambient particles
    if (this.particleSystem) {
      this.particleSystem.rotation.y = time * 0.012;
      this.particleSystem.rotation.x = time * 0.008;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Transition from Intro to Main Dashboard
   */
  transitionToDashboard(onComplete) {
    this.isIntro = false;

    if (typeof gsap !== "undefined") {
      // Smooth camera forward zoom and eagle retreat to distant background
      gsap.to(this.camera.position, {
        z: 18,
        y: 0,
        x: 0,
        duration: 1.2,
        ease: "power2.inOut"
      });

      gsap.to(this.eagleGroup.position, {
        z: -38,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
          if (typeof onComplete === "function") onComplete();
        }
      });
    } else {
      this.camera.position.set(0, 0, 18);
      this.eagleGroup.position.set(0, 2, -38);
      if (typeof onComplete === "function") onComplete();
    }
  }

  /**
   * Transition from Intro to Auth Enclave
   */
  transitionToAuth(onComplete) {
    this.isIntro = false;
    if (typeof gsap !== "undefined") {
      gsap.to(this.camera.position, {
        z: 20,
        y: 0,
        x: 0,
        duration: 1.0,
        ease: "power2.inOut"
      });
      gsap.to(this.eagleGroup.position, {
        z: -42,
        duration: 1.0,
        ease: "power2.inOut",
        onComplete: () => {
          if (typeof onComplete === "function") onComplete();
        }
      });
    } else {
      this.camera.position.set(0, 0, 20);
      this.eagleGroup.position.set(0, 2, -42);
      if (typeof onComplete === "function") onComplete();
    }
  }

  /**
   * Recenter 3D Camera / Reset
   */
  resetCamera() {
    if (typeof gsap !== "undefined" && this.camera) {
      gsap.to(this.camera.position, {
        x: 0,
        y: 0,
        z: 18,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }

  /**
   * Focus camera subtly per active module
   */
  focusView(viewId) {
    this.currentView = viewId;
    if (!this.camera) return;

    let targetZ = 18;
    let targetY = 0;

    if (viewId === "view-analysis") {
      targetZ = 22;
      targetY = 1;
    } else if (viewId === "view-evidence-graph") {
      targetZ = 24;
      targetY = -1;
    }

    if (typeof gsap !== "undefined") {
      gsap.to(this.camera.position, {
        z: targetZ,
        y: targetY,
        duration: 0.9,
        ease: "power2.out"
      });
    }
  }
}

// Auto-instantiate on load and bind to window
window.CyberEagleEngine = null;

function initCyberEagleEngine() {
  if (!window.CyberEagleEngine) {
    window.CyberEagleEngine = new CyberWorld3D("cyber-world-container");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCyberEagleEngine);
} else {
  initCyberEagleEngine();
}

export default CyberWorld3D;
