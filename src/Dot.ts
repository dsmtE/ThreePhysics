// import {Color, Vector3} from 'three';

import { Vector3, SphereGeometry, MeshPhongMaterial, Mesh } from "three";

import { Drawable, Simulated } from './Interfaces';

export class Dot extends Drawable {

    type?: number;
    masse?: number;
    pos?: Vector3;
    vit?: Vector3;
    force?: Vector3;

    DotType?: Dot.Type;
    
    radius: number;
    
    constructor(masse: number, initPos: Vector3, color: number = 0x0000ff, DotType: Dot.Type = Dot.Type.notFix) {
        super();
        this.masse = masse;
        this.pos = initPos;
        this.vit = new Vector3();
        this.force =  new Vector3();
        
        this.color = color;
        this.radius = 0.5;
    
        this.DotType = DotType;
        
        this.initDrawable();
    }

    update(h: number, type: Dot.IntegrationType = Dot.IntegrationType.Verlet): void {
        if(this.DotType == Dot.Type.notFix) {
            switch (type) {
                case Dot.IntegrationType.Verlet:
                    Dot.updateVerlet(this, h);
                    break;
                    case Dot.IntegrationType.EulerExp:
                    Dot.updateEulerExp(this, h);
                    break;
                default:
                    break;
            }
        }
            this.updateDraw();
        }
    
    initDrawable() {
        this.geom = new SphereGeometry( this.radius, 6, 6 );
        this.mat = new MeshPhongMaterial( {color: this.color} );
        this.model = new Mesh(this.geom, this.mat);
    }
    
    updateDraw() {
        this.model.position.copy(this.pos);
    }
    
    static updateVerlet(obj: Dot, h: number) {
        obj.vit.add(obj.force.clone().multiplyScalar(h/obj.masse)); // integration vitesse : V(n+1) = V(n) + h * F(n)/m
        obj.pos.add(obj.vit.clone().multiplyScalar(h)); // integration position : X(n+1) = X(n) + h * V(n+1)
        obj.force.set(0, 0, 0); // on vide le buffer de force
    }
    
    static updateEulerExp(obj: Dot, h: number) {
        obj.pos.add(obj.vit.clone().multiplyScalar(h));
        obj.vit.add(obj.force.clone().multiplyScalar(h/obj.masse));
        obj.force.multiplyScalar(0);
    }
    
    infos(): string {
        return `m: ${this.masse}, pos: ${this.pos}`
    }
}

export namespace Dot {
    export enum Type {
        Fix,
        notFix
    };

    export enum IntegrationType {
        Verlet,
        EulerExp
    };
}