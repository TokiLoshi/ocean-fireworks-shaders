import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import fireworkVertexShader from "./shaders/firework/vertex.glsl";
import fireworkFragmentShader from "./shaders/firework/fragment.glsl";
import oceanVertexShader from "./shaders/ocean/vertex.glsl";
import oceanFragmentShader from "./shaders/ocean/fragment.glsl";
import gsap from "gsap";
import { Sky } from "three/addons/objects/Sky.js";
import Stats from "stats.js";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340, closeFolders: true });
gui.close();

// Canvas
const canvas = document.querySelector("canvas.webgl");
const debugObject = {};

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Performances
 */
//TODO: unlock the frame rate at 70/80ffs
// https://gist.github.com/brunosimon/c15e7451a802fa8e34c0678620022f7d
// check the draw calls
// Review this lesson on performances for shadows: https://threejs-journey.com/lessons/performance-tips#32-specify-the-precision
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
	sizes.width * sizes.pixelRatio,
	sizes.height * sizes.pixelRatio
);

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);
	sizes.resolution.set(
		sizes.width * sizes.pixelRatio,
		sizes.height * sizes.pixelRatio
	);

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
	45, // field of view (degrees) vertical
	sizes.width / sizes.height, // aspect ratio
	0.1, // near
	100 // far
);
// camera.position.set(1.5, 0, 6);
// camera x, y, z
camera.position.set(0.2, 0.1, 1.7);
scene.add(camera);

// Debugger
// const cameraHelper = new THREE.CameraHelper(camera);
// scene.add(cameraHelper);

const cameraFolder = gui.addFolder("Camera");
cameraFolder
	.add(camera.position, "x")
	.min(-10)
	.max(10)
	.step(0.1)
	.name("cameraX");
cameraFolder.add(camera.position, "y").min(0).max(10).step(0.1).name("cameraY");
cameraFolder
	.add(camera.position, "z")
	.min(-10)
	.max(10)
	.step(0.1)
	.name("cameraZ");

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// Prevent user from going under water and looking too high up
controls.minPolarAngle = Math.PI * 0.4;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minDistance = 0.5;
controls.maxDistance = 2;
controls.update();

const controlsFolder = gui.addFolder("Orbit Controls");
controlsFolder.add(controls, "enableDamping").name("damping");
controlsFolder
	.add(controls, "dampingFactor")
	.min(0)
	.max(5)
	.step(0.1)
	.name("dampingFactor");
controlsFolder
	.add(controls, "minPolarAngle")
	.min(-2)
	.max(Math.PI)
	.step(0.01)
	.name("minPolarAngle")
	.onChange((value) => {
		console.log(
			`Min Polar Angle: ${((value * 180) / Math.PI).toFixed(2)} degrees`
		);
	});
controlsFolder
	.add(controls, "maxPolarAngle")
	.min(0)
	.max(Math.PI)
	.step(0.1)
	.name("maxPolarAngle")
	.onChange((value) => {
		console.log(
			`Max Polar Angle changed to : ${((value * 180) / Math.PI).toFixed(2)}`
		);
	});
controlsFolder
	.add(controls, "minDistance")
	.min(0)
	.max(10)
	.step(0.1)
	.name("minDistance");
controlsFolder
	.add(controls, "maxDistance")
	.min(1)
	.max(20)
	.step(0.1)
	.name("maxDistance");

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	// antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

const renderFolder = gui.addFolder("Renderer");
renderFolder.add(renderer, "toneMapping", {
	No: THREE.NoToneMapping,
	Linear: THREE.LinearToneMapping,
	Reinhard: THREE.ReinhardToneMapping,
	ACESFilmic: THREE.ACESFilmicToneMapping,
});
renderFolder
	.add(renderer, "toneMappingExposure")
	.min(0)
	.max(10)
	.step(0.001)
	.name("tone exposure");

/**
 * Textures
 */
const textures = [
	textureLoader.load("./particles/1.png"),
	textureLoader.load("./particles/2.png"),
	textureLoader.load("./particles/3.png"),
	textureLoader.load("./particles/4.png"),
	textureLoader.load("./particles/5.png"),
	textureLoader.load("./particles/6.png"),
	textureLoader.load("./particles/7.png"),
	textureLoader.load("./particles/8.png"),
];

/**
 * Fireworks
 */
