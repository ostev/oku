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
import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { Card } from "./Card"
import { Paragraph } from "./Paragraph"
import { Level } from "../level/Level"
import { AudioSource, Entity, World, getComponent } from "../World"
import { DocLink } from "./Docs"
import { View } from "../View"
import { UserExecutionContext } from "../userExecutionContext/UserExecutionContext"
import { addPlayer } from "../Player"
import { RefAccessedBeforeComponentMountedError, error } from "../helpers"
import { useStorage } from "./useStorage"
import { Button, ButtonKind } from "./Button"
import { Modal } from "./Modal"

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

export const lessons = [HelloWorld]

export interface LessonInfo {
    title: string
    chapter: number
    section: number
    content: FunctionComponent
    level: typeof HelloWorld
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
}

export const Lesson: FunctionComponent<LessonProps> = ({
    info,
}: LessonProps) => {
    const [completedGoals, setCompletedGoals] = useStorage<ID[]>(
        `${info.chapter}-${info.section}_completedGoals`,
        []
    )

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

    const bindings: FnBindings = {
        wait: { fn: () => {} },
        say: {
            fn: (context: UserExecutionContext, text: string) => {
                const utterance = new SpeechSynthesisUtterance(text)
                // speechSynthesis.cancel()
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
            },
        },
        forward: {
            fn: (context: UserExecutionContext, distance: number) => {
                console.log(`Move forward ${distance}`)
                context.resume()
            },
        },
    }

    const cssRendererRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        viewRef.current = new View(cssRendererRef.current as HTMLElement)
        worldRef.current = new World(
            { x: 0, y: -9.8, z: 0 },
            viewRef.current,
            (index) =>
                setCompletedGoals(
                    completedGoals.concat([
                        new ID(info.chapter, info.section, index),
                    ])
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
            `${info.chapter}-${info.section}_${new ID(
                info.chapter,
                info.section,
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
                onRun={(code) => setStoredCode(code)}
            />
        )
    }

    const Goal: FunctionComponent<{ index: number }> = ({
        children,
        index,
    }) => {
        const id = new ID(info.chapter, info.section, index)

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
        const id = new ID(info.chapter, info.section, index)

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
                style={{ width: 400 }}
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
            {/* {errorModal} */}
        </div>
    )
}
