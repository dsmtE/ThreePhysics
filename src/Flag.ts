
import { Vector3, PlaneBufferGeometry, MeshStandardMaterial, DoubleSide, Mesh, BufferGeometry, Geometry, Material, Object3D, Scene, BufferAttribute } from "three";

import { Drawable, Simulated } from './Interfaces';

import { Dot } from './Dot';
import { BrakeSpring } from './Spring';

export class Flag implements Drawable, Simulated {

    geom: PlaneBufferGeometry;
    mesh: Mesh;
    private scene: Scene;

    wireframe: boolean;

    dots: Dot[];
    springs: (BrakeSpring)[];

    stiffness: number;
    viscosity: number;
    mass: number;
    physicFps: number;
    
    constructor(width: number, height: number, widthSegments: number, heightSegments: number, mass: number, stiffness: number, viscosity: number, physicFps: number, wireframe: boolean = true) {
        
        this.mass = mass;
        this.stiffness = stiffness;
        this.viscosity = viscosity;
        this.physicFps = physicFps;

        this.geom = new PlaneBufferGeometry(width, height, widthSegments, heightSegments);
        const mat = new MeshStandardMaterial({ 
            color: 0x0000ff, 
            side: DoubleSide,
            wireframe: wireframe} );

        this.mesh = new Mesh(this.geom, mat);

        this.setupDots();
        this.setupConstraints();
        this.updateDraw();
    }

    private setupDots() {
        this.dots = [];

        const posAttributs = this.geom.getAttribute('position');
        const {widthSegments, heightSegments} = this.geom.parameters;

        for (let h=0; h < heightSegments+1; ++h) {
			for (let w=0; w < widthSegments+1; ++w) {
				const i = w + h * (widthSegments+1);
				const pos = new Vector3(posAttributs.getX(i), posAttributs.getY(i), posAttributs.getZ(i));
                if(i == 0) {
                    this.dots.push(new Dot(this.mass, pos.add(new Vector3(0, 0, 2)), Dot.Type.Fix));
                }else {
                    this.dots.push(new Dot(this.mass, pos));
                }
			}
		}
    }
    private setupConstraints() {
        this.springs = [];

        const {widthSegments, heightSegments} = this.geom.parameters;

        let SFactor: number = this.mass * this.physicFps * this.physicFps;
        let VFactor: number = this.viscosity * this.mass * this.physicFps;

        
        // Structural constraints
        for (let h=0; h < heightSegments+1; ++h) {
			for (let w=0; w < widthSegments+1; ++w) {
                const i = w + h * (widthSegments+1);
                if(w+1 < (widthSegments+1))
                    this.springs.push(new BrakeSpring(this.dots[i], this.dots[i+1], this.stiffness * SFactor, this.viscosity * VFactor));
                if(h+1 < (heightSegments+1))
                    this.springs.push(new BrakeSpring(this.dots[i], this.dots[i+(widthSegments+1)], this.stiffness * SFactor, this.viscosity * VFactor));
            }
        }
        
        SFactor /= 20;
        VFactor /= 20;

        // Shear constraints
        for (let h=0; h < heightSegments; ++h) {
			for (let w=0; w < widthSegments; ++w) {
                const i = w + h * (widthSegments+1);
                this.springs.push(new BrakeSpring(this.dots[i], this.dots[i+1+widthSegments], this.stiffness * SFactor, this.viscosity * VFactor));
                this.springs.push(new BrakeSpring(this.dots[i+1], this.dots[i+widthSegments], this.stiffness * SFactor, this.viscosity * VFactor));
            }
        }

        SFactor /= 40;
        VFactor /= 40;

        // Bend constraints
        for (let h=0; h < heightSegments+1; ++h) {
			for (let w=0; w < widthSegments+1; ++w) {
                const i = w + h * widthSegments;
                if(w+2 < widthSegments)
                    this.springs.push(new BrakeSpring(this.dots[i], this.dots[i+2], this.stiffness * SFactor, this.viscosity * VFactor));
                if(h+2 < widthSegments)
                    this.springs.push(new BrakeSpring(this.dots[i], this.dots[i+ 2*widthSegments], this.stiffness * SFactor, this.viscosity * VFactor));
            }
        }

    }

    update(deltaTime: number): void {
        for (let d of this.dots) d.update(deltaTime);
        for (let s of this.springs) s.update(deltaTime);
        this.updateDraw();
    }

    addForce(f:Vector3) { for (let d of this.dots) d.addForce(f); }

    applyGravity(gravityStrength: number) {
        for (let d of this.dots) d.addForce(new Vector3(0, -1, 0).multiplyScalar(d.mass * gravityStrength));
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

    setWireframe(w: boolean) { this.mesh.material.wireframe = w; }

    setStiffness(s: number) {
        this.stiffness = s;
        const S: number = this.stiffness * this.mass * this.physicFps * this.physicFps;
        this.springs.forEach(s => s.setStiffness(S))
    }

    setViscosity(v: number) {
        this.viscosity = v;
        const V: number = this.viscosity * this.mass * this.physicFps;
        this.springs.forEach(s => s.setViscosity(V));
    }

    setMass(m: number) {
        this.mass = m;
        const S: number = this.stiffness * this.mass * this.physicFps * this.physicFps;
        const V: number = this.viscosity * this.mass * this.physicFps;
        this.dots.forEach(d => d.setMass(m));
        this.springs.forEach(s => s.setStiffness(S));
        this.springs.forEach(s => s.setViscosity(V));
    }

    updateDraw() {
        const posAttributs = this.geom.getAttribute('position');
        this.dots.forEach((d: Dot, i: number) => { 
            posAttributs.setXYZ(i, d.pos.x, d.pos.y, d.pos.z);
        });
        this.geom.attributes.position.needsUpdate = true;
    }

}