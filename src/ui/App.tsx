import { MutableRef, useEffect, useRef } from "preact/hooks"

import * as Rapier from "@dimforge/rapier3d"

import { EditorWrapper } from "./EditorWrapper"
import { Vec3, World } from "../World"
import { View } from "../View"
import { RefAccessedBeforeComponentMountedError } from "../helpers"
import { addPlayer } from "../Player"
import { addBox } from "../level"

export const App = () => {
    const viewParentRef: MutableRef<HTMLDivElement | null> = useRef(null)
    const viewRef: MutableRef<View> = useRef(new View())

    const worldRef = useRef(new World({ x: 0, y: -9.8, z: 0 }, viewRef.current))

    const bindings = {}

    useEffect(() => {
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
    })

    useEffect(() => {
        if (viewParentRef.current !== null) {
            viewRef.current.appendToElement(viewParentRef.current)
        } else {
            throw new RefAccessedBeforeComponentMountedError(
                "View parent ref is null"
            )
        }

        return () => {
            viewRef.current.destroy()
        }
    })

    return (
        <div class="columns-2">
            <div class="border-r h-screen p-2">
                <div class="">
                    <EditorWrapper bindings={bindings} />
                </div>
            </div>
            <div class="border-l h-screen" ref={viewParentRef}></div>
        </div>
    )
}
