import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks"

import {
    AudioSource,
    Entity,
    NoIndicesFoundOnGeometryError,
    Vec3,
    World,
    getComponent,
    translation,
} from "../World"
import { View } from "../View"
import { RefAccessedBeforeComponentMountedError } from "../helpers"
import { addPlayer } from "../Player"
import { addBox } from "../level"
// import { Heading } from "./Heading"
import { Lesson, LessonInfo } from "./Lesson"

import * as HelloWorld from "../lessons/HelloWorld.mdx"

import { FnBindings } from "../userExecutionContext/bindings"

import roadSceneUrl from "../assets/road.gltf?url"
import { Level } from "../level/Level"
import { UserExecutionContext } from "../userExecutionContext/UserExecutionContext"

export const App = () => {
    const viewParentRef: MutableRef<HTMLDivElement | null> = useRef(null)
    const viewRef: MutableRef<View | null> = useRef(null)

    const resizeObserverRef: MutableRef<ResizeObserver | null> = useRef(null)

    const worldRef: MutableRef<World | null> = useRef(null)
    const levelRef: MutableRef<Level | null> = useRef(null)
    const playerRef: MutableRef<Entity | null> = useRef(null)

    // const [linesSaid, setLinesSaid] = useState<string[]>([])
    const [levelCss, setLevelCss] = useState("")

    const bindings: FnBindings = {
        wait: { fn: () => {} },
        say: {
            fn: (context: UserExecutionContext, text: string) => {
                const utterance = new SpeechSynthesisUtterance(text)
                speechSynthesis.cancel()
                speechSynthesis.speak(utterance)

                if (playerRef.current !== null && worldRef.current !== null) {
                    console.log("Send out audio event")
                    worldRef.current.activateAudioEvent({
                        kind: "speaking",
                        source: getComponent(
                            playerRef.current,
                            "audioSource"
                        ) as AudioSource,
                        text,
                    })
                }
            },
        },
        forward: {
            fn: (context: UserExecutionContext, distance: number) => {
                console.log(`Move forward ${distance}`)
                context.resume()
            },
        },
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

        // addBox(
        //     worldRef.current,
        //     translation(new Vec3(0, -4, 0)),
        //     { width: 5, height: 5, depth: 5 },
        //     Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
        //     "#A7D49B"
        // )

        // addBox(
        //     worldRef.current,
        //     translation(new Vec3(0, -20, 0)),
        //     { width: 30, height: 2, depth: 30 },
        //     Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
        //     "white"
        // )

        // addBox(
        //     worldRef.current,
        //     translation(new Vec3(0, -4, 0)),
        //     { width: 20, height: 2, depth: 20 },
        //     Rapier.RigidBodyDesc.fixed().setAdditionalMass(1),
        //     "white"
        // )

        // worldRef.current.importGLTF(roadSceneUrl)

        addPlayer(worldRef.current).then((playerEntity) => {
            playerRef.current = playerEntity

            const level = new (HelloWorld as any).Level()

            worldRef.current?.registerStepFunction(level.step)
            level.init(worldRef.current).then(() => {
                if (viewParentRef.current !== null) {
                    viewRef.current?.appendToElement(viewParentRef.current)
                } else {
                    throw new RefAccessedBeforeComponentMountedError(
                        "View parent ref is null"
                    )
                }

                levelRef.current = level

                setLevelCss(level.css)

                worldRef.current?.start()
            })
        })

        // worldRef.current.init()

        return () => {
            if (levelRef.current !== null) {
                worldRef.current?.unregisterStepFunction(levelRef.current.step)
            }
            worldRef.current?.destroy()
            resizeObserverRef.current?.unobserve(
                viewParentRef.current as Element
            )
            resizeObserverRef.current?.disconnect()
            worldRef.current = null
        }
    }, [])

    const [width, setWidth] = useState(400)

    const lessonInfo: LessonInfo = {
        title: (HelloWorld as any).title,
        chapter: (HelloWorld as any).chapter,
        section: (HelloWorld as any).section,
        content: HelloWorld.default,
    }

    return (
        <div class="">
            <style>{levelCss}</style>

            {/* <div class="border-r h-screen p-2"> */}
            <div
                class="h-full absolute top-0 left-0 z-10 m-3 p-5 bg-slate-100 bg-opacity-90 rounded-lg overflow-x-hidden shadow-lg backdrop-blur-lg"
                style={{ width: width }}
            >
                <Lesson bindings={bindings} info={lessonInfo} />
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
