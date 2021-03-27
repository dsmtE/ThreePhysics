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

    constructor(width: number, height: number, widthSegments: number, heightSegments: number, mass: number, stiffness: number, viscosity: number, physicFps: number) {
        super();
        
        this.enableWind = true;
        this.windAmp = new Vector3(1, 1, 1);
        this.windFreq = new Vector3(1, 1, 1);

        this.enableGravity = true;
        this.gravityStrength = 9.81;

        this.flag = new Flag(width, height, widthSegments, heightSegments, mass, stiffness, viscosity, physicFps);
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

    guiDisplay(guiParent: any, folderName: string = 'scene') {

        const folder = guiParent.addFolder(folderName);
        
        //wind
        const wFolder = folder.addFolder('wind');
        wFolder.add(this, 'enableWind').name('Enable');
        const wFreqFolder = wFolder.addFolder('windFreq');
        ['x', 'y', 'z'].forEach(k => wFreqFolder.add(this.windFreq, k, 0, 10, 0.1));
        const wAmpFolder = wFolder.addFolder('windAmp');
        ['x', 'y', 'z'].forEach(k => wAmpFolder.add(this.windAmp, k, 0, 10, 0.1));
        
        //gravity
        const gFolder = folder.addFolder('gravity'); 
        gFolder.add(this, 'enableGravity').name('Enable');
        gFolder.add(this, 'gravityStrength', 0, 20, 0.01).name('Strength');

        this.flag.guiDisplay(folder);
    }

}
