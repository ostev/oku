import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"

import { Editor } from "./Editor"
import { addPlayer } from "./Player"
import { View } from "./View"
import { RigidBody, Vec3, World } from "./World"
import { $ } from "./helpers"
import { addBox } from "./level"

const renderer = new View()

const world = new World({ x: 0.0, y: -9.81, z: 0.0 }, renderer)
// const player = addPlayer(world)
// world.addEntity(
//     new Set([
//         {
//             kind: "rigidBodyDesc",
//             rigidBodyDesc: Rapier.RigidBodyDesc.fixed()
//                 .setTranslation(0, -1.5, 0)
//                 .setAdditionalMass(1),
//             colliderDesc: Rapier.ColliderDesc.cuboid(0.5, 0.5, 0.5)
//         },
//         {
//             kind: "mesh",
//             mesh: new Three.Mesh(
//                 new Three.BoxGeometry(1, 1, 1),
//                 new Three.MeshBasicMaterial({ color: "blue" })
//             )
//         },
//     ])
// )

addBox(
    world,
    { translation: new Vec3(0, -4, 0) },
    { width: 5, height: 5, depth: 5 },
    Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
    "purple"
)

addBox(
    world,
    { translation: new Vec3(0, -20, 0) },
    { width: 30, height: 2, depth: 30 },
    Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
    "green"
)

addBox(
    world,
    { translation: new Vec3(0, -4, 0) },
    { width: 20, height: 2, depth: 20 },
    Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
    "red"
)

renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.load()
window.addEventListener("resize", () =>
    renderer.setSize(window.innerWidth, window.innerHeight)
)
renderer.appendToElement($("#renderer"))

const editor = new Editor($("#editor"), $("#executionContext"), world)

;($("#run") as HTMLButtonElement).addEventListener("click", (e) => {
    console.log(`Running ${editor.script}`)
    editor.run()
})

// console.log(
//     diff(
//         [
//             { kind: "block", dimensions: new Dimensions(3, 3) },
//             { kind: "block", dimensions: new Dimensions(3, 3) }
//         ],
//         [
//             { kind: "block", dimensions: new Dimensions(2, 2) },
//             { kind: "block", dimensions: new Dimensions(3, 3) },
//             { kind: "container", children: [] }
//         ]
//     )
// )

world.start()
