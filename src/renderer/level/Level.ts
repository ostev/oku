import * as Three from "three"
import * as Rapier from "@dimforge/rapier3d"
import parcelUrl from "../assets/crate.gltf?url"

import { Entity, Vec3, World, translation } from "../World"

export class Level {
    css: string = ""
    init: (world: World) => Promise<void> = async () => {}
    step: (delta: number, time: number, world: World) => void = () => {}
    destroy: (world: World) => void = () => {}

    constructor() {}
}

export const addTestCube = (world: World): Entity => {
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

    return world.addEntity(
        translation(new Vec3(0, 5, 0)),
        new Set([
            { kind: "mesh", mesh },
            { kind: "rigidBody", rigidBody, collider },
        ])
    )
}

export const addParcel = async (
    world: World,
    position: Vec3
): Promise<Entity> => {
    // const mesh = new Three.Mesh(
    //     new Three.BoxGeometry(0.4, 0.4, 0.4),
    //     new Three.MeshStandardMaterial({ color: "white" })
    // )
    const entity = (await world.importGLTF(parcelUrl, Vec3.zero))[1]

    const rigidBodyDesc = Rapier.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setAdditionalMass(2)
    const rigidBody = world.physics.createRigidBody(rigidBodyDesc)
    const collider = world.physics.createCollider(
        Rapier.ColliderDesc.cuboid(0.2, 0.2, 0.2),
        rigidBody
    )

    entity.transform.position = position
    world.addComponentToEntity(entity, {
        kind: "rigidBody",
        rigidBody,
        collider,
    })
    world.addComponentToEntity(entity, { kind: "parcel" })

    return entity
}
