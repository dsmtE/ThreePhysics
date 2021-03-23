import { LineBasicMaterial, BufferGeometry, BufferAttribute, Line, Vector3 } from 'three';

import { Dot } from "./Dot";
import { Drawable, Simulated } from './Interfaces';

export class HookSpring extends Drawable implements Simulated {
    d1: Dot;
    d2: Dot;

    lineBufferPos: Float32Array; 
    stiffness: number; // raideur
    restLength: number; // L0
    
    constructor(d1: Dot, d2: Dot, stiffness: number) {
        super();
        this.d1 = d1;
        this.d2 = d2;

        this.stiffness = stiffness;
        this.restLength = this.d2.pos.clone().sub(this.d1.pos).length();

        this.color = 0xffff00;

        this.initDrawable();
        this.updateDraw();   
    }

    initDrawable() {
        this.mat = new LineBasicMaterial( { color: this.color } );
        // this.geom = new Geometry().setFromPoints([this.d1.pos, this.d2.pos]);

        this.lineBufferPos = new Float32Array(2 * 3);
        this.geom = new BufferGeometry();
        this.geom.addAttribute('position', new BufferAttribute(this.lineBufferPos, 3));

        this.model = new Line(this.geom, this.mat);
    }

    updateDraw() {
        this.d1.pos.toArray(this.lineBufferPos, 0);
        this.d2.pos.toArray(this.lineBufferPos, 3);
        this.model.geometry.attributes.position.needsUpdate = true;
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

export class BrakeSpring extends Drawable implements Simulated {
    d1: Dot;
    d2: Dot;

    lineBufferPos: Float32Array; 
    stiffness: number; // raideur
    viscosity: number;
    restLength: number; // L0
    
    constructor(d1: Dot, d2: Dot, stiffness: number, viscosity: number) {
        super();
        this.d1 = d1;
        this.d2 = d2;

        this.stiffness = stiffness;
        this.viscosity = viscosity;
        this.restLength = this.d2.pos.clone().sub(this.d1.pos).length();

        this.color = 0xffff00;

        this.initDrawable();
        this.updateDraw();   
    }

    initDrawable() {
        this.mat = new LineBasicMaterial( { color: this.color } );
        // this.geom = new Geometry().setFromPoints([this.d1.pos, this.d2.pos]);

        this.lineBufferPos = new Float32Array(2 * 3);
        this.geom = new BufferGeometry();
        this.geom.addAttribute('position', new BufferAttribute(this.lineBufferPos, 3));

        this.model = new Line(this.geom, this.mat);
    }

    updateDraw() {
        this.d1.pos.toArray(this.lineBufferPos, 0);
        this.d2.pos.toArray(this.lineBufferPos, 3);
        this.model.geometry.attributes.position.needsUpdate = true;
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
      return  `stiffness: ${this.stiffness}, viscosity: ${this.viscosity}, restLength: ${this.restLength}`
    }
  }