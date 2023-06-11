import * as Three from "three"

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { FXAAShader } from "three/addons/shaders/FXAAShader.js"

import { Player } from "./Player"
import { OutlinePass } from "./render/OutlinePass"

import paperTextureUrl from "./paper2k.png?url"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"

export class Renderer {
    camera: Three.OrthographicCamera
    orthographicScale: number = 0.005

    scene: Three.Scene
    player: Player

    ambientLight = new Three.AmbientLight()
    sun = new Three.DirectionalLight()

    renderer: Three.WebGLRenderer
    composer: EffectComposer

    outlinePass: OutlinePass
    fxaaPass: ShaderPass

    constructor() {
        this.camera = new Three.OrthographicCamera()
        this.camera.position.z = 1
        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y = Math.PI / 4
        this.camera.rotation.x = Math.atan(-1 / Math.sqrt(2))

        this.scene = new Three.Scene()

        this.player = new Player(new Three.Vector3(0, 0, 0))
        this.scene.add(this.player.mesh)

        this.scene.add(this.ambientLight)
        this.scene.add(this.sun)

        this.renderer = new Three.WebGLRenderer({
            powerPreference: "high-performance"
        })
        // this.renderer.setAnimationLoop(this.animation)

        this.composer = new EffectComposer(this.renderer)

        const renderPass = new RenderPass(
            this.scene,
            this.camera,
            undefined,
            new Three.Color("blue")
        )
        this.composer.addPass(renderPass)

        this.outlinePass = new OutlinePass(this.scene, this.camera, 1, 1)
        this.composer.addPass(this.outlinePass)

        this.fxaaPass = new ShaderPass(FXAAShader)
        // this.composer.addPass(this.fxaaPass)
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
        const pixelRatio = window.devicePixelRatio

        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(pixelRatio)

        this.composer.setSize(width, height)
        this.composer.setPixelRatio(pixelRatio)

        const halfWidth = (this.orthographicScale * width) / 2
        const halfHeight = (this.orthographicScale * height) / 2

        this.camera.left = -halfWidth
        this.camera.right = halfWidth
        this.camera.top = halfHeight
        this.camera.bottom = -halfHeight

        this.camera.updateProjectionMatrix()

        this.outlinePass.setSize(width, height)
        this.fxaaPass.material.uniforms["resolution"].value.x =
            1 / (width * pixelRatio)
        this.fxaaPass.material.uniforms["resolution"].value.y =
            1 / (height * pixelRatio)
    }

    animate = (delta: number) => {
        this.composer.render(delta)

        requestAnimationFrame(this.animate)
    }
}
