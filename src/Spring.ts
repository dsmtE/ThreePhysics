import { LineBasicMaterial, BufferGeometry, BufferAttribute, Line, Vector3, Scene } from 'three';

import { Dot } from "./Dot";
import { Drawable, Simulated } from './Interfaces';


export class HookSpring implements Drawable, Simulated {
    d1: Dot;
    d2: Dot;

    lineBufferPos: Float32Array; 
    stiffness: number; // raideur
    restLength: number; // L0

    line: Line;
    private scene: Scene;
    
    constructor(d1: Dot, d2: Dot, stiffness: number) {
        this.d1 = d1;
        this.d2 = d2;

        this.stiffness = stiffness;
        this.restLength = this.d2.pos.clone().sub(this.d1.pos).length();


        this.lineBufferPos = new Float32Array(2 * 3);
        const mat = new LineBasicMaterial( { color: 0xffff00 } );
        const geom = new BufferGeometry();
        geom.addAttribute('position', new BufferAttribute(this.lineBufferPos, 3));

        this.line = new Line(geom, mat);

        this.updateDraw();   
    }

    addToscene(scene: THREE.Scene): void {
        if(this.scene == null) {
            this.scene = scene;
            this.scene.add(this.line);
        }else {
            console.log('already in one scene');
        }
    }

    removeFromScene(): void {
        if(this.scene != null) {
            this.scene.remove(this.line);
            this.scene = null;
        }else {
            console.log('not in any scene currently');
        }
    }

    updateDraw() {
        this.d1.pos.toArray(this.lineBufferPos, 0);
        this.d2.pos.toArray(this.lineBufferPos, 3);
        this.line.geometry.attributes.position.needsUpdate = true;
    }

    update(deltaTime: number): void {
        const d1Tod2: Vector3 = this.d2.pos.clone().sub(this.d1.pos);

        // stretch is the difference between the current distance and restLength
        const stretch: number =  d1Tod2.length() - this.restLength;
        
        const force: Vector3 = d1Tod2.clone().normalize();
        force.multiplyScalar(-stretch * this.stiffness);
        
        this.d1.force.sub(force); // sub here because direction is from d1 to d2
        this.d2.force.add(force);
        this.updateDraw();
    }
  
    infos(): string {
      return `stiffness: ${this.stiffness}, restLength: ${this.restLength}`
    }
}

export class BrakeSpring extends HookSpring {

    viscosity: number;

    constructor(d1: Dot, d2: Dot, stiffness: number, viscosity: number) {
        super(d1, d2, stiffness);
        this.viscosity = viscosity;
    }

    update(deltaTime: number): void {
        const d1Tod2: Vector3 = this.d2.pos.clone().sub(this.d1.pos);

        // stretch is the difference between the current distance and restLength
        const stretch: number =  d1Tod2.length() - this.restLength;
        
        const force: Vector3 = d1Tod2.clone().normalize();
        force.multiplyScalar(-stretch * this.stiffness);
        
        force.sub(this.d2.velocity.clone().sub(this.d1.velocity).multiplyScalar(this.viscosity));
        this.d1.force.sub(force); // sub here because direction is from d1 to d2
        this.d2.force.add(force);
        this.updateDraw();
    }
  
    infos(): string {
      return  super.infos() + `, viscosity: ${this.viscosity}`
    }
}