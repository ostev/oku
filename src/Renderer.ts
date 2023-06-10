import * as Three from "three"
import { Player } from "./Player"

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"

import paperTextureUrl from "./paper2k.png?url"

type RapierModule =
    typeof import("/home/ostev/programming-game/node_modules/@dimforge/rapier3d/rapier")

export class Renderer {
    camera: Three.OrthographicCamera
    orthographicScale: number = 0.005

    scene: Three.Scene
    player: Player
    renderer: Three.WebGLRenderer
    composer: EffectComposer

    constructor() {
        this.camera = new Three.OrthographicCamera()
        this.camera.position.z = 1
        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y = Math.PI / 4
        this.camera.rotation.x = Math.atan(-1 / Math.sqrt(2))

        this.scene = new Three.Scene()

        this.player = new Player(new Three.Vector3(0, 0, 0))
        this.scene.add(this.player.mesh)

        this.renderer = new Three.WebGLRenderer({
            powerPreference: "high-performance",
            antialias: true
        })
        // this.renderer.setAnimationLoop(this.animation)

        this.composer = new EffectComposer(this.renderer)
        const renderPass = new RenderPass(
            this.scene,
            this.camera,
            undefined,
            new Three.Color("white")
        )
        this.composer.addPass(renderPass)
    }

    // load = async () => {
    //     this.cubeTextureLoader
    //         .loadAsync([paperTextureUrl])
    //         .then((bgTexture) => {
    //             this.bgTexture = bgTexture
    //             this.scene.background = this.bgTexture
    //         })
    // }

    appendToElement = (element: Element) => {
        element.appendChild(this.renderer.domElement)
    }

    setSize = (width: number, height: number) => {
        const halfWidth = (this.orthographicScale * width) / 2
        const halfHeight = (this.orthographicScale * height) / 2

        this.camera.left = -halfWidth
        this.camera.right = halfWidth
        this.camera.top = halfHeight
        this.camera.bottom = -halfHeight

        this.camera.updateProjectionMatrix()

        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(window.devicePixelRatio)
    }

    animate = (delta: number) => {
        this.composer.render(delta)

        requestAnimationFrame(this.animate)
    }
}
