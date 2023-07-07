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

export const App = () => {
    const [progress, setProgress] = useStorage<Progress>("progress", {})
    const [currentLesson, setCurrentLesson] = useStorage<LessonID>(
        "currentLesson",
        { chapter: 1, section: 1 }
    )

    const [showLessonPicker, setShowLessonPicker] = useState(false)

    // const lessonInfo: LessonInfo = {
    //     title: (HelloWorld as any).title,
    //     chapter: (HelloWorld as any).chapter,
    //     section: (HelloWorld as any).section,
    //     content: HelloWorld.default,
    //     level: (HelloWorld as any).level,
    // }

    // return <div class="">{/* <div class="border-r h-screen p-2"> */}</div>

    const key = `${currentLesson.chapter}-${currentLesson.section}`

    const lesson = lessons[key]

    console.log("Progress", progress)

    const lessonElement = (
        <Lesson
            completedGoals={getGoalsCompleted(
                progress,
                lesson.id.chapter,
                lesson.id.section
            )}
            onGoalCompletion={(id) => {
                setProgress((progress) => ({
                    ...progress,
                    "1-1": {
                        goalsCompleted: [
                            ...getGoalsCompleted(progress, 1, 1),
                            id,
                        ],
                    },
                }))
            }}
            info={lesson}
        />
    )

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
