import {
    Camera,
    Color,
    DepthStencilFormat,
    DepthTexture,
    HalfFloatType,
    Material,
    MeshNormalMaterial,
    NearestFilter,
    NoBlending,
    Renderer,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    Vector2,
    WebGLRenderTarget,
    WebGLRenderer
} from "three"
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js"

const shader = {
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)
        }
    `,
    fragmentShader: `
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;

        varying vec2 vUv;

        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0)
        }
    `
}

export class OutlinePass extends Pass {
    private scene: Scene
    private camera: Camera

    private normalRenderTarget: WebGLRenderTarget

    private width: number
    private height: number

    private outlineMaterial: ShaderMaterial
    private normalMaterial: MeshNormalMaterial = new MeshNormalMaterial({
        blending: NoBlending
    })

    private fullscreenQuad = new FullScreenQuad()

    constructor(scene: Scene, camera: Camera, width: number, height: number) {
        super()

        this.scene = scene
        this.camera = camera

        this.width = width
        this.height = height

        const depthTexture = new DepthTexture(this.width, this.height)

        this.normalRenderTarget = new WebGLRenderTarget(
            this.width,
            this.height,
            {
                minFilter: NearestFilter,
                magFilter: NearestFilter,
                type: HalfFloatType,
                depthTexture
            }
        )

        this.outlineMaterial = new ShaderMaterial({
            uniforms: {
                tNormal: { value: this.normalRenderTarget.texture },
                tDepth: { value: this.normalRenderTarget.depthTexture }
            }
        })
        this.fullscreenQuad.material = this.outlineMaterial
    }

    setSize = (width: number, height: number) => {
        this.width = width
        this.height = height

        this.normalRenderTarget.setSize(this.width, this.height)
    }

    override render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget) {
        this.renderOverride(
            renderer,
            this.normalMaterial,
            this.normalRenderTarget
        )

        if (this.renderToScreen) {
            renderer.setRenderTarget(null)
        } else {
            renderer.setRenderTarget(writeBuffer)
            if (this.clear) {
                renderer.clear()
            }
        }
        this.fullscreenQuad.render(renderer)
    }

    renderOverride = (
        renderer: WebGLRenderer,
        overrideMaterial: Material,
        renderTarget: WebGLRenderTarget | null
    ) => {
        renderer.setRenderTarget(renderTarget)

        this.scene.overrideMaterial = overrideMaterial
        renderer.render(this.scene, this.camera)
        this.scene.overrideMaterial = null
    }
}
