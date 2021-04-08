
import { Vector3, BufferGeometry, MeshStandardMaterial, DoubleSide, Mesh, Scene, TextureLoader, RepeatWrapping, ParametricBufferGeometry} from "three";

import { Drawable, Simulated } from './Interfaces';

import { Dot } from './Dot';
import { BrakeSpring } from './Spring';

import blueDenimImg from './assets/blueDenim.png';
import cottonWoolImg from './assets/cottonWool.jpg';
import blueWoolImg from './assets/blueWool.jpg';
import redFabricImg from './assets/redFabric.jpg';
export class Flag implements Drawable, Simulated {

    widthSegments: number;
    heightSegments: number;
    geom: BufferGeometry;
    mesh: Mesh;
    private scene: Scene;

    wireframe: boolean;
    diffuseMaps;
    flagColor: number;

    dots: Dot[];
    structuralSprings: (BrakeSpring)[];
    shearSprings: (BrakeSpring)[];
    bendSprings: (BrakeSpring)[];
    // fixedDotsIndices: number[];

    stiffness: number;
    viscosity: number;
    damping: number;
    mass: number;
    physicFps: number;

    enableShear: boolean;
    ShearRatio: {
        stiffness: number,
        viscosity:number,
    };

    enableBend: boolean;
    BendRatio: {
        stiffness: number,
        viscosity:number,
    };
    
    constructor(pos: Vector3, width: number, height: number, widthSegments: number, heightSegments: number, mass: number, stiffness: number, viscosity: number, physicFps: number, damping: number, wireframe: boolean = true) {
        
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.mass = mass;
        this.stiffness = stiffness;
        this.viscosity = viscosity;
        this.damping = damping;
        this.physicFps = physicFps;

        this.enableShear = true;
        this.ShearRatio = {
            stiffness: 0.2,
            viscosity: 0.02,
        };
        
        this.enableBend = true;
        this.BendRatio = {
            stiffness: 0.2,
            viscosity: 0.02,
        };

        const yPlane = ( width: number, height: number ) => ( u: number, v: number, target: Vector3 ) => target.set(u * width, v * height, 0);

        this.geom = new ParametricBufferGeometry(yPlane(width, height), widthSegments, heightSegments);

        const mat = new MeshStandardMaterial({ 
            color: 0x000000, 
            side: DoubleSide,
            wireframe: wireframe,
            map: null} );
        
        const textureLoader = new TextureLoader();

        this.diffuseMaps = {
            none: null
        }

        const imgs = {
            'blueDenim': blueDenimImg,
            'cottonWool': cottonWoolImg,
            'blueWool': blueWoolImg,
            'redFabric': redFabricImg
        };

        Object.keys(imgs).forEach(k => {
            const texture = textureLoader.load(imgs[k]);
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            this.diffuseMaps[k] = texture;
        });

        this.mesh = new Mesh(this.geom, mat);

        this.mesh.position.copy(pos);

        this.flagColor = this.mesh.material.color.getHex();

        this.updateDots();
        this.updateConstraints();
        this.updateDraw();
    }

    updateDots() {
        this.dots = [];
        // this.fixedDotsIndices = [];

        const posAttributs = this.geom.getAttribute('position');

        for (let h=0; h < this.heightSegments+1; ++h) {
			for (let w=0; w < this.widthSegments+1; ++w) {
				const i = w + h * (this.widthSegments+1);
				const pos = new Vector3(posAttributs.getX(i), posAttributs.getY(i), posAttributs.getZ(i));
                this.dots.push(new Dot(this.massCompute(this.mass, w, h, this.widthSegments, this.heightSegments), pos, w == 0 ? Dot.Type.Fix : Dot.Type.notFix));
			}
		}

        // this.fixedDotsIndices = Array(this.heightSegments+1).fill(0).map((_, i) => i * (this.widthSegments+1));
    }

    private massCompute(mass: number, w: number, h: number, widthSegments:number, heightSegments: number) {
        return mass * (1 - 0.5 * Math.pow(w/widthSegments, 2));
        
    }

    updateConstraints() {
        
        let SFactor: number = this.mass * this.physicFps * this.physicFps;
        let VFactor: number = this.viscosity * this.mass * this.physicFps;
        
        // Structural constraints
        this.structuralSprings = [];
        for (let h=0; h < this.heightSegments+1; ++h) {
			for (let w=0; w < this.widthSegments+1; ++w) {
                const i = w + h * (this.widthSegments+1);
                if(w+1 < (this.widthSegments+1))
                    this.structuralSprings.push(new BrakeSpring(this.dots[i], this.dots[i+1], this.stiffness * SFactor, this.viscosity * VFactor));
                if(h+1 < (this.heightSegments+1))
                    this.structuralSprings.push(new BrakeSpring(this.dots[i], this.dots[i+(this.widthSegments+1)], this.stiffness * SFactor, this.viscosity * VFactor));
            }
        }

        // Shear constraints
        this.shearSprings = [];
        if(this.enableShear) {
            for (let h=0; h < this.heightSegments; ++h) {
                for (let w=0; w < this.widthSegments; ++w) {
                    const i = w + h * (this.widthSegments+1);
                    this.shearSprings.push(new BrakeSpring(this.dots[i], this.dots[i+1+this.widthSegments], 
                        this.stiffness * SFactor * this.ShearRatio.stiffness, this.viscosity * VFactor * this.ShearRatio.viscosity));
                    this.shearSprings.push(new BrakeSpring(this.dots[i+1], this.dots[i+this.widthSegments], 
                        this.stiffness * SFactor * this.ShearRatio.stiffness, this.viscosity * VFactor * this.ShearRatio.viscosity));
                }
            }
        }

        // Bend constraints
        this.bendSprings = [];
        if(this.enableBend) {
            for (let h=0; h < this.heightSegments+1; ++h) {
                for (let w=0; w < this.widthSegments+1; ++w) {
                    const i = w + h * this.widthSegments;
                    if(w+2 < this.widthSegments) {
                        this.bendSprings.push(new BrakeSpring(this.dots[i], this.dots[i+2], 
                            this.stiffness * SFactor * this.BendRatio.stiffness, this.viscosity * VFactor *  this.BendRatio.viscosity));
                        }
                    if(h+2 < this.widthSegments) {
                        this.bendSprings.push(new BrakeSpring(this.dots[i], this.dots[i+ 2*this.widthSegments], 
                            this.stiffness * SFactor * this.BendRatio.stiffness, this.viscosity * VFactor *  this.BendRatio.viscosity));
                        }
                }
            }
        }

    }

