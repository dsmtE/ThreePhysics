export abstract class Drawable {

    protected color?: number;
    protected geom?: THREE.Geometry | THREE.BufferGeometry;
    protected mat?: THREE.Material;
    protected model?: THREE.Object3D;

    private scene: THREE.Scene;

    constructor() {}

    abstract updateDraw(): void;
    abstract initDrawable(): void;

    addToscene(scene: THREE.Scene): void {
        if(this.scene == null) {
            this.scene = scene;
            this.scene.add(this.model);
        }else {
            console.log('already in one scene');
        }
    }

    removeFromScene(): void {
        if(this.scene != null) {
            this.scene.remove(this.model);
            this.scene = null;
        }else {
            console.log('not in any scene currently');
        }
    }
}

export interface Simulated {
    update(h: number): void;
}