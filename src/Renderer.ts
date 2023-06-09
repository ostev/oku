import * as Three from "three"
import { Player } from "./Player"

type RapierModule =
    typeof import("/home/ostev/programming-game/node_modules/@dimforge/rapier3d/rapier")

export class Renderer {
    camera: Three.OrthographicCamera
    scene: Three.Scene
    player: Player
    renderer: Three.WebGLRenderer
    rapier: RapierModule | undefined

    constructor() {
        import("@dimforge/rapier3d").then((rapier) => (this.rapier = rapier))

        this.camera = new Three.OrthographicCamera()
        this.camera.position.z = 1
        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y = Math.PI / 4
        this.camera.rotation.x = Math.atan(-1 / Math.sqrt(2))

        this.scene = new Three.Scene()

        this.player = new Player(new Three.Vector3(0, 0, 0))
        this.scene.add(this.player.mesh)

        this.renderer = new Three.WebGLRenderer({ antialias: true })
        this.renderer.setAnimationLoop(this.animation)
    }

    appendToElement = (element: Element) => {
        element.appendChild(this.renderer.domElement)
    }

    setSize = (width: number, height: number) => {
        this.renderer.setSize(width, height)
    }

    animation = (time: number) => {
        this.renderer.render(this.scene, this.camera)
    }
}
