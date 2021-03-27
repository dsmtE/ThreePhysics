export interface Drawable {
    updateDraw(): void;

    addToscene(scene: THREE.Scene): void;
    removeFromScene(): void;
}

export interface Simulated {
    update(deltaTime: number): void;
}

export abstract class SimuScene implements Drawable, Simulated {

    abstract update(deltaTime: number): void;

    abstract updateDraw(): void;

    abstract addToscene(scene: THREE.Scene): void;

    abstract removeFromScene(): void;

    setPhysicFps(f: number) { }

    guiDisplay(guiParent: any) { }
}