    update(deltaTime: number): void {
        
        for (let s of this.structuralSprings) s.update(deltaTime);
        if(this.enableShear) for (let s of this.shearSprings) s.update(deltaTime);
        if(this.enableBend) for (let s of this.bendSprings) s.update(deltaTime);

        // this.fixedDotsIndices.forEach(dotId => { this.dots[dotId].resetForce(); });

        for (let d of this.dots) {
            d.applyDamping(this.damping);
            d.update(deltaTime);
        }


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
        this.updateStiffness();
    }

    updateStiffness() {
        const S: number = this.stiffness * this.mass * this.physicFps * this.physicFps;
        this.structuralSprings.forEach(s => s.setStiffness(S));
        this.shearSprings.forEach(s => s.setStiffness(S * this.ShearRatio.stiffness));
        this.bendSprings.forEach(s => s.setStiffness(S * this.BendRatio.stiffness));
    }

    setViscosity(v: number) {
        this.viscosity = v;
        this.updateViscosity();
    }

    updateViscosity() {
        const V: number = this.viscosity * this.mass * this.physicFps;
        this.structuralSprings.forEach(s => s.setViscosity(V));
        this.shearSprings.forEach(s => s.setViscosity(V * this.ShearRatio.viscosity));
        this.bendSprings.forEach(s => s.setViscosity(V * this.BendRatio.viscosity));
    }

    setMass(m: number) {
        this.mass = m;

        for (let i = 0; i < this.dots.length; ++i) {
            const w = i % (this.widthSegments+1);
            const h = Math.floor( i / (this.widthSegments+1));
            this.dots[i].setMass(this.massCompute(this.mass, w, h, this.widthSegments, this.heightSegments));
        }
        // this.dots.forEach(d => d.setMass(m));

        this.updateStringsProperties();
    }

    setPhysicFps(f: number) {
        this.physicFps = f;
        this.updateStringsProperties();
    }

    updateStringsProperties() {
        // update sifness and viscosity of our strings
        this.updateStiffness();
        this.updateViscosity();
    }

    updateDraw() {
        const posAttributs = this.geom.getAttribute('position');
        this.dots.forEach((d: Dot, i: number) => { 
            posAttributs.setXYZ(i, d.pos.x, d.pos.y, d.pos.z);
        });
        this.geom.attributes.position.needsUpdate = true;
    }


    guiDisplay(guiParent: any, folderName: string = 'flag') {

        const folder = guiParent.addFolder(folderName);
        folder.open();

        const matFolder = folder.addFolder('Material');
        
        matFolder.add(this.mesh.material, 'wireframe');
        matFolder.addColor(this, 'flagColor').onChange(v => this.mesh.material.color.setHex(v) );
        matFolder.add(this.mesh.material, 'map', Object.keys(this.diffuseMaps)).onChange(k => {
            this.mesh.material.map = this.diffuseMaps[k];
            this.mesh.material.needsUpdate = true;
        });

        const PhysicFolder = folder.addFolder('Physic options');
        PhysicFolder.open();

        PhysicFolder.add(this, 'mass', 0.1, 5, 0.01).onFinishChange(v => this.setMass(v));
        PhysicFolder.add(this, 'stiffness', 0.001, 0.5, 0.001).onFinishChange(v => this.setStiffness(v));
        PhysicFolder.add(this, 'viscosity', 0.001, 0.2, 0.001).onFinishChange(v => this.setViscosity(v));
        PhysicFolder.add(this, 'damping', 0.0001, 0.01, 0.0001);

        const shearFolder = PhysicFolder.addFolder('Shear');
        shearFolder.add(this, 'enableShear').name('enable').onFinishChange(_ => this.updateStringsProperties());
        Object.keys(this.ShearRatio).forEach(k => shearFolder.add(this.ShearRatio, k, 0, 1, 0.01).onFinishChange(_ => this.updateStringsProperties()));

        const bendFolder = PhysicFolder.addFolder('bend');
        bendFolder.add(this, 'enableBend').name('enable').onFinishChange(_ => this.updateStringsProperties());
        Object.keys(this.ShearRatio).forEach(k => bendFolder.add(this.ShearRatio, k, 0, 1, 0.01).onFinishChange(_ => this.updateStringsProperties()));
    }

}