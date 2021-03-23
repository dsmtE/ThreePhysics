export interface Drawable {
    
    updateDraw(): void;

    addToscene(scene: THREE.Scene): void;
    removeFromScene(): void;
}

export interface Simulated {
    update(deltaTime: number): void;
}