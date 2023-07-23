import * as Tone from "tone"
import { ToneAudioNode } from "tone"

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

    play = (player: Tone.Player) => {
        player.onstop = () => {
            if (this.queue.onStop.length > 0) {
                const next = this.queue.onStop[this.queue.onStop.length - 1]

                if (next !== undefined) {
                    this.play(next)
                }
            }
        }
        console.log("Play")
        player.start()
    }

    scheduleNextBar = (player: Tone.Player) => {
        this.queue.nextBar.push(player)
    }

    scheduleOnStop = (player: Tone.Player) => {
        this.queue.onStop.push(player)
    }
}
