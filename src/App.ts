import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import dat from 'three/examples/jsm/libs/dat.gui.module.js';

import { SimuScene } from './Interfaces';
import { FlagScene } from './Scenes/Scene';

export default class App {

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;

    cube: THREE.Mesh;

    gui;
    stats;

    param = {
        // playPause: function() { this.param.play = !this.param.play;}.bind(this),
        play: false,
        drawFps: 30,

        physicUpdateFps: 100, // replacement for 1/h : timeStep for simulation update
        integrationType: 'Verlet',
    }
    lastTimeDisplay: number;
    lastTimeUpdate: number;

    // Simulation data
    // dots: (Dot & Drawable)[];
    // constraints: (Simulated & Drawable)[];

    simeScene: SimuScene;

    constructor() {

        // performance monitor
        this.stats = Stats();
        document.body.appendChild(this.stats.dom);

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

        this.simeScene = new FlagScene(13, 10, 50, 50, 1, 0.2, 0.05, this.param.physicUpdateFps);
        this.simeScene.addToscene(this.scene);

        this.lastTimeDisplay = Date.now();
        this.lastTimeUpdate = Date.now();

        this.setupGui();

        setInterval(this.updateLoop.bind(this), 0);
        
        this.displayLoop();
    }

    setupScene() {
        this.scene.background = new THREE.Color(0xe0e0e0);
        this.scene.fog = new THREE.Fog(0xe0e0e0, 30, 150);

        // lights
        this.scene.add(new THREE.AmbientLight(0x222222));

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 50, 50);

        this.scene.add(dirLight);

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

    updateLoop() {
        const now: number = Date.now();
        const elapsedTime = now - this.lastTimeUpdate;

        const deltaTime: number = 1000 / this.param.physicUpdateFps;
        if(elapsedTime > deltaTime) {
            this.lastTimeUpdate = now - (elapsedTime % deltaTime);

            this.stats.begin();
            if (this.param.play) this.simulation(deltaTime/1000);
            this.stats.end();
        }
    }

    displayLoop() {
        const now: number = Date.now();
        const elapsedTime = now - this.lastTimeDisplay;

        const deltaTime: number = 1000 / this.param.drawFps;
        if(elapsedTime > deltaTime) {
            this.lastTimeDisplay = now - (elapsedTime % deltaTime);
            this.renderer.render(this.scene, this.camera);
        }

        //  it will not go higher than the refresh rate
        requestAnimationFrame(this.displayLoop.bind(this));
    }

    // deltaTime in seconds
    simulation(deltaTime: number) {
        this.simeScene.update(deltaTime);
    }


    private setupGui() {
        this.gui = new dat.GUI();
        const optionFolder = this.gui.addFolder('options');
        optionFolder.add(this.param, 'play').listen();
        optionFolder.add(this.param, 'drawFps', 1, 120, 1);
        optionFolder.add(this.param, 'physicUpdateFps', 1, 200, 1).onFinishChange(v => this.simeScene.setPhysicFps(v));
        optionFolder.open();

        this.simeScene.guiDisplay(this.gui);
    }

}