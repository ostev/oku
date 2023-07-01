import { World } from "../World"
import { intersection } from "../setHelpers"

export interface Level {
    init: (world: World) => Promise<void>
    step: (delta: number, time: number, world: World) => void
}
