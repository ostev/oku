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
    RepeatWrapping,
    Scene,
    ShaderMaterial,
    TextureLoader,
    UniformsUtils,
    Vector2,
    WebGLRenderTarget,
    WebGLRenderer
} from "three"
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js"

import { gradientNoise } from "./shaders/noise"
import { simpleVertex } from "./shaders/simple"
import { viewSpacePositionShader } from "./shaders/viewSpacePosition"

import cloudTextureUrl from "./clouds.png?url"
import paperTextureUrl from "./paper2k.png?url"

const decodeDepth = `
float getDepth( const in vec2 screenPosition ) {

    return texture2D( tDepth, screenPosition ).x;

}

float getLinearDepth( const in vec2 screenPosition ) {

    #if PERSPECTIVE_CAMERA == 1

        float fragCoordZ = texture2D( tDepth, screenPosition ).x;
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

    #else

        return texture2D( tDepth, screenPosition ).x;

    #endif

}
`

const sobelOperator = `
    ${gradientNoise}

    float valueAtPoint(sampler2D image, vec2 coord, vec2 texel, vec2 point) {
        vec3 luma = vec3(0.299, 0.587, 0.114);

        return dot(texture2D(image, coord + texel * point).xyz, luma);
    }

    float depthValueAtPoint(vec2 coord, vec2 texel, vec2 point) {
        // vec3 luma = vec3(0.299, 0.587, 0.114);

        // return getLinearDepth(coord + texel * point);
        return getLinearDepth(coord + texel * point) * 20.0;
    }

    float diffuseValue(int x, int y, float noiseValue) {
        return valueAtPoint(tDiffuse, vUv + noiseValue, vec2(1.0 / uResolution.x, 1.0 / uResolution.y), vec2(x, y)) * 2.0;
    }

    float depthValue(int x, int y, float noiseValue) {
        return depthValueAtPoint(
            vUv + noiseValue,
            vec2(1.0 / uResolution.x, 1.0 / uResolution.y),
            vec2(x, y)
        ) * 2.0;
    }

    float normalValue(int x, int y, float noiseValue) {
        return valueAtPoint(
            tNormal,
            vUv + noiseValue,
            vec2(1.0 / uResolution.x, 1.0 / uResolution.y),
            vec2(x, y)
        ) * 0.3;
    }

    float getValue(int x, int y, vec2 uv) {
        // float noiseValue = 5.0 * (noise(gl_FragCoord.xy) * 2.0 - 1.0);
        // float cutoff = 50.0;
        // float offset = 0.3 / cutoff;
        // float cloudNoiseValue = clamp(texture(tClouds, uv * 1.0).r, 0.0, cutoff) / cutoff - offset;

        // return depthValue(x, y) + normalValue(x, y) * noiseValue;
        // return depthValue(x, y);
        return diffuseValue(x, y, 0.0) + depthValue(x, y, 0.0) + normalValue(x, y, 0.0);
        // return depthValue(x,y,0.0);
    }

    float combinedSobelValue(vec2 uv) {
        // kernel definition (in glsl matrices are filled in column-major order)
        const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);// x direction kernel
        const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);// y direction kernel

        // fetch the 3x3 neighbourhood of a fragment

        // first column
        float tx0y0 = getValue(-1, -1, uv);
        float tx0y1 = getValue(-1, 0, uv);
        float tx0y2 = getValue(-1, 1, uv);

        // second column
        float tx1y0 = getValue(0, -1, uv);
        float tx1y1 = getValue(0, 0, uv);
        float tx1y2 = getValue(0, 1, uv);

        // third column
        float tx2y0 = getValue(1, -1, uv);
        float tx2y1 = getValue(1, 0, uv);
        float tx2y2 = getValue(1, 1, uv);

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
    // vertexShader: `
    //     varying vec2 vUv;

    //     void main() {
    //         vec4 worldPos = vec4(uv, 1, 1) * inverse(projectionMatrix * viewMatrix);
    //         vUv = (worldPos / worldPos.w).xy;

    //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //     }
    // `,
    vertexShader: simpleVertex,

    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;
        // uniform sampler2D tClouds;
        // uniform sampler2D tPaper;
        // uniform sampler2D tViewSpacePosition;

        uniform vec2 uResolution;

        uniform mat4 uViewMatrixInverse;
        uniform mat4 uProjectionMatrix;

        varying vec2 vUv;

        ${decodeDepth}

        ${sobelOperator}

        void main() {
            // vec4 viewSpacePosition = texture2D(tViewSpacePosition, vUv);
            // vec4 worldSpacePosition = viewSpacePosition * uViewMatrixInverse;
            // vec2 uv = (viewSpacePosition * uProjectionMatrix).xy;
            vec2 uv = vUv;

            float sobelValue = combinedSobelValue(uv);
            sobelValue = smoothstep(0.01, 0.03, sobelValue);

            vec4 lineColor = vec4(0.32, 0.12, 0.2, 1.0);

            if (sobelValue > 0.1) {
                gl_FragColor = lineColor;
            } else {
                gl_FragColor = vec4(texture2D(tDiffuse, uv).xyz, 1.0);
                if (gl_FragColor == vec4(0.0,0.0,0.0,1.0)) {
                    gl_FragColor = vec4(1.0);
                }
                // gl_FragColor = vec4(1.0);
            }

            // gl_FragColor = vec4((viewSpacePosition.xyz + cameraPosition).x / 1000.0, 0.0, 0.0, 1.0);
            // gl_FragColor = vec4(vec3(pow(getLinearDepth(vUv) * 20.0, 2.0)), 1.0);


            // gl_FragColor = texture2D(tDiffuse, vUv);
            // gl_FragColor = vec4(vUv,0,1);
        }
    `
}

export class SketchPass extends Pass {
    private scene: Scene
    private camera: Camera

    private normalRenderTarget: WebGLRenderTarget
    // private viewSpacePositionRenderTarget: WebGLRenderTarget

    private width: number
    private height: number

    private outlineMaterial: ShaderMaterial
    private normalMaterial: MeshNormalMaterial = new MeshNormalMaterial({
        blending: NoBlending
    })
    // private viewSpacePositionMaterial: ShaderMaterial

    private fullscreenQuad = new FullScreenQuad()

    private loader = new TextureLoader()

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
        // this.viewSpacePositionRenderTarget = new WebGLRenderTarget(
        //     this.width,
        //     this.height,
        //     {
        //         minFilter: NearestFilter,
        //         magFilter: NearestFilter,
        //         type: HalfFloatType,
        //         depthTexture
        //     }
        // )

        // const paperTexture = this.loader.load(paperTextureUrl)
        // paperTexture.wrapS = RepeatWrapping
        // paperTexture.wrapT = RepeatWrapping

        // const cloudNoiseTexture = this.loader.load(cloudTextureUrl)
        // cloudNoiseTexture.wrapS = RepeatWrapping
        // cloudNoiseTexture.wrapT = RepeatWrapping

        this.outlineMaterial = new ShaderMaterial({
            uniforms: {
                // tClouds: { value: cloudNoiseTexture },
                // tPaper: { value: paperTexture },
                tDiffuse: { value: null },
                tNormal: { value: this.normalRenderTarget.texture },
                tDepth: { value: this.normalRenderTarget.depthTexture },
                // tViewSpacePosition: {
                //     value: this.viewSpacePositionRenderTarget.texture
                // },
                uViewMatrixInverse: {
                    value: this.camera.matrixWorld.invert().transpose().invert()
                },
                uProjectionMatrix: { value: this.camera.projectionMatrix },
                uResolution: { value: new Vector2(this.width, this.height) }
            },
            defines: {
                PERSPECTIVE_CAMERA: 0
            },
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        })
        // this.viewSpacePositionMaterial = new ShaderMaterial(
        //     viewSpacePositionShader
        // )

        this.fullscreenQuad.material = this.outlineMaterial
    }

    setSize = (width: number, height: number) => {
        this.width = width
        this.height = height

        this.normalRenderTarget.setSize(this.width, this.height)
        // this.viewSpacePositionRenderTarget.setSize(this.width, this.height)
        this.outlineMaterial.uniforms.uResolution.value = new Vector2(
            this.width,
            this.height
        )

        // this.viewSpacePositionMaterial.uniforms.uViewMatrixInverse = {
        //     value: this.camera.matrixWorld.invert().transpose().invert()
        // }
        // this.viewSpacePositionMaterial.uniforms.uProjectionMatrix = {
        //     value: this.camera.projectionMatrix
        // }
    }

    override render(
        renderer: WebGLRenderer,
        writeBuffer: WebGLRenderTarget,
        readBuffer: WebGLRenderTarget
    ) {
        this.renderOverride(
            renderer,
            this.normalMaterial,
            this.normalRenderTarget
        )
        // this.renderOverride(
        //     renderer,
        //     this.viewSpacePositionMaterial,
        //     this.viewSpacePositionRenderTarget
        // )

        this.outlineMaterial.uniforms["tDiffuse"].value = readBuffer.texture
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
