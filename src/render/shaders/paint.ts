import { hsvConversion, hsvMix } from "./color"
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
        p += 0.05*sin(vec2(0.11,0.13)*time + length( p )*4.0);
    
        p *= 0.7 + 0.2*cos(0.05*time);

        q.x = fbm(p + vec2(1.0,3.0) * sin(time), 1.0);
        q.y = fbm(p + vec2(5.2,1.3) * time, 1.0);

        q += 0.2;

        r.x = fbm(p + 4.0*q + vec2(1.7,9.2) * time, 1.0);
        r.y = fbm(p + 4.0*q + vec2(8.3,2.8) * time, 1.0);

        r += sin(0.2 * q.y) * 2.0;
        r.y += length(q) * 0.5;
        r.x += sin(time);

        return fbm(p + 4.0*r, 1.0);
    }
`

export const paintFragment = `
    varying vec2 vUv;

    uniform float time;
    uniform float scale;
    uniform float speed;
    
    uniform vec3 baseColor;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;

    ${hsvConversion}
    ${hsvMix}
    ${gradientNoise}
    ${fbm}
    ${paint}

    void main() {
        vec2 q, r;

        float base = paint(vUv * scale, time * speed, q, r);
        gl_FragColor = vec4(baseColor * base + color1 * q.x + color2 * q.y + color3 * r.x + color4 * r.y, 1.0);
        // gl_FragColor = vec4(color1, 1.0);

        if (step(0.0, gl_FragColor.xyz) == vec3(0.0)) {
            gl_FragColor = vec4(vec3(0.0), 1.0);
        }
    }
`
