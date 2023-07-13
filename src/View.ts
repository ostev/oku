import * as Three from "three"

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
// import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js"
// import { FXAAShader } from "three/addons/shaders/FXAAShader.js"
// import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js"
import { GUI } from "three/addons/libs/lil-gui.module.min.js"

import { OrbitControls } from "three/addons/controls/OrbitControls.js"

import { paintFragment } from "./render/shaders/paint"
import { simpleVertex } from "./render/shaders/simple"
import { Vec3 } from "./World"

export class View {
    camera: Three.OrthographicCamera
    private orthographicScale: number = 0.01

    scene: Three.Scene

    ambientLight = new Three.AmbientLight("#97b49b")
    sun = new Three.DirectionalLight()
    lightHelper: Three.DirectionalLightHelper | undefined

    private width = 0
    private height = 0

    renderer: Three.WebGLRenderer
    // cssRenderer: CSS3DRenderer
    composer: EffectComposer

    // outlinePass: SketchPass
    // ssaoPass: SSAOPass
    // fxaaPass: ShaderPass
    // smaaPass: SMAAPass
    // bloomPass: UnrealBloomPass

    paintMaterial: Three.ShaderMaterial

    orbitControls: OrbitControls

    debug = import.meta.env.DEV

    gui: GUI | undefined

