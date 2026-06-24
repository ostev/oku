export const viewSpacePositionShader = {
    vertexShader: `
        varying vec4 viewSpacePosition;

        void main() {
            viewSpacePosition = modelViewMatrix * vec4(position, 1.0);

            gl_Position = projectionMatrix * viewSpacePosition;
        }`,
    fragmentShader: `
        varying vec4 viewSpacePosition;

        void main() {
            gl_FragColor = viewSpacePosition;
        }
    `
}
