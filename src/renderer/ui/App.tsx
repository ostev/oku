import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks"

import {
    EventSource,
    Entity,
    NoIndicesFoundOnGeometryError,
    Vec3,
    World,
    getComponent,
    translation,
} from "../World"
import { View } from "../View"
import { addPlayer } from "../Player"
import { addBox } from "../level"
// import { Heading } from "./Heading"
import { ID, Lesson, LessonID, LessonInfo } from "./Lesson"

import * as HelloWorld from "../lessons/HelloWorld.mdx"

import { FnBindings } from "../userExecutionContext/bindings"

import { Level } from "../level/Level"
import { UserExecutionContext } from "../userExecutionContext/UserExecutionContext"
import { useStorage } from "./useStorage"
import {
    LessonSelector,
    Progress,
    getGoalsCompleted,
    lessons,
} from "./LessonSelector"
import { Button, ButtonKind } from "./Button"
import { pickValue } from "../helpers"
import { Heading } from "./Heading"
import {
    AudioManager,
    MinorTonality,
    NoteAccidental,
    NoteLetter,
    Sound,
} from "../audio/AudioManager"

export const App = () => {
    const [isShowingMainMenu, setIsShowingMainMenu] = useState(true)
    const [progress, setProgress] = useStorage<Progress>("progress", {})
    const [currentLesson, setCurrentLesson] = useStorage<LessonID | undefined>(
        "currentLesson",
        undefined
    )

    const [showLessonPicker, setShowLessonPicker] = useState(false)

    const audioManagerRef = useRef<AudioManager | null>(null)

    useEffect(() => {
        audioManagerRef.current = new AudioManager(
            80,
            {
                tonality: MinorTonality.Natural,
                tonic: {
                    letter: NoteLetter.D,
                    accidental: NoteAccidental.None,
                },
            },
            (sound) => {
                if (isShowingMainMenu) {
                    setTimeout(() => {
                        setIsShowingMainMenu((currentMenuStatus) => {
                            if (sound === Sound.Menu && currentMenuStatus) {
                                console.log(currentMenuStatus)
                                audioManagerRef.current?.sounds.menu.start()
                                // setTimeout(() => {

                                //     if (!isShowingMainMenu) {
                                //         audioManagerRef.current?.sounds.menu.stop()
                                //     }
                                // }, 5000)
                            }

                            return currentMenuStatus
                        })
                    }, 800)
                }
            }
        )

        return () => audioManagerRef.current?.destroy()
    })

    // const lessonInfo: LessonInfo = {
    //     title: (HelloWorld as any).title,
    //     chapter: (HelloWorld as any).chapter,
    //     section: (HelloWorld as any).section,
    //     content: HelloWorld.default,
    //     level: (HelloWorld as any).level,
    // }

    // return <div class="">{/* <div class="border-r h-screen p-2"> */}</div>

    if (isShowingMainMenu) {
        const color = pickValue(
            ["bg-orange-300", "amber-bg", "lime-bg"],
            Math.random()
        )
        return (
            <div class={`w-screen h-screen ${color}`}>
                <div class={`h-full w-full grid place-items-center`}>
                    <div class={"grid place-items-center"}>
                        <Heading level={1} className="">
                            Untitled
                        </Heading>
                        <Button
                            onClick={() => {
                                if (audioManagerRef.current !== null) {
                                    audioManagerRef.current.play(
                                        audioManagerRef.current.sounds.enter
                                    )
                                    audioManagerRef.current.sounds.menu.stop()
                                }

                                if (
                                    localStorage.getItem("currentLesson") ===
                                    null
                                ) {
                                    setCurrentLesson({ chapter: 1, section: 1 })
                                }
                                setIsShowingMainMenu(false)
                            }}
                            kind={ButtonKind.Underline}
                            className="tracking-wider"
                        >
                            {Object.keys(progress).length === 0
                                ? "Begin"
                                : "Continue"}
                        </Button>
                    </div>
                </div>
            </div>
        )
    } else {
        let lessonElement

        if (currentLesson !== undefined && audioManagerRef.current !== null) {
            const key = `${currentLesson.chapter}-${currentLesson.section}`

            const lesson = lessons[key]

            lessonElement = (
                <Lesson
                    audioManager={audioManagerRef.current}
                    completedGoals={getGoalsCompleted(
                        progress,
                        lesson.id.chapter,
                        lesson.id.section
                    )}
                    onGoalCompletion={(id) => {
                        console.log("Completed goal", id)

                        setProgress((progress) => {
                            const goalsCompleted = getGoalsCompleted(
                                progress,
                                currentLesson.chapter,
                                currentLesson.section
                            )

                            if (goalsCompleted.find(id.equals) === undefined) {
                                const updatedProgress = { ...progress }
                                updatedProgress[key] = {
                                    goalsCompleted: [...goalsCompleted, id],
                                }

                                console.log(
                                    "Updated progress to:",
                                    updatedProgress
                                )

                                return updatedProgress
                            } else {
                                return progress
                            }
                        })
                    }}
                    info={lesson}
                />
            )
        } else {
            lessonElement = undefined
        }

        return (
            // <Lesson
            //     info={lessonInfo}
            //     onGoalCompletion={(id) => {
            //         setProgress({
            //             ...progress,
            //             "1-1": {
            //                 goalsCompleted: [
            //                     ...getGoalsCompleted(progress, 1, 1),
            //                     id,
            //                 ],
            //             },
            //         })
            //     }}
            //     completedGoals={getGoalsCompleted(progress, 1, 1)}
            // />
            <div>
                {lessonElement}
                {showLessonPicker ? (
                    <LessonSelector
                        progress={progress}
                        onSelectLesson={(id) => {
                            setShowLessonPicker(false)
                            setCurrentLesson(id)
                        }}
                    />
                ) : null}

                {showLessonPicker ? null : (
                    <Button
                        kind={ButtonKind.Green}
                        onClick={() => {
                            setShowLessonPicker(true)
                        }}
                        className="fixed bottom-5 right-5"
                    >
                        Show lessons
                    </Button>
                )}

                {showLessonPicker ? (
                    <Button
                        onClick={() => setShowLessonPicker(false)}
                        className="fixed bottom-5 right-6"
                    >
                        Hide lessons
                    </Button>
                ) : null}
            </div>
        )
    }
}