const createFirework = (count, position, size, texture, radius, color) => {
	// Positions
	console.log("creating firework with positions: ", position);
	const positionsArray = new Float32Array(count * 3);
	const sizesArray = new Float32Array(count);
	const timeMultipliersArray = new Float32Array(count);

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;

		const spherical = new THREE.Spherical(
			radius * 0.75 + Math.random() * 0.25,
			Math.random() * Math.PI,
			Math.random() * Math.PI * 2
		);
		const position = new THREE.Vector3();
		position.setFromSpherical(spherical);
		positionsArray[i3] = position.x;
		positionsArray[i3 + 1] = position.y;
		positionsArray[i3 + 2] = position.z;

		sizesArray[i] = Math.random();
		timeMultipliersArray[i] = 1 + Math.random();
	}

	// Geometry
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(positionsArray, 3)
	);
	geometry.setAttribute(
		"aSize",
		new THREE.Float32BufferAttribute(sizesArray, 1)
	);
	geometry.setAttribute(
		"aTimeMultiplier",
		new THREE.Float32BufferAttribute(timeMultipliersArray, 1)
	);

	texture.flipY = false;
	// Material
	const material = new THREE.ShaderMaterial({
		vertexShader: fireworkVertexShader,
		fragmentShader: fireworkFragmentShader,
		uniforms: {
			uSize: new THREE.Uniform(size),
			uResolution: new THREE.Uniform(sizes.resolution),
			uTexture: new THREE.Uniform(texture),
			uColor: new THREE.Uniform(color),
			uProgress: new THREE.Uniform(0),
		},
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});

	// Points
	const firework = new THREE.Points(geometry, material);
	firework.position.copy(position);
	scene.add(firework);
	const destroy = () => {
		console.log("destroy");
		scene.remove(firework);
		geometry.dispose();
		material.dispose();
	};
	gsap.to(material.uniforms.uProgress, {
		value: 1,
		duration: 3,
		ease: "linear",
		onComplete: destroy,
	});
};
const randomTexture = Math.floor(Math.random() * textures.length);
createFirework(
	100, // Count
	new THREE.Vector3(0, 1, -10), // Position
	0.5, // Size
	textures[randomTexture], // Texture
	1, // Radius
	new THREE.Color("#a85ce6")
	// new THREE.Color("#8affff") // Color
);

const createRandomFirework = () => {
	const count = Math.round(400 + Math.random() * 1000);
	const angle = Math.random() * Math.PI * 2;
	const distance = camera.position.z;
	const position = new THREE.Vector3(
		(Math.random() - 0.5) * 20,
		Math.random() * 8,
		-15 + (Math.random() - 0.5) * 10
	);
	const radius = 0.7 + Math.random();
	const size = 0.1 + Math.random() * 0.1;
	const texture = textures[Math.floor(Math.random() * textures.length)];

	const color = new THREE.Color();
	color.setHSL(Math.random(), 1, 0.7);
	createFirework(count, position, size, texture, radius, color);
};

window.addEventListener("click", (event) => {
	const mouseX = event.clientX / window.innerWidth;
	const mouseY = 1 - event.clientY / window.innerHeight;
	console.log(`Mouse x: ${mouseX} mouse y: ${mouseY}`);
	const position = new THREE.Vector3((mouseX - 0.5) * 10, mouseY * 2, -15);

	console.log("New postion: ", position);
	createFirework(
		Math.round(400 + Math.random() * 1000), // Count
		position,
		0.1 + Math.random() * 0.1, // Size
		textures[Math.floor(Math.random() * textures.length)],
		0.7 + Math.random(),
		new THREE.Color().setHSL(Math.random(), 1, 0.7)
	);
});

/**
 * Sky
 */

// Add Sky
// Source: https://github.com/mrdoob/three.js/blob/master/examples/webgpu_ocean.html
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

const skyParameters = {
	turbidity: 8.4,
	rayleigh: 1.01,
	mieCoefficient: 0.048,
	mieDirectionalG: 0.662,
	elevation: -1.85,
	azimuth: -167.2,
	exposure: renderer.toneMappingExposure,
};

function updateSky() {
	const uniforms = sky.material.uniforms;
	uniforms["turbidity"].value = skyParameters.turbidity;
	uniforms["rayleigh"].value = skyParameters.rayleigh;
	uniforms["mieCoefficient"].value = skyParameters.mieCoefficient;
	uniforms["mieDirectionalG"].value = skyParameters.mieDirectionalG;

	const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
	const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);

	sun.setFromSphericalCoords(1, phi, theta);

	uniforms["sunPosition"].value.copy(sun);

	renderer.toneMappingExposure = skyParameters.exposure;
	renderer.render(scene, camera);
}

const skyFolder = gui.addFolder("Sky");
skyFolder.add(skyParameters, "turbidity", 0.0, 20.0, 0.1).onChange(updateSky);
skyFolder.add(skyParameters, "rayleigh", 0.0, 4, 0.001).onChange(updateSky);
skyFolder
	.add(skyParameters, "mieCoefficient", 0.0, 0.1, 0.001)
	.onChange(updateSky);
