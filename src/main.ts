import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"

import { Editor } from "./Editor"
import { addPlayer } from "./Player"
import { View } from "./View"
import { RigidBody, World } from "./World"
import { $ } from "./helpers"

const renderer = new View()

const world = new World({ x: 0.0, y: -9.81, z: 0.0 }, renderer)
const player = addPlayer(world)
world.addEntity(
    new Set([
        {
            kind: "rigidBodyDesc",
            rigidBodyDesc: Rapier.RigidBodyDesc.fixed()
                .setTranslation(0, -1.5, 0)
                .setAdditionalMass(1),
            colliderDesc: Rapier.ColliderDesc.cuboid(0.5, 0.5, 0.5)
        },
        {
            kind: "mesh",
            mesh: new Three.Mesh(
                new Three.BoxGeometry(1, 1, 1),
                new Three.MeshBasicMaterial({ color: "blue" })
            )
        }
    ])
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

world.start()
