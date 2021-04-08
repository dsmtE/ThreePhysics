import { Mesh, Vector3, CylinderGeometry, MeshBasicMaterial} from "three";
import { Flag } from "../Flag";

import { SimuScene } from "../Interfaces";
export class FlagScene extends SimuScene {

    scene : THREE.Scene;
    flag: Flag;

    pole: Mesh;

    enableWind: boolean;
    windAmp: Vector3;
    windFreq: Vector3;

    enableGravity: boolean;
    gravityStrength: number;

    constructor(width: number, height: number, widthSegments: number, heightSegments: number, mass: number, stiffness: number, viscosity: number, physicFps: number, damping: number) {
        super();
        
        this.enableWind = true;
        this.windAmp = new Vector3(3.74, 3.72, 3.75);
        this.windFreq = new Vector3(0.81, 0.98, 1.1);

        this.enableGravity = true;
        this.gravityStrength = 0.32;

        const poleHeightRatio: number = 6/3;

        this.flag = new Flag(new Vector3(0, (poleHeightRatio-1)*height, 0), width, height, widthSegments, heightSegments, mass, stiffness, viscosity, physicFps, damping);

        this.pole = new Mesh(new CylinderGeometry(0.2, 0.2, height*poleHeightRatio, 16), new MeshBasicMaterial({color: 0x000000}));
        this.pole.position.y += (height*poleHeightRatio)/2;
    }

    update(deltaTime: number): void {

        if(this.enableGravity)
            this.flag.applyGravity(this.gravityStrength);

        if(this.enableWind)
            this.flag.addForce(this.computeWind());

        this.flag.update(deltaTime);
    }

    computeWind() : Vector3 {
        const now = Date.now();
        return new Vector3(Math.cos(now * this.windFreq.x), Math.cos(now * this.windFreq.y), Math.cos(now * this.windFreq.z)).multiply(this.windAmp);
    }

    updateDraw(): void { this.flag.updateDraw(); }

    addToscene(scene: THREE.Scene): void {
        this.flag.addToscene(scene);

        if(this.scene == null) {
            this.scene = scene;
            this.scene.add(this.pole);
        }else {
            console.log('already in one scene');
        }
    }

    removeFromScene(): void {
        this.flag.removeFromScene();

        if(this.scene != null) {
            this.scene.remove(this.pole);
            this.scene = null;
        }else {
            console.log('not in any scene currently');
        }
    }

    setPhysicFps(v: number) { this.flag.setPhysicFps(v); }

    guiDisplay(guiParent: any, folderName: string = 'scene') {

        const folder = guiParent.addFolder(folderName);
        folder.open();

        //wind
        const wFolder = folder.addFolder('wind');
        wFolder.open();
        wFolder.add(this, 'enableWind').name('Enable');
        const wFreqFolder = wFolder.addFolder('windFreq');
        ['x', 'y', 'z'].forEach(k => wFreqFolder.add(this.windFreq, k, 0, 10, 0.1));
        const wAmpFolder = wFolder.addFolder('windAmp');
        ['x', 'y', 'z'].forEach(k => wAmpFolder.add(this.windAmp, k, 0, 10, 0.1));
        //gravity
        const gFolder = folder.addFolder('gravity'); 
        gFolder.open();
        gFolder.add(this, 'enableGravity').name('Enable');
        gFolder.add(this, 'gravityStrength', 0, 5, 0.01).name('Strength');

        this.flag.guiDisplay(folder);
    }

}