skyFolder
	.add(skyParameters, "mieDirectionalG", 0.0, 1, 0.001)
	.onChange(updateSky);
skyFolder.add(skyParameters, "elevation", -3, 90, 0.01).onChange(updateSky);
skyFolder.add(skyParameters, "azimuth", -180, 180, 0.1).onChange(updateSky);
skyFolder.add(skyParameters, "exposure", 0, 1, 0.0001).onChange(updateSky);

updateSky();

/**
 * Water
 */
//
const waterGeometry = new THREE.PlaneGeometry(4, 4, 512, 512);

// Water color
// debugObject.depthColor = "#186691";
// debugObject.surfaceColor = "#9bd8ff";
debugObject.depthColor = "#2188c0";
debugObject.surfaceColor = "#e8cea1";

const waterMaterial = new THREE.ShaderMaterial({
	vertexShader: oceanVertexShader,
	fragmentShader: oceanFragmentShader,
	// wireframe: true,
	uniforms: {
		uTime: { value: 0 },

		uBigWavesElevation: { value: 0.2 },
		uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
		uBigWavesSpeed: { value: 0.75 },

		uSmallWavesElevation: { value: 0.15 },
		uSmallWavesFrequency: { value: 3 },
		uSmallWavesSpeed: { value: 0.2 },
		uSmallWavesIterations: { value: 4 },

		uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
		uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
		uColorOffset: { value: 0.08 },
		uColorMultiplier: { value: 5 },
	},
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = Math.PI * -0.5;
water.position.y = -0.5;
scene.add(water);

const waterFolder = gui.addFolder("Ocean");

waterFolder
	.add(waterMaterial.uniforms.uBigWavesElevation, "value")
	.min(0)
	.max(1)
	.step(0.001)
	.name("uBigWavesElevation");
waterFolder
	.add(waterMaterial.uniforms.uBigWavesFrequency.value, "x")
	.min(0)
	.max(1)
	.step(0.001)
	.name("uBigWavesFrequencyX");
waterFolder
	.add(waterMaterial.uniforms.uBigWavesFrequency.value, "y")
	.min(0)
	.max(10)
	.step(0.001)
	.name("uBigWavesFrequencyY");
waterFolder
	.add(waterMaterial.uniforms.uBigWavesSpeed, "value")
	.min(0)
	.max(4)
	.step(0.001)
	.name("uBigWavesSpeed");
waterFolder
	.addColor(debugObject, "depthColor")
	.name("depthColor")
	.onChange(() => {
		waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor);
	});
waterFolder
	.addColor(debugObject, "surfaceColor")
	.name("surfaceColor")
	.onChange(() => {
		waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor);
	});
waterFolder
	.add(waterMaterial.uniforms.uColorOffset, "value")
	.min(0)
	.max(1)
	.step(0.1)
	.name("uColorOffset");
waterFolder
	.add(waterMaterial.uniforms.uColorMultiplier, "value")
	.min(0)
	.max(10)
	.step(0.1)
	.name("uColorMultiplier");
waterFolder
	.add(waterMaterial.uniforms.uSmallWavesElevation, "value")
	.min(0)
	.max(1)
	.step(0.001)
	.name("uSmallWavesElevation");
waterFolder
	.add(waterMaterial.uniforms.uSmallWavesFrequency, "value")
	.min(0)
	.max(30)
	.step(0.001)
	.name("uSmallWavesElevation");
waterFolder
	.add(waterMaterial.uniforms.uSmallWavesSpeed, "value")
	.min(0)
	.max(4)
	.step(0.001)
	.name("uSmallWavesSpeed");
waterFolder
	.add(waterMaterial.uniforms.uSmallWavesIterations, "value")
	.min(0)
	.max(5)
	.step(1)
	.name("uSmallWavesIterations");

const FIREWORK_INTERVAL = 2000;
setInterval(() => {
	createRandomFirework();
}, FIREWORK_INTERVAL);

const createRandomIntervalFirework = () => {
	createRandomFirework();
	const randomDelay = FIREWORK_INTERVAL + (Math.random() - 0.5) * 5000;
	setTimeout(createRandomIntervalFirework, randomDelay);
};
createRandomIntervalFirework();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	// Update controls
	const elapsedTime = clock.getElapsedTime();
	stats.begin();
	controls.update();

	waterMaterial.uniforms.uTime.value = elapsedTime;

	// Render
	renderer.render(scene, camera);
	stats.end();
	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
