import { fbm, gradientNoise } from "./noise"

const cosInterpolate = `
    float cosInterpolate(float a, float b, float x) {
        float f = (1.0 - cos(x * 3.1415927)) * 0.5;
        return a*(1.0-f) + b*f;
    }
    `

const random = `
    float random(vec2 xy, float seed) {
        return fract(sin(dot(xy, vec2(12.9898-seed, 78.233+seed)))* (43758.5453+seed));
    }
    `

export const paint = `
    float paint(in vec2 p, in float time, out vec2 q, out vec2 r ) {
        q.x = fbm(p + vec2(0.0,0.0), 1.0);
        q.y = fbm(p + vec2(5.2,1.3), 1.0);

        r.x = fbm(p + 4.0*q + vec2(1.7,9.2) * time, 1.0);
        r.y = fbm(p + 4.0*q + vec2(8.3,2.8), 1.0);

        return fbm(p + 4.0*r, 1.0);
    }
`

export const paintFragment = `
    varying vec2 vUv;

    uniform float time;
    uniform float scale;
    uniform float speed;
    
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;

    ${gradientNoise}
    ${fbm}
    ${paint}

    void main() {
        vec2 q, r;

        float paint = paint(vUv * scale, time * speed, q, r);
        gl_FragColor = vec4(mix(color1, color2, r.x + 0.2), 1.0);
    }
`
