import { simpleVertex } from "./simple"

export const toonShader = {
    vertexShader: simpleVertex,
    fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;

    void main() {

    }
    `
}
