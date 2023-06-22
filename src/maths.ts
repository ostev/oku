import * as Rapier from "@dimforge/rapier3d"

export function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}

export function distance(v1: Rapier.Vector3, v2: Rapier.Vector3): number {
    var dx = v1.x - v2.x
    var dy = v1.y - v2.y
    var dz = v1.z - v2.z

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
