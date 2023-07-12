import * as Three from "three"
import * as Rapier from "@dimforge/rapier3d"

import { Vec3, World, getComponent, translation } from "../../World"
import { Level, addParcel } from "../Level"

import pathUrl from "../../assets/path.gltf?url"

export class DeliveryDriverPartI extends Level {
    css = `
        canvas {
            background-image: linear-gradient(
                45deg,
                hsl(128deg 16% 65%) 0%,
                hsl(157deg 30% 58%) 27%,
                hsl(174deg 51% 47%) 40%,
                hsl(184deg 100% 38%) 50%,
                hsl(193deg 100% 44%) 60%,
                hsl(200deg 100% 49%) 69%,
                hsl(203deg 100% 50%) 77%,
                hsl(207deg 100% 50%) 85%,
                hsl(251deg 100% 71%) 92%,
                hsl(291deg 85% 58%) 100%
            );

        }
    `

    init = async (world: World) => {
        world.view.setOrthographicScale(0.005)

        await world.importGLTF(pathUrl, new Vec3(0.2, -1, -2))

        const parcelPos = new Vec3(0.1, 0, Math.random() * -1.2 - 1)
        addParcel(world, parcelPos)
    }

    step = (delta: number, time: number, world: World) => {}

    destroy = () => {}
}
