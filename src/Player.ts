import * as Three from "three"
import { createLitMaterial } from "./lighting"
import {
    AudioSource,
    Entity,
    RigidBody,
    Vec3,
    World,
    getComponent,
} from "./World"
import * as Rapier from "@dimforge/rapier3d"

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import okuModelUrl from "./assets/oku.glb?url"

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

export const addPlayer = async (world: World): Promise<Entity> => {
    const characterController = world.physics.createCharacterController(0.001)
    const rigidBody = world.physics.createRigidBody(
        Rapier.RigidBodyDesc.kinematicPositionBased().setAdditionalMass(1)
    )
    const collider = world.physics.createCollider(
        Rapier.ColliderDesc.ball(0.2),
        rigidBody
    )

    const gltfLoader = new GLTFLoader()

    const scene = (await gltfLoader.loadAsync(okuModelUrl)).scene

    scene.traverse((object) => {
        const mesh = object as Three.Mesh
        if (mesh.isMesh) {
            // console.log(mesh.geometry.attributes)
            // mesh.material = new Three.MeshToonMaterial({ color: "#049ef4" })
            mesh.castShadow = true
            mesh.receiveShadow = true
        }
    })

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
            new AudioSource(new Vec3(0, 0, 0)),
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
