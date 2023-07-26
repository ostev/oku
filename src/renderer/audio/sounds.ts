import * as Tone from "tone"

import alertUrl from "./sounds/alert.wav"
import itemHoverUrl from "./sounds/item-hover.wav"
import okayUrl from "./sounds/okay.wav"
import pickUpUrl from "./sounds/pick-up.wav"
import placeDownUrl from "./sounds/place-down.wav"
import concertUrl from "./sounds/concert.wav"
import menuUrl from "./sounds/menu.wav"

export const alert = new Tone.Player(alertUrl).toDestination()

export const itemHover = new Tone.Player(itemHoverUrl).toDestination()
itemHover.loop = true
itemHover.fadeIn = 2
itemHover.fadeOut = 2
itemHover.volume.value = -10

export const okay = new Tone.Player(okayUrl).toDestination()
export const pickUp = new Tone.Player(pickUpUrl).toDestination()
export const placeDown = new Tone.Player(placeDownUrl).toDestination()
export const concert = new Tone.Player(concertUrl).toDestination()
export const menu = new Tone.Player(menuUrl).toDestination()
