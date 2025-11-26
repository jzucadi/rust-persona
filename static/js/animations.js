// Wave animations using Three.js and GSAP
// Based on the Waves project

import {
  PerspectiveCamera,
  Mesh,
  WebGLRenderer,
  Scene,
  DoubleSide,
  Raycaster,
  ShaderMaterial,
  Vector2,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  LinearFilter,
  Color,
} from "three";

// Inline shaders
const VERTEX_SHADER = `
    varying vec2 vUv;
    uniform float hover;
    uniform float time;
    uniform vec2 intersect;

    uniform float hoverRadius;
    uniform float amplitude;
    uniform float speed;

    void main() {
        vUv = uv;
        vec4 _plane = modelMatrix * vec4(position, 1.0);

        if (hover > 0.0) {
            float _wave = hover * amplitude * sin(speed * (position.x + position.y + time));
            float _dist = length(uv - intersect);
            float _inCircle = 1. - (clamp(_dist, 0., hoverRadius) / hoverRadius);
            float _distort = _inCircle * _wave;

            _plane.z += _distort;
        }

        gl_Position = projectionMatrix * viewMatrix * _plane;
    }
`;

const FRAGMENT_SHADER = `
    uniform sampler2D uTexture;
    uniform vec2 ratio;

    varying vec2 vUv;

    void main(){

        vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        gl_FragColor = texture2D(uTexture, uv);
    }
`;

const FOV = 50;
const CAMERA_DISTANCE = 50;
const PLANE_WIDTH_SEGMENTS = 30;

class ImageWaveEffect {
  constructor(imgElement) {
    this.imgElement = imgElement;
    this.container = imgElement.closest(".pic");
    this.mouse = new Vector2();
    this.time = 0;
    this.uv = new Vector2(0, 0);
    this.isHovering = false;
    this.animationFrameId = null;

    this.init();
  }

