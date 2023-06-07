import { Editor } from "./Editor"
import { Renderer } from "./Renderer"
import { $ } from "./helpers"
import { createLitMaterial } from "./lighting"
import { degToRad } from "./maths"
import * as Three from "three"

const renderer = new Renderer()

renderer.setSize(window.innerWidth, window.innerHeight)
window.addEventListener("resize", () =>
    renderer.setSize(window.innerWidth, window.innerHeight)
)
renderer.appendToElement($("#renderer"))

const editor = new Editor($("#editor"))
