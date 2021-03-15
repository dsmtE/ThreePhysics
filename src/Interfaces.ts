
export abstract class Drawable {

    protected color?: number;
    protected geom?: THREE.Geometry | THREE.BufferGeometry;
    protected mat?: THREE.Material;
    protected model?: THREE.Object3D;

    constructor() {}

    abstract updateDraw(): void;
    abstract initDrawable(): void;

    addToscene(scene: THREE.Scene): void {
        scene.add(this.model);
    }
}

export interface Simulated {
    update(h: number): void;
}