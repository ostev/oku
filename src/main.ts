import { createLitMaterial } from "./lighting"
import { degToRad } from "./maths"
import * as Three from "three"

// init

const camera = new Three.OrthographicCamera()
camera.position.z = 1
camera.rotation.order = "YXZ"
camera.rotation.y = Math.PI / 4
camera.rotation.x = Math.atan(-1 / Math.sqrt(2))

const scene = new Three.Scene()

const geometry = new Three.BoxGeometry(0.2, 0.2, 0.2)
const material = createLitMaterial({
    front: new Three.Color("blue"),
    right: new Three.Color("red"),
    top: new Three.Color("white")
})

const mesh = new Three.Mesh(geometry, material)
scene.add(mesh)

const axesHelper = new Three.AxesHelper(5)
scene.add(axesHelper)

scene.add(new Three.AmbientLight("grey"))
const light = new Three.DirectionalLight("white", 1.0)
light.position.set(1, 1, 1).normalize()
// light.target = mesh
// scene.add(light.target)
scene.add(light)

const renderer = new Three.WebGLRenderer({ antialias: true })

const setSize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
}

setSize()

window.addEventListener("resize", setSize)
renderer.setAnimationLoop(animation)
document.body.appendChild(renderer.domElement)

// animation

function animation(time: number) {
    // mesh.rotation.x = time / 2000
    // mesh.rotation.y = time / 1000
    // light.rotation.y = time / 1000
    // camera.rotation.x = time / 2000

    renderer.render(scene, camera)
}