  async init() {
    const imgSrc = this.imgElement.src;

    // Wait for image to load
    await new Promise((resolve) => {
      if (this.imgElement.complete) {
        resolve();
      } else {
        this.imgElement.addEventListener("load", resolve);
      }
    });

    // IMPORTANT: Get the exact rendered dimensions BEFORE hiding the image
    const imgRect = this.imgElement.getBoundingClientRect();
    const targetWidth = imgRect.width;
    const targetHeight = imgRect.height;

    console.log("Original image dimensions:", targetWidth, "x", targetHeight);

    // Create a wrapper div with explicit dimensions
    const wrapper = document.createElement("div");
    wrapper.className = "wave-image-wrapper";
    wrapper.style.width = targetWidth + "px";
    wrapper.style.height = targetHeight + "px";
    wrapper.style.boxShadow = "var(--shad)";
    wrapper.style.borderRadius = "5px";
    wrapper.style.overflow = "hidden";
    wrapper.style.justifySelf = "right";
    wrapper.style.display = "block";

    // Create canvas - set both element dimensions AND CSS
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth * window.devicePixelRatio;
    canvas.height = targetHeight * window.devicePixelRatio;
    canvas.style.width = targetWidth + "px";
    canvas.style.height = targetHeight + "px";
    canvas.style.display = "block";

    // Set up Three.js scene
    this.scene = new Scene();
    this.scene.background = new Color("#ffffff");

    this.camera = new PerspectiveCamera(
      FOV,
      targetWidth / targetHeight,
      1,
      1000,
    );
    this.camera.position.z = CAMERA_DISTANCE;

    this.raycaster = new Raycaster();

    this.renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });

    // Create the plane with wave shader
    await this.createPlane(imgSrc, targetWidth, targetHeight);

    // Add canvas to wrapper, then replace image with wrapper
    wrapper.appendChild(canvas);
    this.imgElement.style.display = "none";
    this.container.appendChild(wrapper);

    // Set renderer size
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(targetWidth, targetHeight);
    this.renderer.render(this.scene, this.camera);

    // Start animation loop
    this.animate();

    // Set up event listeners
    this.setupEventListeners();
  }

  async createPlane(imageSrc, width, height) {
    // Load texture
    const texture = await new Promise((resolve, reject) => {
      new TextureLoader().load(
        imageSrc,
        (t) => {
          t.wrapT = t.wrapS = RepeatWrapping;
          t.anisotropy = 0;
          t.magFilter = LinearFilter;
          t.minFilter = LinearFilter;
          resolve(t);
        },
        undefined,
        reject,
      );
    });

    // Calculate visible dimensions
    const visibleHeight =
      2 *
      Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
      Math.abs(CAMERA_DISTANCE);
    const visibleWidth = visibleHeight * this.camera.aspect;

    const planeWidth = visibleWidth / 2;
    const planeAspectRatio = height / width;
    const planeHeight = planeWidth * planeAspectRatio;

    // Calculate texture ratio for proper aspect ratio
    const textureAspectRatio = texture.image.width / texture.image.height;
    const planeAspect = planeWidth / planeHeight;
    const ratio = new Vector2(
      Math.min(planeAspect / textureAspectRatio, 1.0),
      Math.min(textureAspectRatio / planeAspect, 1.0),
    );

    // Create shader material
    const planeMaterial = new ShaderMaterial({
      uniforms: {
        hover: { type: "f", value: 0.0 },
        uTexture: { type: "t", value: texture },
        time: { type: "f", value: 0 },
        intersect: { type: "v2", value: this.uv },
        ratio: { type: "v2", value: ratio },
        hoverRadius: { type: "f", value: 0.35 },
        speed: { type: "f", value: 0.7 },
        amplitude: { type: "f", value: 10 },
      },
      side: DoubleSide,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const planeGeometry = new PlaneGeometry(
      planeWidth,
      planeHeight,
      PLANE_WIDTH_SEGMENTS,
      Math.round(PLANE_WIDTH_SEGMENTS * planeAspectRatio),
    );

    this.plane = new Mesh(planeGeometry, planeMaterial);
    this.scene.add(this.plane);
  }

  setupEventListeners() {
    // Attach listeners to the wrapper instead of container
    const wrapper = this.container.querySelector(".wave-image-wrapper");
    wrapper.addEventListener("mouseenter", (e) => this.handleMouseEnter(e));
    wrapper.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    wrapper.addEventListener("mouseleave", (e) => this.handleMouseLeave(e));
  }

  handleMouseEnter(e) {
    this.isHovering = true;
    const wrapper = this.container.querySelector(".wave-image-wrapper");
    wrapper.style.cursor = "pointer";

    // Animate hover value and scale with GSAP
    gsap.to(this.plane.material.uniforms.hover, 0.35, { value: 1.0 });
    gsap.to(this.plane.scale, 0.25, { x: 1.05, y: 1.05 });
  }

  handleMouseMove(e) {
    if (!this.isHovering) return;

    const wrapper = this.container.querySelector(".wave-image-wrapper");
    const rect = wrapper.getBoundingClientRect();

    // Normalized device coordinates for raycaster
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.plane, false);

    if (intersects.length > 0) {
      // Update UV coordinates for wave center
      this.uv.x = intersects[0].uv.x;
      this.uv.y = intersects[0].uv.y;

      // Move plane slightly toward mouse
      gsap.to(this.plane.position, 0.35, {
        x: this.mouse.x * 2,
        y: this.mouse.y * 2,
      });
    }
  }

  handleMouseLeave(e) {
    this.isHovering = false;
    const wrapper = this.container.querySelector(".wave-image-wrapper");
    wrapper.style.cursor = "default";

    // Animate back to original state
    gsap.to(this.plane.position, 0.35, { x: 0, y: 0 });
    gsap.to(this.plane.scale, 0.35, { x: 1, y: 1 });
    gsap.to(this.plane.material.uniforms.hover, 0.35, { value: 0.0 });
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Update time for wave animation
    this.time += 0.05;
    if (this.plane && this.plane.material.uniforms.time) {
      this.plane.material.uniforms.time.value = this.time;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Initialize wave effects for all job images
document.addEventListener("DOMContentLoaded", function () {
  const jobImages = document.querySelectorAll(".pic img");
  const waveEffects = [];

  jobImages.forEach((img) => {
    // Wait for image to load before creating effect
    if (img.complete) {
      waveEffects.push(new ImageWaveEffect(img));
    } else {
      img.addEventListener("load", () => {
        waveEffects.push(new ImageWaveEffect(img));
      });
    }
  });
});
