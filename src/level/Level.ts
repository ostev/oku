import * as Three from "three"
import * as Rapier from "@dimforge/rapier3d"

import { Vec3, World, translation } from "../World"

export interface Level {
    css: string
    init: (world: World) => Promise<void>
    step: (delta: number, time: number, world: World) => void
    destroy: (world: World) => void
}

export const addTestCube = (world: World) => {
    const mesh = new Three.Mesh(
        new Three.BoxGeometry(2, 2, 2),
        new Three.MeshStandardMaterial({ color: "white" })
    )
    const rigidBodyDesc = Rapier.RigidBodyDesc.dynamic()
        .setTranslation(0, 5, 0)
        .setAdditionalMass(2)
    const rigidBody = world.physics.createRigidBody(rigidBodyDesc)
    const collider = world.physics.createCollider(
        Rapier.ColliderDesc.cuboid(1, 1, 1),
        rigidBody
    )

    world.addEntity(
        translation(new Vec3(0, 5, 0)),
        new Set([
            { kind: "mesh", mesh },
            { kind: "rigidBody", rigidBody, collider },
        ])
    )
}
