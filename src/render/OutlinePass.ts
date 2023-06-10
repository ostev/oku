import {
    Camera,
    DepthStencilFormat,
    DepthTexture,
    HalfFloatType,
    MeshNormalMaterial,
    NearestFilter,
    NoBlending,
    Renderer,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    Vector2,
    WebGLRenderTarget
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

class OutlinePass extends Pass {
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
    }

    setSize = (width: number, height: number) => {
        this.width = width
        this.height = height
    }

    render(renderer: Renderer, writeBuffer: WebGLRenderTarget) {}
}