    constructor(element: HTMLElement) {
        this.camera = new Three.OrthographicCamera()
        // this.camera = new Three.PerspectiveCamera()

        this.scene = new Three.Scene()

        // this.player = new Player(new Three.Vector3(0, 0, 0))
        // this.scene.add(this.player.mesh)

        this.sun.color.set("#fffeeb")

        this.sun.position.set(-6, 3, 3)
        this.sun.castShadow = true
        this.sun.shadow.bias = -0.00026
        // const lightHelper = new Three.DirectionalLightHelper(this.sun, 5, "red")

        {
            const size = 10
            this.sun.shadow.camera.left = -size
            this.sun.shadow.camera.right = size
            this.sun.shadow.camera.top = size
            this.sun.shadow.camera.bottom = -size

            const res = 2048
            this.sun.shadow.mapSize.width = res
            this.sun.shadow.mapSize.height = res
        }

        this.scene.add(this.ambientLight)
        this.scene.add(this.sun)
        // this.scene.add(lightHelper)

        if (this.debug) {
            const shadowCameraHelper = new Three.CameraHelper(
                this.sun.shadow.camera
            )
            this.lightHelper = new Three.DirectionalLightHelper(
                this.sun,
                1,
                "red"
            )
            this.scene.add(this.lightHelper)
            this.scene.add(shadowCameraHelper)

            this.gui = new GUI()
            {
                const folder = this.gui.addFolder("Ambient Light")
                folder.addColor(
                    new ColorGUIHelper(this.ambientLight, "color"),
                    "value"
                )
                folder.open()
            }

            const onLightChange = () => {
                this.sun.target.updateMatrixWorld()
                this.lightHelper?.update()
            }

            {
                const folder = this.gui.addFolder("Directional Light")
                folder.addColor(new ColorGUIHelper(this.sun, "color"), "value")
                makeXYZGUI(folder, this.sun.position, "position", onLightChange)
                folder.open()
            }

            {
                const folder = this.gui.addFolder("Directional Light Target")
                makeXYZGUI(
                    folder,
                    this.sun.target.position,
                    "position",
                    onLightChange
                )
                folder.open()
            }
        }

        this.paintMaterial = new Three.ShaderMaterial({
            defines: {
                NUM_OCTAVES: 4,
            },
            uniforms: {
                time: new Three.Uniform(0),
                scale: new Three.Uniform(2),
                speed: new Three.Uniform(0.01),
                baseColor: new Three.Uniform(new Three.Color("#536B78")),
                color1: new Three.Uniform(new Three.Color("#CEE5F2")),
                color2: new Three.Uniform(new Three.Color("#ACCBE1")),
                color3: new Three.Uniform(new Three.Color("#7C98B3")),
                color4: new Three.Uniform(new Three.Color("#637081")),
            },
            vertexShader: simpleVertex,
            fragmentShader: paintFragment,
        })

        // const plane = new Three.Mesh(
        //     new Three.PlaneGeometry(),
        //     this.paintMaterial
        // )
        // this.scene.add(plane)

        this.renderer = new Three.WebGLRenderer({
            powerPreference: "high-performance",
            antialias: true,
            alpha: true,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.toneMapping = Three.ACESFilmicToneMapping
        // this.renderer.setAnimationLoop(this.animation)

        this.composer = new EffectComposer(this.renderer)

        const renderPass = new RenderPass(
            this.scene,
            this.camera,
            undefined,
            new Three.Color("white")
        )
        this.composer.addPass(renderPass)

        // this.bloomPass = new UnrealBloomPass(
        //     new Three.Vector2(this.width, this.height),
        //     1.6,
        //     0.1,
        //     0.8
        // )
        // this.composer.addPass(this.bloomPass)

        // this.outlinePass = new SketchPass(this.scene, this.camera, 1, 1)
        // this.composer.addPass(this.outlinePass)

        // this.ssaoPass = new SSAOPass(
        //     this.scene,
        //     this.camera,
        //     this.width,
        //     this.height
        // )
        // this.ssaoPass.kernelRadius = 4
        // this.ssaoPass.minDistance = 0.005
        // this.ssaoPass.maxDistance = 0.1
        // this.composer.addPass(this.ssaoPass)

        // this.fxaaPass = new ShaderPass(FXAAShader)
        // this.composer.addPass(this.fxaaPass)

        // this.smaaPass = new SMAAPass(this.width, this.height)
        // this.composer.addPass(this.smaaPass)

        // const sphericalTarget = new Three.Spherical(
        //     1,
        //     Math.PI / 2 - Math.atan(-1 / Math.sqrt(2)),
        //     Math.PI / 4
        // )
        // const target = new Three.Vector3().setFromSpherical(sphericalTarget)

        this.orbitControls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        )
        // this.orbitControls.enableDamping = true
        // this.orbitControls.dampingFactor = 0.2
        this.orbitControls.minPolarAngle = -Math.atan(-1 / Math.sqrt(2))
        this.orbitControls.maxPolarAngle = -Math.atan(-1 / Math.sqrt(2))
        this.camera.position.x = -20
        this.camera.position.z = -20
        this.orbitControls.saveState()
        this.orbitControls.update()

        // this.cssRenderer = new CSS3DRenderer({ element })
        // this.cssRenderer.setSize(0, 0)
        // const el = document.createElement("div")
        // // el.setAttribute(
        // //     "style",
        // //     "width: 10px; height: 10px;background-color: 'red';"
        // // )
        // el.textContent = "Hey!"
        // const cssObject = new CSS3DObject(el)
        // cssObject.position.set(0, 10, 0)
        // this.scene.add(cssObject)
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

    destroy = () => {
        this.composer.dispose()
        this.renderer.dispose()
        // this.outlinePass.dispose()
        // this.ssaoPass.dispose()
        // this.smaaPass.dispose()
        this.renderer.domElement.remove()
    }

    setSize = (width: number, height: number) => {
        this.width = width
        this.height = height

        const pixelRatio = window.devicePixelRatio

        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(pixelRatio)

        // this.cssRenderer.setSize(width, height)

        this.composer.setSize(width, height)
        this.composer.setPixelRatio(pixelRatio)

        const halfWidth = (this.orthographicScale * width) / 2
        const halfHeight = (this.orthographicScale * height) / 2

        this.camera.left = -halfWidth
        this.camera.right = halfWidth
        this.camera.top = halfHeight
        this.camera.bottom = -halfHeight

        this.camera.updateProjectionMatrix()

        // this.bloomPass.setSize(width, height)

        // this.outlinePass.setSize(width, height)
        // this.ssaoPass.setSize(width, height)
        // this.fxaaPass.material.uniforms["resolution"].value.x =
        //     1 / (width * pixelRatio)
        // this.fxaaPass.material.uniforms["resolution"].value.y =
        //     1 / (height * pixelRatio)
        // this.smaaPass.setSize(width, height)
    }

    render = (delta: number) => {
        this.paintMaterial.uniforms["time"].value = performance.now() / 1000
        // this.player.mesh.rotation.y = (performance.now() / 1000) * 0.5

        // this.camera.position.setZ(this.camera.position.z + delta * 0.01)
        this.orbitControls.update()
        // $(
        //     "#cameraPos"
        // ).textContent = `${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z}`

        this.composer.render(delta)
        // this.cssRenderer.render(this.scene, this.camera)
    }

    setOrthographicScale = (scale: number) => {
        this.orthographicScale = scale
        this.setSize(this.width, this.height)
    }
}

class ColorGUIHelper {
    object: Three.Object3D
    prop: string

    constructor(object: Three.Object3D, prop: string) {
        this.object = object
        this.prop = prop
    }
    get value() {
        return `#${(this.object as any)[this.prop].getHexString()}`
    }
    set value(hexString) {
        ;(this.object as any)[this.prop].set(hexString)
    }
}

export const makeXYZGUI = (
    gui: GUI,
    vector3: Vec3,
    name: string,
    onChangeFn: Function,
    range?: number
) => {
    const rangeWithDefault = range === undefined ? 100 : range

    const folder = gui.addFolder(name)
    folder
        .add(vector3, "x", -rangeWithDefault, rangeWithDefault)
        .onChange(onChangeFn)
    folder
        .add(vector3, "y", -rangeWithDefault, rangeWithDefault)
        .onChange(onChangeFn)
    folder
        .add(vector3, "z", -rangeWithDefault, rangeWithDefault)
        .onChange(onChangeFn)
    folder.open()
}
