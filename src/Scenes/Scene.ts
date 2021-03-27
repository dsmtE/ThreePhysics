import { Vector3 } from "three";
import { Flag } from "../Flag";

import { SimuScene } from "../Interfaces";
export class FlagScene extends SimuScene {

    scene : THREE.Scene;
    flag: Flag;

    enableWind: boolean;
    windAmp: Vector3;
    windFreq: Vector3;

    enableGravity: boolean;
    gravityStrength: number;

    flagColor: number;

    constructor(width: number, height: number, widthSegments: number, heightSegments: number, mass: number, stiffness: number, viscosity: number, physicFps: number) {
        super();
        
        this.enableWind = true;
        this.windAmp = new Vector3(1, 1, 1);
        this.windFreq = new Vector3(1, 1, 1);

        this.enableGravity = true;
        this.gravityStrength = 9.81;

        this.flag = new Flag(width, height, widthSegments, heightSegments, mass, stiffness, viscosity, physicFps);

        this.flagColor = this.flag.mesh.material.color.getHex();
    }

    update(deltaTime: number): void {

        if(this.enableGravity)
            this.flag.applyGravity(9.81);

        if(this.enableWind)
            this.flag.addForce(this.computeWind());

        this.flag.update(deltaTime);
    }

    computeWind() : Vector3 {
        const now = Date.now();
        return new Vector3(Math.cos(now * this.windFreq.x), Math.cos(now * this.windFreq.y), Math.cos(now * this.windFreq.z)).multiply(this.windAmp);
    }

    updateDraw(): void { this.flag.updateDraw(); }

    addToscene(scene: THREE.Scene): void { this.flag.addToscene(scene); }

    removeFromScene(): void { this.flag.removeFromScene(); }

    setPhysicFps(f: number) { this.flag.setPhysicFps(f); }

    guiDisplay(guiParent: any) {

        const sceneFolder = guiParent.addFolder('flagScene');

        const matFolder = sceneFolder.addFolder('Flag material');

        matFolder.add(this.flag.mesh.material, 'wireframe');
        matFolder.addColor(this, 'flagColor').onChange(c => this.flag.mesh.material.color.setHex(c) );

        const PhysicFolder = sceneFolder.addFolder('Physic options');

        PhysicFolder.add(this.flag, 'stiffness', 0.001, 1, 0.001).onFinishChange(s => this.flag.setStiffness(s));
        PhysicFolder.add(this.flag, 'viscosity', 0.001, 0.5, 0.001).onFinishChange(v => this.flag.setViscosity(v));

        //wind
        const wFolder = sceneFolder.addFolder('wind');
        wFolder.add(this, 'enableWind').name('Enable');
        const wFreqFolder = wFolder.addFolder('windFreq');
        ['x', 'y', 'z'].forEach(k => wFreqFolder.add(this.windFreq, k, 0, 100, 0.1));
        const wAmpFolder = wFolder.addFolder('windAmp');
        ['x', 'y', 'z'].forEach(k => wAmpFolder.add(this.windAmp, k, 0, 100, 0.1));

        //gravity
        const gFolder = sceneFolder.addFolder('gravity'); 
        gFolder.add(this, 'enableGravity').name('Enable');
        gFolder.add(this, 'gravityStrength', 0, 20, 0.01).name('Strength');
    }

}
