import { MDXProvider } from "@mdx-js/preact"
import {
    Component,
    ComponentChild,
    FunctionComponent,
    FunctionalComponent,
    h,
} from "preact"

import * as Three from "three"
import * as Rapier from "@dimforge/rapier3d"

import { H1, Heading } from "./Heading"
import { EditorReadWriter, EditorWrapper } from "./EditorWrapper"
import { FnBindings } from "../userExecutionContext/bindings"
import {
    MutableRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "preact/hooks"
import { Card } from "./Card"
import { Paragraph } from "./Paragraph"
import { Level, addTestCube } from "../level/Level"
import {
    EventSource,
    Entity,
    Vec3,
    World,
    getComponent,
    forwardVector,
    translation,
    forward,
    turn,
} from "../World"
import { DocLink } from "./Docs"
import { View } from "../View"
import { UserExecutionContext } from "../userExecutionContext/UserExecutionContext"
import { addPlayer } from "../Player"
import {
    $,
    RefAccessedBeforeComponentMountedError,
    error,
    findIndexRight,
} from "../helpers"
import { useStorage } from "./useStorage"
import { Button, ButtonKind } from "./Button"
import { Modal } from "./Modal"
import { degToRad, easeInOutSine, vec3Distance } from "../maths"

import completeGoalAnimUrl from "../assets/win.webm"
import { AudioManager } from "../audio/AudioManager"

export interface LessonID {
    chapter: number
    section: number
}

export const CodeExcerptIDNotFoundError = error("CodeExcerptIDNotFoundError")

export const Hint: FunctionalComponent<{ index: number }> = ({
    children,
    index,
}) => (
    <details class="bg-slate-200 bg-opacity-60 backdrop-blur-sm m-1 my-3 p-3 rounded-lg">
        <summary class="font-bold text-lg">Hint {index}</summary>
        {children}
    </details>
)

export const FunFact: FunctionalComponent = ({ children }) => (
    <div class="bg-slate-200 bg-opacity-60 backdrop-blur-sm m-1 my-3 p-3 rounded-lg">
        <Heading level={3}>Fun fact! 💡</Heading>
        {children}
    </div>
)

export const Ref: FunctionalComponent<{ chapter: number; section: number }> = ({
    children,
    chapter,
    section,
}) => <a href={`/${chapter}/${section}`}>{children}</a>

export const YourTurn: FunctionalComponent = ({ children }) => (
    <div>
        <Heading level={2}>Your turn!</Heading>
        {children}
    </div>
)

export const GoalDisplay: FunctionalComponent<{
    completed?: boolean
    id: ID
    titlePrefix: string
}> = ({ children, completed, id, titlePrefix }) => {
    const cssId = `goal-checkbox-${id.stringify()}`

    return (
        <div class="my-4 ml-4">
            <Heading level={3} className="flex items-center">
                <label
                    class="ml-2 text-sm font-medium"
                    style={{
                        textDecoration: completed ? "line-through" : "none",
                    }}
                    for={cssId}
                >
                    {titlePrefix} {id.index}
                </label>
                <input
                    type="checkbox"
                    class="ml-4 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    id={cssId}
                    disabled={true}
                    checked={completed}
                    onChange={(e) => e.preventDefault()}
                    name={`Goal ${id.index}`}
                />
            </Heading>
            <div class="ml-4">{children}</div>
        </div>
    )
}

export type GoalKind = "main" | "challenge"

export type Goals = { main: ID[]; challenges: ID[] }

export interface LessonInfo {
    title: string
    id: LessonID
    content: FunctionComponent
    level: typeof Level
    goals: Goals
}

export class ID {
    chapter: number
    section: number
    index: number

    constructor(chapter: number, section: number, index: number) {
        this.chapter = chapter
        this.section = section
        this.index = index
    }

    stringify = (): string => {
        return `${this.chapter}-${this.section}-${this.index}`
    }

    equals = (otherID: ID) =>
        this.chapter === otherID.chapter &&
        this.section === otherID.section &&
        this.index === otherID.index
}

export interface LessonProps {
    info: LessonInfo
    onGoalCompletion: (id: ID) => void
    completedGoals: ID[]
    audioManager: AudioManager
}

export const Lesson: FunctionComponent<LessonProps> = ({
    info,
    onGoalCompletion,
    completedGoals,
    audioManager,
}: LessonProps) => {
    // const [completedGoals, setCompletedGoals] = useStorage<ID[]>(
    //     `${info.chapter}-${info.section}_completedGoals`,
    //     []
    // )

    const viewParentRef: MutableRef<HTMLDivElement | null> = useRef(null)
    const viewRef: MutableRef<View | null> = useRef(null)

    const resizeObserverRef: MutableRef<ResizeObserver | null> = useRef(null)

    const worldRef: MutableRef<World | null> = useRef(null)
    const levelRef: MutableRef<Level | null> = useRef(null)
    const playerRef: MutableRef<Entity | null> = useRef(null)

    // const [linesSaid, setLinesSaid] = useState<string[]>([])
    const [levelCss, setLevelCss] = useState("")
    const [executionError, setExecutionError] = useState<Error | undefined>(
        undefined
    )
    const [speechHistory, setSpeechHistory] = useState<string[]>([])

    const [completeGoalAnim, setCompleteGoalAnim] = useState<
        number | undefined
    >(undefined)
    const completeGoalAnimPlayer = useRef<HTMLVideoElement | null>(null)

    const executionContextRef = useRef<UserExecutionContext | undefined>(
        undefined
    )
    const executionParentRef = useRef<HTMLDivElement | null>(null)

    const bindings: FnBindings = {
        wait: {
            fn: (context, duration: number) => {
                if (worldRef.current !== null && playerRef.current !== null) {
                    worldRef.current.activateEvent({
                        event: { kind: "wait", duration },
                        source: getComponent(
                            playerRef.current,
                            "eventSource"
                        ) as EventSource,
                    })
                }
            },
        },
        say: {
            fn: (context: UserExecutionContext, argText: any) => {
                const text = argText.toString()
                const utterance = new SpeechSynthesisUtterance(text)
                utterance.voice = speechSynthesis.getVoices()[0]

                speechSynthesis.speak(utterance)

                if (playerRef.current !== null && worldRef.current !== null) {
                    // console.log("Send out audio event")
                    worldRef.current.activateEvent({
                        event: {
                            kind: "speaking",
                            text,
                        },
                        source: getComponent(
                            playerRef.current,
                            "eventSource"
                        ) as EventSource,
                    })
                }

                setSpeechHistory((currentSpeechHistory) => [
                    text,
                    ...currentSpeechHistory,
                ])
            },
        },
        forward: {
            fn: (context: UserExecutionContext, distance: number) => {
                if (playerRef.current !== null && worldRef.current !== null) {
                    worldRef.current.activateEvent({
                        event: {
                            kind: "forward",
                            distance,
                        },
                        source: getComponent(
                            playerRef.current,
                            "eventSource"
                        ) as EventSource,
                    })
                    forward(
                        distance,
                        worldRef.current,
                        playerRef.current,
                        context.resume
                    )
                }
            },
        },
        turn: {
            fn: (context, degrees: number) => {
                if (worldRef.current !== null && playerRef.current !== null) {
                    worldRef.current.activateEvent({
                        event: {
                            kind: "turn",
                            radians: degToRad(degrees),
                        },
                        source: getComponent(
                            playerRef.current,
                            "eventSource"
                        ) as EventSource,
                    })

                    turn(
                        degrees,
                        worldRef.current.playerRotation,
                        worldRef.current,
                        playerRef.current,
                        (radians) => {
                            if (worldRef.current !== null) {
                                worldRef.current.playerRotation = radians
                            }
                        },
                        context.resume
                    )
                }
            },
        },
        readDistance: {
            fn: (context) => {
                if (playerRef.current !== null && worldRef.current !== null) {
                    const forward = forwardVector(playerRef.current.transform)

                    const position = playerRef.current.transform.position
                    const multiplier = 2 / 10

                    const shapePos = new Vec3(
                        position.x + forward.x * multiplier + 0.3 * forward.x,
                        position.y + forward.y * multiplier - 0.2,
                        position.z + forward.z * multiplier + 0.3 * forward.z
                    )

                    if (debug) {
                        worldRef.current.addEntity(
                            translation(shapePos),
                            new Set([
                                {
                                    kind: "mesh",
                                    mesh: new Three.Mesh(
                                        new Three.BoxGeometry(0.1, 0.1, 0.1),
                                        new Three.MeshStandardMaterial({
                                            color: "red",
                                        })
                                    ),
                                },
                            ])
                        )
                    }

                    const shape = new Rapier.Cuboid(0.1, 0.1, 0.1)

                    const hit = worldRef.current.physics.castShape(
                        shapePos,
                        new Three.Quaternion(),
                        forward,
                        shape,
                        50,
                        true
                    )

                    if (hit !== null) {
                        if (debug) {
                            worldRef.current.addEntity(
                                translation(Vec3.fromXYZ(hit.witness1)),
                                new Set([
                                    {
                                        kind: "mesh",
                                        mesh: new Three.Mesh(
                                            new Three.BoxGeometry(
                                                0.1,
                                                0.1,
                                                0.1
                                            ),
                                            new Three.MeshStandardMaterial({
                                                color: "purple",
                                            })
                                        ),
                                    },
                                ])
                            )
                        }

                        context.returnNumber(hit.toi)
                    } else {
                        context.returnNumber(Infinity)
                    }
                }
            },
        },

        pickUp: {
            fn: (context) => {
                try {
                    worldRef.current?.pickUpParcel()
                    setTimeout(context.resume, 200)
                } catch (error) {
                    setExecutionError(error as Error)
                    destroy()
                    init()
                }
            },
        },

        placeDown: {
            fn: (context) => {
                try {
                    worldRef.current?.placeDownParcel()
                    setTimeout(context.resume, 200)
                } catch (error) {
                    setExecutionError(error as Error)
                    destroy()
                    init()
                }
            },
        },

        repeat: {
            fn: (_context, times: number) => {
                console.log(`Repeat ${times} times`)
                worldRef.current?.activateEvent({
                    event: { kind: "repeat", times },
                    source: new EventSource(Vec3.zero),
                })
            },
        },
    }

    const onFinish = () => {
        if (worldRef.current !== null) {
            worldRef.current.activateEvent({
                event: { kind: "executionComplete" },
                source: new EventSource(new Vec3(0, 0, 0)),
            })
        }
    }

    const debug = import.meta.env.DEV

    const cssRendererRef = useRef<HTMLDivElement | null>(null)

    // useEffect(() => {
    //     const onWindowFocus = () => {
    //         if (worldRef.current !== null && !worldRef.current.isRunning) {
    //             worldRef.current.start()
    //         }
    //     }

    //     const onWindowBlur = () => {
    //         if (worldRef.current !== null && worldRef.current.isRunning) {
    //             worldRef.current.stop()
    //         }
    //     }

    //     window.addEventListener("focus", onWindowFocus)
    //     window.addEventListener("blur", onWindowBlur)

    //     return () => {
    //         window.removeEventListener("focus", onWindowFocus)
    //         window.removeEventListener("blur", onWindowBlur)
    //     }
    // }, [])

    const init = async () => {
        viewRef.current = new View(cssRendererRef.current as HTMLElement)
        worldRef.current = new World(
            { x: 0, y: -9.8, z: 0 },
            viewRef.current,
            // (index) =>
            // setCompletedGoals(
            //     completedGoals.concat([
            //         new ID(info.chapter, info.section, index),
            //     ])
            // )
            (index) => {
                setCompleteGoalAnim(index)

                setTimeout(() => setCompleteGoalAnim(undefined), 3000)
                onGoalCompletion(
                    new ID(info.id.chapter, info.id.section, index)
                )
            },
            audioManager
        )

        resizeObserverRef.current = new ResizeObserver(([viewParentEntry]) => {
            viewRef.current?.setSize(
                viewParentEntry.contentRect.width,
                viewParentEntry.contentRect.height
            )
        })
        resizeObserverRef.current.observe(viewParentRef.current as Element)

        if (executionParentRef.current !== null) {
            executionContextRef.current = new UserExecutionContext(
                executionParentRef.current,
                bindings,
                setExecutionError,
                onFinish
            )
        }

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

        return new Promise<void>((resolve, reject) => {
            if (worldRef.current !== null) {
                addPlayer(worldRef.current).then((playerEntity) => {
                    playerRef.current = playerEntity

                    const level = new info.level()

                    worldRef.current?.registerStepFunction(level.step)

                    try {
                        if (worldRef.current !== null) {
                            level.init(worldRef.current).then(() => {
                                if (viewParentRef.current !== null) {
                                    viewRef.current?.appendToElement(
                                        viewParentRef.current
                                    )
                                } else {
                                    throw new RefAccessedBeforeComponentMountedError(
                                        "View parent ref is null"
                                    )
                                }

                                levelRef.current = level

                                setLevelCss(level.css)

                                worldRef.current?.start()

                                resolve()
                            })
                        } else {
                            reject()
                        }
                    } catch (e) {
                        setExecutionError(e as Error)
                    }
                })
            } else {
                reject()
            }
        })
    }

    const destroy = () => {
        if (levelRef.current !== null) {
            worldRef.current?.unregisterStepFunction(levelRef.current.step)
        }
        levelRef.current?.destroy(worldRef.current as World)
        levelRef.current = null

        worldRef.current?.destroy()
        worldRef.current = null

        resizeObserverRef.current?.unobserve(viewParentRef.current as Element)
        resizeObserverRef.current?.disconnect()

        executionContextRef.current?.destroy()
    }

    useEffect(() => {
        destroy()
        init()

        // worldRef.current.init()

        return destroy
    }, [info])

    const Code: FunctionComponent = ({ children }) => {
        const { initialCode, index, runnable } = useMemo(() => {
            let code: string

            if (typeof children === "object") {
                code = (children as any).props.children
            } else if (typeof children === "string") {
                code = children
            } else {
                code = "⚠️ Invalid children ⚠️"
            }

            let index: number
            const lines = code.split("\n")
            if (code.trim().startsWith("//")) {
                const match = lines[0].trim().match(/\/\/\s*(\d+)/)

                if (match !== null && match[1] !== undefined) {
                    index = Number(match[1])
                } else {
                    throw new CodeExcerptIDNotFoundError(
                        `No ID header found in the following code (regex didn't match):\n${code}`
                    )
                }
            } else {
                throw new CodeExcerptIDNotFoundError(
                    `No ID header found in the following code:\n${code}`
                )
            }

            lines.shift()

            const runnable = !lines[0].includes("no-run")

            return { initialCode: lines.join("\n") + "\n", index, runnable }
        }, [children])

        const [storedCode, setStoredCode] = useStorage(
            `${info.id.chapter}-${info.id.section}_${new ID(
                info.id.chapter,
                info.id.section,
                index
            ).stringify()}_storedCode`,
            initialCode
        )
        const readWriteRef = useRef(new EditorReadWriter())

        useEffect(() => {
            readWriteRef.current.write(storedCode)
        }, [storedCode])

        useEffect(() => {
            const intervalHandle = setInterval(() => {
                // console.log("Save")
                setStoredCode(readWriteRef.current.read())
                // console.log(storedCode)
            }, 5_000)
            const blurEventListener = () =>
                setStoredCode(readWriteRef.current.read())
            window.addEventListener("blur", blurEventListener)

            return () => {
                clearInterval(intervalHandle)
                window.removeEventListener("blur", blurEventListener)
            }
        }, [])

        const additionalToolbarItems = (
            <Button
                kind={ButtonKind.Danger}
                onClick={() => setStoredCode(initialCode)}
            >
                Reset
            </Button>
        )

        return (
            <EditorWrapper
                bindings={bindings}
                initialCode={initialCode}
                readerRef={readWriteRef}
                additionalToolbarItems={additionalToolbarItems}
                runnable={runnable}
                onRun={async (code) => {
                    audioManager.sounds.itemHover.stop()
                    setSpeechHistory([])
                    destroy()

                    setStoredCode(code)

                    return init().then(() => {
                        if (worldRef.current !== null) {
                            worldRef.current.code = code
                        }

                        if (
                            worldRef.current !== null &&
                            levelRef.current !== null
                        ) {
                            levelRef.current.onRun(worldRef.current)
                        }
                        if (executionContextRef.current !== undefined) {
                            setTimeout(() => {
                                if (executionContextRef.current !== undefined) {
                                    executionContextRef.current.evalAsync(code)
                                }
                            }, 500)
                        }
                    })
                }}
                onFocus={() => {
                    if (worldRef.current?.isRunning) {
                        worldRef.current?.stop()
                    }
                    setStoredCode(readWriteRef.current.read())
                }}
                onBlur={() => {
                    if (!worldRef.current?.isRunning) {
                        worldRef.current?.start()
                    }
                    setStoredCode(readWriteRef.current.read())
                }}
            />
        )
    }

    const Goal: FunctionalComponent<{ index: number; onClear: () => void }> = ({
        children,
        index,
    }) => {
        const id = new ID(info.id.chapter, info.id.section, index)

        return (
            <GoalDisplay
                completed={completedGoals.some((otherID) => id.equals(otherID))}
                id={id}
                titlePrefix="🎯 Goal"
            >
                {children}
            </GoalDisplay>
        )
    }

    const Challenge: FunctionComponent<{
        index: number
        difficulty: "easy" | "medium" | "hard"
    }> = ({ children, index, difficulty }) => {
        const id = new ID(info.id.chapter, info.id.section, index)

        let difficultyEmoji

        if (difficulty == "easy") {
            difficultyEmoji = "🟩"
        } else if (difficulty == "medium") {
            difficultyEmoji = "🟧"
        } else {
            difficultyEmoji = "🟥"
        }

        return (
            <GoalDisplay
                completed={completedGoals.some((otherID) => id.equals(otherID))}
                id={id}
                titlePrefix={`${difficultyEmoji} Challenge`}
            >
                {children}
            </GoalDisplay>
        )
    }

    const components = {
        h1: H1,
        pre: Code,
        MainEditor: EditorWrapper,
        FunFact,
        p: Paragraph,
        DocLink,
        YourTurn,
        Challenge: Goal,
        Goal,
        Hint,
        Ref,
    }

    const ErrorModal = () => (
        <Modal
            name="error"
            title="I encountered an error..."
            onDismiss={() => setExecutionError(undefined)}
        >
            <Paragraph>
                I tried to run your code, but I encountered an error. Here it
                is:
            </Paragraph>
            <Paragraph className="font-mono text-red-950">
                {(executionError as Error).toString()}
            </Paragraph>
        </Modal>
    )

    return (
        <div>
            <article
                class="absolute top-0 left-0 z-10 m-3 p-5 bg-slate-100 bg-opacity-90 rounded-lg overflow-x-hidden shadow-lg backdrop-blur-lg"
                style={{
                    width: 600,
                    height: "calc(100% - 1.5rem)",
                    resize: "horizontal",
                }}
            >
                <H1 className="mb-4">{info.title}</H1>
                <MDXProvider components={components}>
                    {h(info.content, {})}
                </MDXProvider>
            </article>
            {/* <div class="border-l h-screen" ref={viewParentRef}></div> */}
            <div
                class="h-full w-full absolute top-0 left-0 z-0"
                ref={viewParentRef}
            >
                {/* <div
                    ref={cssRendererRef}
                    style="width: 100%; height: 100%; position:absolute; top:0; left:0; pointer-events: none;"
                ></div> */}
                <style>{levelCss}</style>
            </div>
            {
                // <div>
                /* <video
                        ref={completeGoalAnimPlayer}
                        src={completeGoalAnimUrl}
                        controls={false}
                        autoPlay={true}
                        style={{
                            height: "60vh",
                            position: "fixed",
                            right: "5vw",
                            top: "45%",
                            margin: 0,
                        }}
                    ></video>
                    <div
                        style={{
                            height: "60vh",
                            position: "fixed",
                            right: "5vw",
                            top: "45%",
                            margin: 0,
                        }}
                    >
                        <Heading level={1}>{completeGoalAnim}</Heading>
                    </div> */
                // </div>
            }
            <div class={`fixed right-5 h-screen grid place-items-center`}>
                <div
                    class={`rounded-xl shadow-xl backdrop-blur-xl grid place-items-center p-4 challenge-complete-box ${
                        completeGoalAnim === undefined
                            ? ""
                            : "challenge-complete"
                    }`}
                >
                    <Heading level={1}>
                        <span class="party">🎉</span> Goal {completeGoalAnim}{" "}
                        completed!
                    </Heading>
                </div>
            </div>
            {executionError === undefined ? undefined : <ErrorModal />}
            {speechHistory.length > 0 ? (
                <div
                    class="fixed  max-h-40 overflow-x-hidden overflow-y-scroll top-5 right-5 bg-slate-200 bg-opacity-70 backdrop-blur-xl rounded p-1"
                    style={{ zIndex: 5000, minWidth: 200 }}
                >
                    <Button
                        onClick={() => setSpeechHistory([])}
                        className="absolute top-1 right-1"
                    >
                        Clear
                    </Button>
                    <ol class="mt-10">
                        {speechHistory.map((text) => (
                            <li class="bg-slate-300 bg-opacity-70 rounded p-2 m-4">
                                <em>&ldquo;{text}&rdquo;</em>
                            </li>
                        ))}
                    </ol>
                </div>
            ) : undefined}
            <div ref={executionParentRef}></div>
        </div>
    )
}
