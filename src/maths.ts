import * as Rapier from "@dimforge/rapier3d"
import { Vec3 } from "./World"

export function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}

export function vec3Distance(v1: Vec3, v2: Vec3): number {
    var dx = v1.x - v2.x
    var dy = v1.y - v2.y
    var dz = v1.z - v2.z

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function easeInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

export function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2
}

export function easeOutSine(x: number): number {
    return Math.sin((x * Math.PI) / 2)
}

export const lerp = (x: number, y: number, t: number): number =>
    x * t + y * (1 - t)
