import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import fireworkVertexShader from "./shaders/firework/vertex.glsl";
import fireworkFragmentShader from "./shaders/firework/fragment.glsl";
import gsap from "gsap";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import Stats from "stats.js";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340, closeFolders: true });
gui.close();

// Canvas
const canvas = document.querySelector("canvas.webgl");

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
	25,
	sizes.width / sizes.height,
	0.1,
	200
);
// camera.position.set(1.5, 0, 6);
camera.position.set(10, 0, 75);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

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

createFirework(
	100, // Count
	new THREE.Vector3(), // Position
	0.5, // Size
	textures[7], // Texture
	1, // Radius
	new THREE.Color("#8affff") // Color
);

const createRandomFirework = () => {
	const count = Math.round(400 + Math.random() * 1000);
	const angle = Math.random() * Math.PI * 2;
	const position = new THREE.Vector3(
		(Math.random() - 0.5) * 20,
		Math.random() * 20,
		(Math.random() - 0.5) * 20
	);
	const radius = 0.5 + Math.random();
	const size = 0.1 + Math.random() * 0.1;
	const texture = textures[Math.floor(Math.random() * textures.length)];

	const color = new THREE.Color();
	color.setHSL(Math.random(), 1, 0.7);
	createFirework(count, position, size, texture, radius, color);
};

window.addEventListener("click", createRandomFirework);

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
	turbidity: 10,
	rayleigh: 3,
	mieCoefficient: 0.005,
	mieDirectionalG: 0.7,
	elevation: -2.3,
	azimuth: 180,
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
 * Ocean
 */
//

// based on webgupu_ocean from three.js examples: https://github.com/mrdoob/three.js/blob/master/examples/webgpu_ocean.html
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const loader = new THREE.TextureLoader();
const waterNormals = loader.load("textures/waternormals.jpg");
waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

const waterParameters = {
	sunColor: 0xffffff,
	waterColor: 0x001e0f,
	distortionScale: 3.7,
	size: 1.0,
	alpha: 1.0,
};

const water = new Water(waterGeometry, {
	textureWidth: 512,
	textureHeight: 512,
	waterNormals: waterNormals,
	sunDirection: new THREE.Vector3(sun.x, sun.y, sun.z),
	sunColor: waterParameters.sunColor,
	waterColor: waterParameters.waterColor,
	distortionScale: waterParameters.distortionScale,
	fog: scene.fog !== undefined,
});

water.rotation.x = -Math.PI / 2;
// TODO: Tweak to find the perfect value
water.position.y = -3;
scene.add(water);

const updateWater = () => {
	water.material.uniforms["sunDirection"].value.copy(sun);
	water.material.uniforms["distortionScale"].value =
		waterParameters.distortionScale;
	water.material.uniforms["size"].value = waterParameters.size;
	water.material.uniforms["sunColor"].value.setHex(waterParameters.sunColor);
	water.material.uniforms["waterColor"].value.setHex(
		waterParameters.waterColor
	);
};

const waterFolder = gui.addFolder("Water");
waterFolder
	.add(waterParameters, "distortionScale", 0, 8, 0.1)
	.name("Distortion Scale")
	.onChange(updateWater);
waterFolder
	.add(waterParameters, "size", 0.1, 10, 0.1)
	.name("Wave Size")
	.onChange(updateWater);
waterFolder
	.add(waterParameters, "waterColor")
	.name("Water Color")
	.onChange((value) => {
		waterParameters.waterColor = value;
		updateWater();
	});
waterFolder
	.add(waterParameters, "sunColor")
	.name("Sun Color")
	.onChange((value) => {
		waterParameters.sunColor = value;
		updateWater();
	});

/**
 * Animate
 */
const tick = () => {
	// Update controls
	stats.begin();
	controls.update();
	water.material.uniforms["time"].value += Math.sin() * Math.random();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
	stats.end();
};

tick();
