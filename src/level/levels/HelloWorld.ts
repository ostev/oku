import { Vec3, World } from "../../World"
import { Level } from "../Level"

import roadUrl from "../../assets/road.gltf?url"

export class HelloWorld implements Level {
    init = async (world: World) => {
        await world.importGLTF(roadUrl, new Vec3(0, -5, 0))
    }

    step = (delta: number, time: number, world: World) => {}
}
