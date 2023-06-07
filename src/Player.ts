import * as Three from "three"
import { createLitMaterial } from "./lighting"

export class Player {
    position: Three.Vector3
    readonly mesh: Three.Mesh

    constructor(position: Three.Vector3) {
        this.position = position
        this.mesh = new Three.Mesh(
            new Three.BoxGeometry(0.2, 0.2, 0.2),
            createLitMaterial({
                front: new Three.Color("blue"),
                right: new Three.Color("red"),
                top: new Three.Color("white")
            })
        )
    }
}
