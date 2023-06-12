import { Editor } from "./Editor"
import { addPlayer } from "./Player"
import { View } from "./View"
import { World } from "./World"
import { $ } from "./helpers"

const world = new World({ x: 0.0, y: -9.81, z: 0.0 })
addPlayer(world)

const renderer = new View(world)

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
renderer.animate(0)
