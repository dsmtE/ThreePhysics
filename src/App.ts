import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import dat from 'three/examples/jsm/libs/dat.gui.module.js';

// Phisics class
import { Dot } from './Dot';
import { Spring } from './Spring';
import { Drawable, Simulated } from './Interfaces';
import { Vector3 } from 'three';

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
        play: false,
        drawFps: 60,

        physicUpdateFps: 100, // replacement for 1/h : timeStep for simulation update
        integrationType: 'Verlet',
        enableWind: true,
        windDir: new Vector3(0),
        windStrength: 10,
    }

    lastTimeDisplay: number;
    lastTimeUpdate: number;

    // Simulation data
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
        this.simulation(0); // used to display and update objects properly once setup done

        for (let d of this.dots) d.addToscene(this.scene);
        for (let c of this.constraints) c.addToscene(this.scene);

        this.lastTimeDisplay = Date.now();
        this.lastTimeUpdate = Date.now();

        setInterval(this.updateLoop.bind(this), 0);
        
        this.displayLoop();
    }

    setupPhysics() {

        this.dots = [];
        this.constraints = [];
        this.param.windDir = new Vector3(1, 0, 0);
        this.param.windStrength = 10;
        
        const size: number = 10;
        for (let i = 0; i < size; ++i)
            this.dots.push(new Dot(1, new THREE.Vector3((-size/2+i)*5, 1, 0), 0x0000ff, (i == 0 || i == size-1) ? Dot.Type.Fix : Dot.Type.notFix));

        for (let i = 0; i < size-1; ++i)
            this.constraints.push(new Spring(this.dots[i], this.dots[i+1], 50));

        // initial conditions
        this.dots[Math.ceil(size/2)].pos.y -= 2;
        // for (let i = 0; i < size; ++i)
        //     this.dots[i].pos.y -= (size-Math.abs(size/2-i));
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

        if (this.param.enableWind) {
            for (let d of this.dots)
                d.addForce(this.param.windDir.clone().normalize().multiplyScalar(this.param.windStrength * deltaTime));
        }

        for (let d of this.dots)
            d.update(deltaTime, this.param.integrationType == 'Verlet' ? Dot.IntegrationType.Verlet : Dot.IntegrationType.EulerExp);

        for (let c of this.constraints)
            c.update(deltaTime);
    }

    private setupGui() {
        this.gui = new dat.GUI();
        const optionFolder = this.gui.addFolder('options');
        optionFolder.add(this.param, 'play').listen();
        optionFolder.add(this.param, 'drawFps', 1, 120, 1);
        optionFolder.open();

        const PhysicFolder = this.gui.addFolder('physic options');
        PhysicFolder.add(this.param, 'physicUpdateFps', 1, 250, 1);
        PhysicFolder.add(this.param, 'integrationType', ["Verlet", "EulerExp"]);
        const wFolder = this.gui.addFolder('windDir');
        wFolder.add(this.param.windDir, 'x');
        wFolder.add(this.param.windDir, 'y');
        wFolder.add(this.param.windDir, 'z');
        PhysicFolder.add(this.param, 'windStrength');
        PhysicFolder.open();
    }

}