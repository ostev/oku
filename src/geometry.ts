import * as Three from "three"

export interface IndexedGeometry {
    vertices: number[]
    indices: number[]
}

export const toIndexedGeometry = (
    originalVertices: Float32Array
): IndexedGeometry => {
    const vertices: number[] = []
    const indices: number[] = []

    // const originalVertices = Array.from(geometry.getAttribute("vertex").array)

    for (const vertex of originalVertices) {
        const index = vertices.findIndex((x) => x === vertex)
        if (index === -1) {
            indices.push(vertices.length)
            vertices.push(vertex)
        } else {
            indices.push(index)
        }
    }

    // const newGeometry = geometry.clone()
    // newGeometry.setAttribute("vertex", new Three.BufferAttribute())

    return { vertices: vertices, indices: indices }
}
