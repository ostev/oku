import { Color, ShaderMaterial, Uniform, Vector3 } from "three"

export interface LightingInfo {
    top: Color
    front: Color
    right: Color
}

export const litVertex = `
    varying vec3 worldNormal; 

    void main() {
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      worldNormal = normal;
      gl_Position = projectionMatrix * modelViewPosition; 
    }
`

export const litFragment = `
    varying vec3 worldNormal;

    uniform vec3 top;
    uniform vec3 front;
    uniform vec3 right;

    const vec3 UP = vec3(0.0, 1.0, 0.0);
    const vec3 RIGHT = vec3(1.0, 0.0, 0.0);
    const vec3 FORWARD = vec3(0.0, 0.0, 1.0);

    void main() {
        vec3 lightingTint = right * max(0.0, dot(worldNormal, RIGHT));
        lightingTint += top * max(0.0, dot(worldNormal, UP));
        lightingTint += front * max(0.0, dot(worldNormal, FORWARD));

        gl_FragColor.rgb = lightingTint;
        gl_FragColor.a = 1.0;
    }
`

export function createLitMaterial(info: LightingInfo): ShaderMaterial {
    return new ShaderMaterial({
        uniforms: {
            top: new Uniform(info.top),
            front: new Uniform(info.front),
            right: new Uniform(info.right)
        },
        vertexShader: litVertex,
        fragmentShader: litFragment
    })
}
