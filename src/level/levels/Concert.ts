import { World } from "../../World"
import { Level } from "../Level"

export class Concert extends Level {
    private isPlaying = false
    onRun(world: World) {
        world.audioManager.playBackground(world.audioManager.sounds.concert)
        this.isPlaying = true
    }

    stopMusic(world: World) {
        if (this.isPlaying) {
            world.audioManager.sounds.concert.stop()
            this.isPlaying = false
        }
    }

    onError(_error: Error, world: World) {
        this.stopMusic(world)
    }
    onExecutionComplete(world: World) {
        this.stopMusic(world)
    }
    destroy(world: World) {
        this.stopMusic(world)
    }
}
