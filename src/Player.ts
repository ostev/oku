import * as Three from "three"
import { createLitMaterial } from "./lighting"
import { Entity, Vec3, World } from "./World"
import * as Rapier from "@dimforge/rapier3d"

// export class Player {
//     position: Three.Vector3
//     readonly mesh: Three.Mesh

//     constructor(position: Three.Vector3) {
//         this.position = position
//         this.mesh = new Three.Mesh(
//             new Three.BoxGeometry(0.2, 0.2, 0.2),
//             // new Three.TorusGeometry(0.2, 0.1),
//             // new Three.SphereGeometry(0.2),
//             new Three.MeshBasicMaterial({ color: "orange" })
//             // new Three.MeshPhysicalMaterial({ color: "orange" })
//         )
//     }
// }

export const addPlayer = (world: World): Entity => {
    return world.addEntity(
        { translation: new Vec3(0, 0, 0) },
        new Set([
            {
                kind: "mesh",
                mesh: new Three.Mesh(
                    new Three.BoxGeometry(0.2, 0.2, 0.2),
                    // new Three.TorusKnotGeometry(0.2, 0.1),
                    new Three.MeshBasicMaterial({ color: "orange" })
                )
            },
            {
                kind: "rigidBodyDesc",
                rigidBodyDesc: Rapier.RigidBodyDesc.dynamic()
                    .setGravityScale(1)
                    .setAdditionalMass(2),
                colliderDesc: Rapier.ColliderDesc.cuboid(0.1, 0.1, 0.1)
            }
        ])
    )
}
