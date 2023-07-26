import * as Tone from "tone"
import { ToneAudioNode } from "tone"

import alertUrl from "./sounds/alert.wav"
import itemHoverUrl from "./sounds/item-hover.wav"
import okayUrl from "./sounds/okay.wav"
import pickUpUrl from "./sounds/pick-up.wav"
import placeDownUrl from "./sounds/place-down.wav"
import concertUrl from "./sounds/concert.wav"
import menuUrl from "./sounds/menu.wav"
import enterUrl from "./sounds/enter.wav"

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

export enum Sound {
    Menu,
    ItemHover,
    Okay,
    PickUp,
    PlaceDown,
    Concert,
    Alert,
    Enter,
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

    sounds: {
        menu: Tone.Player
        alert: Tone.Player
        itemHover: Tone.Player
        okay: Tone.Player
        pickUp: Tone.Player
        placeDown: Tone.Player
        concert: Tone.Player
        enter: Tone.Player
    }

    private customOnLoad: (sound: Sound) => void

    onLoad = (sound: Sound) => {
        this.customOnLoad(sound)
    }

    private createPlayer = (url: string, name: Sound) =>
        new Tone.Player(url, () => this.onLoad(name)).toDestination()

    constructor(bpm: number, startingKey: Key, onLoad: (sound: Sound) => void) {
        this.bpm = bpm
        this.key = startingKey
        this.customOnLoad = onLoad

        this.sounds = {
            menu: this.createPlayer(menuUrl, Sound.Menu),
            alert: this.createPlayer(alertUrl, Sound.Alert),
            itemHover: this.createPlayer(itemHoverUrl, Sound.ItemHover),
            okay: this.createPlayer(okayUrl, Sound.Okay),
            pickUp: this.createPlayer(pickUpUrl, Sound.PickUp),
            placeDown: this.createPlayer(placeDownUrl, Sound.PlaceDown),
            concert: this.createPlayer(concertUrl, Sound.Concert),
            enter: this.createPlayer(enterUrl, Sound.Enter),
        }

        this.sounds.itemHover.loop = true
        this.sounds.itemHover.fadeIn = 2
        this.sounds.itemHover.fadeOut = 1
        this.sounds.itemHover.volume.value = -10

        this.sounds.menu.fadeIn = 1
        this.sounds.menu.fadeOut = 2

        this.sounds.concert.loop = true
        this.sounds.concert.fadeIn = 0.5
        this.sounds.concert.fadeOut = 2

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
