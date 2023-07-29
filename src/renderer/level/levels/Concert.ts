import { World } from "../../World"
import { Level } from "../Level"

export class Concert extends Level {
    onRun = (world: World) => {
        world.audioManager.playBackground(world.audioManager.sounds.concert)
    }
    onError = (_error: Error, world: World) => {
        world.audioManager.sounds.concert.stop()
    }
}
