import * as Three from "three"
import { createLitMaterial } from "./lighting"
import { Entity, RigidBody, Vec3, World, getComponent } from "./World"
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
    const playerEntity = world.addEntity(
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
                    .setAdditionalMass(4)
                    .setTranslation(0, 2, 0),
                colliderDesc: Rapier.ColliderDesc.cuboid(0.1, 0.1, 0.1)
            }
        ])
    )

    const wheelDesc = Rapier.RigidBodyDesc.dynamic().setAdditionalMass(0.5)
    const wheelRigidBody = world.physics.createRigidBody(wheelDesc)
    const wheelCollider = world.physics.createCollider(
        Rapier.ColliderDesc.ball(0.1),
        wheelRigidBody
    )
    const wheel = world.addEntity(
        { translation: new Vec3(0, 0, 0) },
        new Set([
            {
                kind: "rigidBody",
                rigidBody: wheelRigidBody,
                collider: wheelCollider
            },
            {
                kind: "mesh",
                mesh: new Three.Mesh(
                    new Three.SphereGeometry(0.1),
                    new Three.MeshBasicMaterial({ color: "black" })
                )
            }
        ])
    )

    const playerRigidBody = (
        getComponent(playerEntity, "rigidBody") as RigidBody
    ).rigidBody

    const joint = world.physics.createImpulseJoint(
        Rapier.JointData.revolute(
            { x: 0, y: 0, z: 0 },
            { x: 0.2, y: -0.2, z: 0 },
            { x: 0, y: 1, z: 0 }
        ),
        playerRigidBody,
        wheelRigidBody,
        true
    )
    // ;(joint as Rapier.RevoluteImpulseJoint).configureMotorModel(
    //     Rapier.MotorModel.AccelerationBased
    // )

    world.addComponentToEntity(playerEntity.id, { kind: "joint", joint })

    return playerEntity
    // return wheel
}
