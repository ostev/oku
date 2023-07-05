import { ComponentChildren, FunctionalComponent } from "preact"

import * as HelloWorld from "../lessons/HelloWorld.mdx"
import * as GreetingOthers from "../lessons/GreetingOthers.mdx"

import { Goals, ID, LessonID, LessonInfo } from "./Lesson"
import { useMemo } from "preact/hooks"
import { error } from "../helpers"

export type Progress = Record<string, { goalsCompleted: ID[] }>

export const getGoals = (module: typeof HelloWorld): Goals => {
    return ((module as any).goals as any[]).reduce(
        (
            { goals, index }: { goals: Goals; index: number },
            goalKind: unknown
        ) => {
            if (goalKind === "main") {
                goals.main.push(
                    new ID(
                        (module as any).chapter,
                        (module as any).section,
                        index + 1
                    )
                )
            }
            return { goals, index: index + 1 }
        },
        { goals: { main: [], challenges: [] }, index: 0 }
    ).goals
}

export const getGoalsCompleted = (
    progress: Progress,
    chapter: number,
    section: number
): ID[] => {
    const lessonProgress = progress[`${chapter}-${section}`]
    if (lessonProgress === undefined) {
        return []
    } else {
        return lessonProgress.goalsCompleted
    }
}

export const getLessonInfo = (module: typeof HelloWorld): LessonInfo => {
    const moduleAsAny = module as any

    return {
        id: { chapter: moduleAsAny.chapter, section: moduleAsAny.section },
        title: moduleAsAny.title,
        content: module.default,
        level: moduleAsAny.level,
        goals: getGoals(module),
    }
}

export const lessons: Record<string, LessonInfo> = {
    "1-1": getLessonInfo(HelloWorld),
    "1-2": getLessonInfo(GreetingOthers),
}

export interface LessonCompletion {
    completed: LessonID[]
    started: LessonID[]
    notStarted: LessonID[]
}

export const InvalidLessonKeyError = error("InvalidLessonKeyError")

const getLessonIDFromKey = (key: string) => {
    const match = key.match(/(\d+)-(\d+)/)

    if (match !== null) {
        return {
            chapter: Number(match[1]),
            section: Number(match[2]),
        }
    } else {
        throw new InvalidLessonKeyError(`${key} is not a valid lesson ID.`)
    }
}

export const LessonSelector: FunctionalComponent<{
    progress: Progress
    onSelectLesson: (id: LessonID) => void
}> = ({ progress, onSelectLesson }) => {
    const lessonCompletion: LessonCompletion = useMemo(() => {
        const completed: LessonID[] = []
        const started: LessonID[] = []
        const notStarted: LessonID[] = []

        for (const [key, { goalsCompleted }] of Object.entries(progress)) {
            const { id, goals } = lessons[key]

            if (goalsCompleted.length <= 0) {
                notStarted.push(id)
            } else if (
                goalsCompleted.length ===
                goals.main.length + goals.challenges.length
            ) {
                completed.push(id)
            } else {
                started.push(id)
            }
        }

        return { completed, started, notStarted }
    }, [progress])

    const lessonStatus: ComponentChildren = useMemo(
        () =>
            Object.entries(lessons).map(([key, { id, title }]) => {
                if (lessonCompletion.completed.includes(id)) {
                    return (
                        <button
                            onClick={() => onSelectLesson(id)}
                            class="bg-green-200 hover:bg-green-300 transition-colors p-4 rounded-lg drop-shadow-lg"
                        >
                            {title}
                        </button>
                    )
                } else if (lessonCompletion.started.includes(id)) {
                    return (
                        <button
                            onClick={() => onSelectLesson(id)}
                            class="bg-yellow-200 hover:bg-green-300 transition-colors p-4 rounded-lg drop-shadow-lg"
                        >
                            {title}
                        </button>
                    )
                } else {
                    return (
                        <button
                            onClick={() => onSelectLesson(id)}
                            class="bg-slate-200 hover:bg-slate-300 transition-colors p-4 rounded-lg drop-shadow-lg"
                        >
                            {title}
                        </button>
                    )
                }
            }),
        [lessonCompletion]
    )

    return (
        <div class="flex h-screen">
            <div class="z-50 grid grid-flow-col auto-cols-max space-x-10 max-w-md p-10 m-auto my-auto bg-slate-200 bg-opacity-80 backdrop-blur-xl rounded-lg drop-shadow-2xl">
                {lessonStatus}
            </div>
        </div>
    )
}
