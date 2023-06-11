import * as Three from "three"
import { createLitMaterial } from "./lighting"

export class Player {
    position: Three.Vector3
    readonly mesh: Three.Mesh

    constructor(position: Three.Vector3) {
        this.position = position
        this.mesh = new Three.Mesh(
            new Three.BoxGeometry(0.2, 0.2, 0.2),
            // new Three.TorusGeometry(0.2, 0.1),
            // new Three.SphereGeometry(0.2),
            // new Three.MeshBasicMaterial({ color: "#F9FBFF" })
            new Three.MeshPhysicalMaterial({ color: "orange" })
        )
    }
}
