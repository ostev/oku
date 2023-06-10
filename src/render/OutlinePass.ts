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

const sobelOperator = `
    float valueAtPoint(sampler2D image, vec2 coord, vec2 texel, vec2 point) {
        vec3 luma = vec3(0.299, 0.587, 0.114);

        return dot(texture2D(image, coord + texel * point).xyz, luma);
    }

    float normalValue(int x, int y) {
        return valueAtPoint(
            tNormal,
            vUv,
            vec2(1.0 / uResolution.x, 1.0 / uResolution.y),
            vec2(x, y)
        );
    }

    float getValue(int x, int y) {
        return normalValue(x, y);
    }

    float combinedSobelValue() {
        // kernel definition (in glsl matrices are filled in column-major order)
        const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);// x direction kernel
        const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);// y direction kernel

        // fetch the 3x3 neighbourhood of a fragment

        // first column
        float tx0y0 = getValue(-1, -1);
        float tx0y1 = getValue(-1, 0);
        float tx0y2 = getValue(-1, 1);

        // second column
        float tx1y0 = getValue(0, -1);
        float tx1y1 = getValue(0, 0);
        float tx1y2 = getValue(0, 1);

        // third column
        float tx2y0 = getValue(1, -1);
        float tx2y1 = getValue(1, 0);
        float tx2y2 = getValue(1, 1);

        // gradient value in x direction
        float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
        Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
        Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

        // gradient value in y direction
        float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
        Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
        Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

        // magnitude of the total gradient
        float G = (valueGx * valueGx) + (valueGy * valueGy);
        return clamp(G, 0.0, 1.0);
    }
    `

const shader = {
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;

        uniform vec2 uResolution;

        varying vec2 vUv;

        ${sobelOperator}

        

        void main() {
            float sobelValue = combinedSobelValue();
            sobelValue = smoothstep(0.01, 0.03, sobelValue);

            vec4 lineColor = vec4(0.32, 0.12, 0.2, 1.0);

            if (sobelValue > 0.1) {
                gl_FragColor = lineColor;
            } else {
                gl_FragColor = vec4(1.0);
            }
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
                tDepth: { value: this.normalRenderTarget.depthTexture },
                uResolution: { value: new Vector2(this.width, this.height) }
            },
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        })
        this.fullscreenQuad.material = this.outlineMaterial
    }

    setSize = (width: number, height: number) => {
        this.width = width
        this.height = height

        this.normalRenderTarget.setSize(this.width, this.height)
        this.outlineMaterial.uniforms.uResolution.value = new Vector2(
            this.width,
            this.height
        )
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
