import { Editor } from "./Editor"
import { Renderer } from "./Renderer"
import { $ } from "./helpers"

const renderer = new Renderer()

renderer.setSize(window.innerWidth, window.innerHeight)
window.addEventListener("resize", () =>
    renderer.setSize(window.innerWidth, window.innerHeight)
)
renderer.appendToElement($("#renderer") as Element)

const editor = new Editor($("#editor") as Element)

;($("#run") as HTMLButtonElement).addEventListener("click", (e) => {
    console.log(`Running ${editor.script}`)
    editor.run()
})
