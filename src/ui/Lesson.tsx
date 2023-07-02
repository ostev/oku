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
import { EditorReader, EditorWrapper } from "./EditorWrapper"
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
import { RefAccessedBeforeComponentMountedError } from "../helpers"

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

export const Challenge: FunctionalComponent<{
    difficulty: "easy" | "medium" | "hard"
}> = ({ children, difficulty }) => {
    let difficultyEmoji

    if (difficulty == "easy") {
        difficultyEmoji = "🟩"
    } else if (difficulty == "medium") {
        difficultyEmoji = "🟧"
    } else {
        difficultyEmoji = "🟥"
    }

    return (
        <div class="my-4 ml-4">
            <Heading level={3}>🎯{difficultyEmoji} Challenge</Heading>{" "}
            {children}
        </div>
    )
}

export const GoalDisplay: FunctionalComponent<{
    completed?: boolean
    id: ID
}> = ({ children, completed, id }) => {
    return (
        <div class="my-4 ml-4">
            <Heading level={3} className="block">
                <span class="">🎯 Goal {id.index}</span>
                <input
                    type="checkbox"
                    class="ml-4 h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-neutral-300 outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
                    disabled={true}
                    checked={completed}
                    name={`Goal ${id.index}`}
                />
            </Heading>
            {children}
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

    toString = (): string => {
        return `${this.chapter}/${this.section}/${this.index}`
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
    const [completedGoals, setCompletedGoals] = useState<ID[]>([])

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
        worldRef.current = new World(
            { x: 0, y: -9.8, z: 0 },
            viewRef.current,
            (id) => console.log("Complete goal", id)
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

    const pre: FunctionComponent = ({ children }) => {
        const readerRef = useRef(new EditorReader())

        let initialCode

        if (typeof children === "object") {
            initialCode = (children as any).props.children
        } else if (typeof children === "string") {
            initialCode = children
        } else {
            initialCode = "⚠️ Invalid children ⚠️"
        }
        initialCode += "\n"

        return (
            <EditorWrapper
                bindings={bindings}
                initialCode={initialCode}
                readerRef={readerRef}
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
            >
                {children}
            </GoalDisplay>
        )
    }

    const components = {
        h1: H1,
        pre,
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
                <style>{levelCss}</style>
            </div>
        </div>
    )
}
