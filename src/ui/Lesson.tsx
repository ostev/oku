import { MDXProvider } from "@mdx-js/preact"
import {
    Component,
    ComponentChild,
    FunctionComponent,
    FunctionalComponent,
    h,
} from "preact"

import { HelloWorld } from "../level/levels/HelloWorld"

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
import { Level } from "../level/Level"
import { AudioSource, Entity, Vec3, World, getComponent } from "../World"
import { DocLink } from "./Docs"
import { View } from "../View"
import { UserExecutionContext } from "../userExecutionContext/UserExecutionContext"
import { addPlayer } from "../Player"
import {
    RefAccessedBeforeComponentMountedError,
    error,
    findIndexRight,
} from "../helpers"
import { useStorage } from "./useStorage"
import { Button, ButtonKind } from "./Button"
import { Modal } from "./Modal"
import { vec3Distance } from "../maths"

export interface LessonID {
    chapter: number
    section: number
}

export const CodeExcerptIDNotFoundError = error("CodeExcerptIDNotFoundError")

export const FunFact: FunctionalComponent = ({ children }) => (
    <div class="bg-slate-200 bg-opacity-40 backdrop-blur-sm m-1 my-3 p-3 rounded-lg">
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
    level: typeof HelloWorld
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
    // bindings: FnBindings
    info: LessonInfo
    onGoalCompletion: (id: ID) => void
    completedGoals: ID[]
}

export const Lesson: FunctionComponent<LessonProps> = ({
    info,
    onGoalCompletion,
    completedGoals,
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

    const bindings: FnBindings = {
        wait: { fn: () => {} },
        say: {
            fn: (context: UserExecutionContext, text: string) => {
                const utterance = new SpeechSynthesisUtterance(text)
                speechSynthesis.speak(utterance)

                if (playerRef.current !== null && worldRef.current !== null) {
                    // console.log("Send out audio event")
                    worldRef.current.activateAudioEvent({
                        kind: "speaking",
                        source: getComponent(
                            playerRef.current,
                            "audioSource"
                        ) as AudioSource,
                        text,
                    })
                }

                setSpeechHistory([text, ...speechHistory])
            },
        },
        forward: {
            fn: (context: UserExecutionContext, distance: number) => {
                console.log(`Move forward ${distance}`)
                if (worldRef.current !== null && playerRef.current !== null) {
                    const startingPlayerPos =
                        playerRef.current.transform.position
                    const speed = 0.001
                    const stepFunction = (
                        delta: number,
                        time: number,
                        world: World
                    ) => {
                        if (playerRef.current !== null) {
                            const player = world.getEntity(playerRef.current.id)
                            if (player !== undefined) {
                                if (
                                    vec3Distance(
                                        startingPlayerPos,
                                        player.transform.position
                                    ) >= distance
                                ) {
                                    world.playerMovementVector.z = 0
                                    world.unregisterStepFunction(stepFunction)

                                    context.resume()
                                } else {
                                    world.playerMovementVector.z =
                                        -speed * delta
                                }
                            }
                        }
                    }
                    worldRef.current.registerStepFunction(stepFunction)
                }
            },
        },
    }

    const cssRendererRef = useRef<HTMLDivElement | null>(null)

    const init = () => {
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
            (index) =>
                onGoalCompletion(
                    new ID(info.id.chapter, info.id.section, index)
                )
        )

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

            const level = new info.level()

            worldRef.current?.registerStepFunction(level.step)

            if (worldRef.current !== null) {
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
            }
        })
    }

    const destroy = () => {
        if (levelRef.current !== null) {
            worldRef.current?.unregisterStepFunction(levelRef.current.step)
        }
        worldRef.current?.destroy()
        resizeObserverRef.current?.unobserve(viewParentRef.current as Element)
        resizeObserverRef.current?.disconnect()
        worldRef.current = null
    }

    useEffect(() => {
        destroy()
        init()

        // worldRef.current.init()

        return destroy
    }, [info])

    const Code: FunctionComponent = ({ children }) => {
        const { initialCode, index } = useMemo(() => {
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
            return { initialCode: lines.join("\n") + "\n", index }
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
                onExecutionError={setExecutionError}
                onRun={(code) => {
                    destroy()
                    init()
                    setStoredCode(code)
                }}
                onFocus={() => {
                    worldRef.current?.stop()
                }}
                onBlur={() => {
                    worldRef.current?.start()
                }}
            />
        )
    }

    const Goal: FunctionComponent<{ index: number }> = ({
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
        Challenge,
        Goal,
        Hint: Paragraph,
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
                class="h-full absolute top-0 left-0 z-10 m-3 p-5 bg-slate-100 bg-opacity-90 rounded-lg overflow-x-hidden shadow-lg backdrop-blur-lg"
                style={{ width: 600 }}
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
            {/* {errorModal} */}
        </div>
    )
}
