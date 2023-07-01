import { addCharacter } from "../character"
import { Entity, World } from "../World"

import peggyModelUrl from "../assets/peggy.gltf?url"

export const addPeggy = async (world: World): Promise<Entity> => {
    const entity = await addCharacter(world, peggyModelUrl)

    world.addComponentToEntity(entity.id, {
        kind: "listener",
        notify: (event) => {
            if (event.kind === "speaking") {
                console.log(`Heard the following text: ${event.text}`)
            }
        },
    })

    return entity
}
