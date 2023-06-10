import { Editor } from "./Editor"
import { Renderer } from "./Renderer"
import { $ } from "./helpers"

const renderer = new Renderer()

renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.load()
window.addEventListener("resize", () =>
    renderer.setSize(window.innerWidth, window.innerHeight)
)
renderer.appendToElement($("#renderer"))

const editor = new Editor($("#editor"), $("#executionContext"))

;($("#run") as HTMLButtonElement).addEventListener("click", (e) => {
    console.log(`Running ${editor.script}`)
    editor.run()
})
renderer.animate(0)
