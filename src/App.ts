import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import dat from 'three/examples/jsm/libs/dat.gui.module.js';

// Phisics class
import { Dot } from './Dot';
import { Spring } from './Spring';
import { Drawable, Simulated } from './Interfaces';

export default class App {

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;

    cube: THREE.Mesh;

    gui: dat.GUI;
    stats: Stats;

    param = {
        // playPause: function() { this.param.play = !this.param.play;}.bind(this),
        play: true,
        drawFps: 60,
    }

    lastTime: number;

    // Simulation data
    h: number; // timeStep for simulation update (1/F)
    dots: (Dot & Drawable)[];
    constraints: (Simulated & Drawable)[];

    constructor() {

        // performance monitor
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.setupGui();

        // create Scene
        this.scene = new THREE.Scene();

        // create Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 10;
        this.camera.position.z = 50;

        // create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 500;
        this.controls.target = new THREE.Vector3(0, 0, 0);

        // setup scene
        this.setupScene();

        // add Events Global
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.setupPhysics();

        for (let d of this.dots) d.addToscene(this.scene);
        for (let c of this.constraints) c.addToscene(this.scene);

        this.param.play = true;
        this.lastTime = Date.now();
        this.animate();
    }

    setupPhysics() {

        this.h = 1/60;
        this.dots = [];
        this.constraints = [];
        
        const size: number = 10;
        for (let i = 0; i < size; ++i)
            this.dots.push(new Dot(1, new THREE.Vector3((-size/2+i)*5, 1, 0), 0x0000ff, (i == 0 || i == size-1) ? Dot.Type.Fix : Dot.Type.notFix));

        for (let i = 0; i < size-1; ++i)
            this.constraints.push(new Spring(this.dots[i], this.dots[i+1], 1/(this.h*this.h)));

        // initial conditions
        for (let i = 0; i < size; ++i)
            this.dots[i].pos.y -= (size-Math.abs(size/2-i));
    }

    setupScene() {
        this.scene.background = new THREE.Color(0xe0e0e0);
        this.scene.fog = new THREE.Fog(0xe0e0e0, 30, 150);

        // lights
        this.scene.add(new THREE.AmbientLight(0x222222));

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 50, 50);

        // dirLight.castShadow = true;

        // dirLight.shadow.mapSize.width = 2048;
        // dirLight.shadow.mapSize.height = 2048;

        // const d = 200;
        // dirLight.shadow.camera.left = - d;
        // dirLight.shadow.camera.right = d;
        // dirLight.shadow.camera.top = d;
        // dirLight.shadow.camera.bottom = - d;
        // dirLight.shadow.camera.far = 1000;

        this.scene.add(dirLight);

        // ground
        // const groundGeom: THREE.PlaneBufferGeometry = new THREE.PlaneBufferGeometry(400, 400);
        // const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        // const ground = new THREE.Mesh( groundGeom, groundMat);
        // ground.rotation.x = -Math.PI /2;
        // ground.receiveShadow = true;
        // this.scene.add(ground);

        // grid
        const grid = new THREE.GridHelper(400, 80, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        
        this.stats.begin();
        const now: number = Date.now();
        if (this.param.play) {
            this.simulation();
        }
        
        const elapsedTime = now - this.lastTime;

        const fpsInterval: number = 1000 / this.param.drawFps;
        if(elapsedTime > fpsInterval) {
            this.lastTime = now - (elapsedTime % fpsInterval);
            this.renderer.render(this.scene, this.camera);
        }

        this.stats.end();


        //  it will not go higher than the refresh rate
        requestAnimationFrame(this.animate.bind(this));
    }

    simulation() {

        for (let d of this.dots) {
            d.update(this.h, Dot.IntegrationType.Verlet);
        }

        for (let c of this.constraints) {
            c.update(this.h);
        }
    }

    private setupGui() {
        this.gui = new dat.GUI();
        const optionFolder = this.gui.addFolder('options');
        optionFolder.add(this.param, 'play').listen();
        optionFolder.add(this.param, 'drawFps');
    }

}