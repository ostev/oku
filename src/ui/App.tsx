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
import { Lesson, LessonInfo } from "./Lesson"

import * as HelloWorld from "../lessons/HelloWorld.mdx"

import { FnBindings } from "../userExecutionContext/bindings"

import { Level } from "../level/Level"
import { UserExecutionContext } from "../userExecutionContext/UserExecutionContext"

export const App = () => {
    const [width, setWidth] = useState(400)

    const lessonInfo: LessonInfo = {
        title: (HelloWorld as any).title,
        chapter: (HelloWorld as any).chapter,
        section: (HelloWorld as any).section,
        content: HelloWorld.default,
        level: (HelloWorld as any).level,
    }

    // return <div class="">{/* <div class="border-r h-screen p-2"> */}</div>
    return <Lesson info={lessonInfo} />
}
