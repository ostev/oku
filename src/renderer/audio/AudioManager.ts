import * as Tone from "tone"
import { ToneAudioNode } from "tone"

import * as Sounds from "./sounds"
import { Vec3 } from "../World"

export interface Layer {}

export class Queue {
    nextBar: Tone.Player[] = []
    onStop: Tone.Player[] = []
}

export enum NoteLetter {
    A,
    B,
    C,
    D,
    E,
    F,
    G,
}

export enum NoteAccidental {
    Sharp,
    Flat,
    None,
}

export interface Note {
    letter: NoteLetter
    accidental: NoteAccidental
}

export type Tonality = MajorTonality | MinorTonality

export enum MajorTonality {
    Major,
}
export enum MinorTonality {
    Natural,
    Harmonic,
    Melodic,
}

export interface Key {
    tonic: Note
    tonality: Tonality
}

export class AudioManager {
    queue: Queue = new Queue()

    key: Key

    private playing: Tone.Player[] = []

    private barLoop: Tone.Loop | undefined

    set bpm(tempo: number) {
        Tone.Transport.bpm.value = tempo
    }

    get bpm(): number {
        return Tone.Transport.bpm.value
    }

    set timeSignature(timeSignature: Tone.Unit.TimeSignature) {
        Tone.Transport.timeSignature = timeSignature

        if (this.barLoop !== undefined) {
            this.barLoop.stop()
            this.barLoop.dispose()
        }

        this.connect()
    }

    get timeSignature(): number {
        return Tone.Transport.timeSignature as number
    }

    constructor(bpm: number, startingKey: Key) {
        this.bpm = bpm
        this.key = startingKey

        // this.background.itemHover.loop = true
        // this.background.itemHover.loopStart = 0.3
    }

    connect = () => {
        this.barLoop = new Tone.Loop(() => {
            if (this.queue.onStop.length > 0) {
                const next = this.queue.nextBar[this.queue.nextBar.length - 1]
                if (next !== undefined) {
                    next.start()
                }
            }
        }, this.timeSignature)

        this.barLoop.start()
    }

    playBackground = (player: Tone.Player) => {
        player.start()
        this.playing.push(player)

        player.onstop = () => {
            const index = this.playing.findIndex(
                (otherPlayer) => otherPlayer === player
            )
            this.playing.splice(index)
        }
    }

    play = (player: Tone.Player) => {
        this.playing.push(player)
        player.onstop = () => {
            const index = this.playing.findIndex(
                (otherPlayer) => otherPlayer === player
            )
            this.playing.splice(index)

            if (this.queue.onStop.length > 0) {
                const next = this.queue.onStop[this.queue.onStop.length - 1]

                if (next !== undefined) {
                    this.play(next)
                }
            }
        }
        player.start()
    }

    scheduleNextBar = (player: Tone.Player) => {
        this.queue.nextBar.push(player)
    }

    scheduleOnStop = (player: Tone.Player) => {
        this.queue.onStop.push(player)
    }

    destroy = () => {
        this.barLoop?.stop()
        this.barLoop?.dispose()
        this.barLoop = undefined

        for (const player of this.playing) {
            player.stop()
        }
    }
}
