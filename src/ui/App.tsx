import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks"

import * as Rapier from "@dimforge/rapier3d"

import { EditorReader, EditorWrapper } from "./EditorWrapper"
import { Vec3, World } from "../World"
import { View } from "../View"
import { RefAccessedBeforeComponentMountedError } from "../helpers"
import { addPlayer } from "../Player"
import { addBox } from "../level"
import { Heading } from "./Heading"
import { Lesson, lessons } from "./Lesson"

import HelloWorld from "../lessons/HelloWorld.mdx"
import { FnBindings } from "../userExecutionContext/bindings"

export const App = () => {
    const viewParentRef: MutableRef<HTMLDivElement | null> = useRef(null)
    const viewRef: MutableRef<View | null> = useRef(null)

    const resizeObserverRef: MutableRef<ResizeObserver | null> = useRef(null)

    const worldRef: MutableRef<World | null> = useRef(null)

    const [linesSaid, setLinesSaid] = useState<string[]>([])

    const bindings: FnBindings = {
        wait: { fn: () => {} },
        say: {
            fn: (text: string) => {
                const utterance = new SpeechSynthesisUtterance(text)
                speechSynthesis.cancel()
                speechSynthesis.speak(utterance)
                setLinesSaid(linesSaid.concat([text]))
            }
        }
    }

    useEffect(() => {
        viewRef.current = new View()
        worldRef.current = new World({ x: 0, y: -9.8, z: 0 }, viewRef.current)

        resizeObserverRef.current = new ResizeObserver(([viewParentEntry]) => {
            viewRef.current?.setSize(
                viewParentEntry.contentRect.width,
                viewParentEntry.contentRect.height
            )
        })
        resizeObserverRef.current.observe(viewParentRef.current as Element)

        addPlayer(worldRef.current)

        addBox(
            worldRef.current,
            { translation: new Vec3(0, -4, 0) },
            { width: 5, height: 5, depth: 5 },
            Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
            "#A7D49B"
        )

        addBox(
            worldRef.current,
            { translation: new Vec3(0, -20, 0) },
            { width: 30, height: 2, depth: 30 },
            Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
            "white"
        )

        addBox(
            worldRef.current,
            { translation: new Vec3(0, -4, 0) },
            { width: 20, height: 2, depth: 20 },
            Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
            "white"
        )

        if (viewParentRef.current !== null) {
            viewRef.current.appendToElement(viewParentRef.current)
        } else {
            throw new RefAccessedBeforeComponentMountedError(
                "View parent ref is null"
            )
        }

        worldRef.current.start()

        return () => {
            worldRef?.current?.destroy()
            resizeObserverRef.current?.unobserve(
                viewParentRef.current as Element
            )
            resizeObserverRef.current?.disconnect()
        }
    }, [])

    const [width, setWidth] = useState(400)

    const [x, setX] = useState(0)

    useEffect(() => console.log("Hi!"), [])

    return (
        <div class="">
            {/* <div class="border-r h-screen p-2"> */}
            <div
                class="h-full absolute top-0 left-0 z-10 m-3 p-5 bg-slate-100 bg-opacity-90 rounded-lg overflow-x-hidden shadow-lg backdrop-blur-lg"
                style={{ width: width }}
            >
                <Lesson bindings={bindings} />
            </div>
            {/* </div> */}
            {/* <div class="border-l h-screen" ref={viewParentRef}></div> */}
            <div
                class="h-full w-full absolute top-0 left-0 z-0"
                ref={viewParentRef}
            ></div>
        </div>
    )
}
