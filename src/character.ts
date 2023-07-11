import * as Three from "three"
import { createLitMaterial } from "./lighting"
import {
    EventSource,
    Entity,
    RigidBody,
    Vec3,
    World,
    getComponent,
} from "./World"
import * as Rapier from "@dimforge/rapier3d"

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

export const addCharacter = async (
    world: World,
    url: string
): Promise<Entity> => {
    const characterController = world.physics.createCharacterController(0.0001)
    const rigidBody = world.physics.createRigidBody(
        Rapier.RigidBodyDesc.kinematicPositionBased().setAdditionalMass(1)
    )

    const gltfLoader = new GLTFLoader()

    const scene = (await gltfLoader.loadAsync(url)).scene

    const meshes: Three.Mesh[] = []

    scene.traverse((object) => {
        const mesh = object as Three.Mesh
        if (mesh.isMesh) {
            // console.log(mesh.geometry.attributes)
            // mesh.material = new Three.MeshToonMaterial({ color: "#049ef4" })
            meshes.push(mesh)
        }
    })

    const vertexArrays: Float32Array[] = []

    for (const mesh of meshes) {
        mesh.receiveShadow = true
        mesh.castShadow = true
        vertexArrays.push(
            new Float32Array(mesh.geometry.getAttribute("position").array)
        )
    }

    const vertices = new Float32Array(
        vertexArrays.reduce(
            (totalLength, array) => totalLength + array.length,
            0
        )
    )

    for (let j = 0; j < vertexArrays.length; j++) {
        const array = vertexArrays[j]
        for (let k = 0; k < array.length; k++) {
            vertices[j * k] = array[k]
        }
    }

    const collider = world.physics.createCollider(
        Rapier.ColliderDesc.convexHull(vertices) as Rapier.ColliderDesc,
        rigidBody
    )

    const playerEntity = world.addEntity(
        {
            position: new Vec3(0, 0, 0),
            rotation: new Three.Quaternion(),
            scale: new Vec3(1, 1, 1),
        },
        new Set([
            {
                kind: "mesh",
                mesh: scene,
                // new Three.TorusKnotGeometry(0.2, 0.1),
                //     new Three.MeshBasicMaterial({ color: "orange" })
                // )
            },
            {
                kind: "characterController",
                characterController,
            },
            { kind: "rigidBody", rigidBody, collider },
            { kind: "player" },
            new EventSource(new Vec3(0, 0, 0)),
        ])
    )

    // const wheelDesc = Rapier.RigidBodyDesc.dynamic().setAdditionalMass(0.5)
    // const wheelRigidBody = world.physics.createRigidBody(wheelDesc)
    // const wheelCollider = world.physics.createCollider(
    //     Rapier.ColliderDesc.ball(0.1),
    //     wheelRigidBody
    // )
    // const wheel = world.addEntity(
    //     { translation: new Vec3(0, 0, 0) },
    //     new Set([
    //         {
    //             kind: "rigidBody",
    //             rigidBody: wheelRigidBody,
    //             collider: wheelCollider
    //         },
    //         {
    //             kind: "mesh",
    //             mesh: new Three.Mesh(
    //                 new Three.SphereGeometry(0.1),
    //                 new Three.MeshBasicMaterial({ color: "black" })
    //             )
    //         }
    //     ])
    // )

    // const playerRigidBody = (
    //     getComponent(playerEntity, "rigidBody") as RigidBody
    // ).rigidBody

    // const joint = world.physics.createImpulseJoint(
    //     Rapier.JointData.revolute(
    //         { x: 0, y: 0, z: 0 },
    //         { x: 0.2, y: -0.2, z: 0 },
    //         { x: 0, y: 1, z: 0 }
    //     ),
    //     playerRigidBody,
    //     wheelRigidBody,
    //     true
    // )
    // // ;(joint as Rapier.RevoluteImpulseJoint).configureMotorModel(
    // //     Rapier.MotorModel.AccelerationBased
    // // )

    // world.addComponentToEntity(playerEntity.id, { kind: "joint", joint })

    return playerEntity
    // return wheel
}
