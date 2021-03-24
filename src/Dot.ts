import { Vector3, SphereGeometry, MeshPhongMaterial, Mesh, BufferGeometry, Geometry, Material, Object3D, Scene } from "three";

import { Drawable, Simulated } from './Interfaces';

export class Dot implements Simulated {

    type?: number;
    mass?: number;
    pos?: Vector3;
    velocity?: Vector3;
    force?: Vector3;

    DotType?: Dot.Type;
    IntegrationType: Dot.IntegrationType;
    
    constructor(mass: number, initPos: Vector3, DotType: Dot.Type = Dot.Type.notFix, IntegrationType: Dot.IntegrationType = Dot.IntegrationType.Verlet) {
        this.mass = mass;
        this.pos = initPos;
        this.velocity = new Vector3();
        this.force =  new Vector3();
        
        this.DotType = DotType;
        this.IntegrationType = IntegrationType;
    }

    addForce(f: Vector3) { this.force.add(f); }

    setMass(m: number) { this.mass = m; }

    update(deltaTime: number): void {
        if(this.DotType == Dot.Type.notFix) {
            switch (this.IntegrationType) {
                case Dot.IntegrationType.Verlet:
                    Dot.updateVerlet(this, deltaTime);
                    break;
                    case Dot.IntegrationType.EulerExp:
                    Dot.updateEulerExp(this, deltaTime);
                    break;
                default:
                    break;
            }
        }
    }
    
    static updateVerlet(obj: Dot, deltaTime: number) {    
        obj.velocity.add(obj.force.clone().multiplyScalar(deltaTime/obj.mass)); // integration vitesse : V(n+1) = V(n) + h * F(n)/m
        obj.pos.add(obj.velocity.clone().multiplyScalar(deltaTime)); // integration position : X(n+1) = X(n) + h * V(n+1)
        obj.force.set(0, 0, 0); // on vide le buffer de force
    }
    
    static updateEulerExp(obj: Dot, deltaTime: number) {
        obj.pos.add(obj.velocity.clone().multiplyScalar(deltaTime));
        obj.velocity.add(obj.force.clone().multiplyScalar(deltaTime/obj.mass));
        obj.force.multiplyScalar(0);
    }
    
    infos(): string {
        return `m: ${this.mass}, pos: ${this.pos}`
    }
}

export class DotDrawable extends Dot implements Drawable {

    mesh: Mesh;

    private scene: Scene;

    radius: number;
    
    constructor(mass: number, initPos: Vector3, color: number = 0x0000ff, DotType: Dot.Type = Dot.Type.notFix) {
        super(mass, initPos, DotType);
        
        const geom = new SphereGeometry( 0.5, 6, 6 );
        const mat = new MeshPhongMaterial( {color: color} );
        this.mesh = new Mesh(geom, mat);
    }
    
    addToscene(scene: THREE.Scene): void {
        if(this.scene == null) {
            this.scene = scene;
            this.scene.add(this.mesh);
        }else {
            console.log('already in one scene');
        }
    }

    removeFromScene(): void {
        if(this.scene != null) {
            this.scene.remove(this.mesh);
            this.scene = null;
        }else {
            console.log('not in any scene currently');
        }
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        this.updateDraw();
    }
    
    updateDraw() { this.mesh.position.copy(this.pos); }
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