import { addCharacter } from "../character"
import { Entity, Vec3, World } from "../World"

import peggyModelUrl from "../assets/peggy.gltf?url"

export const addPeggy = async (
    world: World,
    position: Vec3
): Promise<Entity[]> => {
    return await world.importGLTF(peggyModelUrl, position)
}
