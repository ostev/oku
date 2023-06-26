import { MutableRef, useEffect, useMemo, useRef } from "preact/hooks"

import * as Rapier from "@dimforge/rapier3d"

import { EditorWrapper } from "./EditorWrapper"
import { Vec3, World } from "../World"
import { View } from "../View"
import { RefAccessedBeforeComponentMountedError } from "../helpers"
import { addPlayer } from "../Player"
import { addBox } from "../level"

export const App = () => {
    const viewParentRef: MutableRef<HTMLDivElement | null> = useRef(null)
    const viewRef: MutableRef<View | null> = useRef(null)

    const resizeObserverRef: MutableRef<ResizeObserver | null> = useRef(null)

    const worldRef: MutableRef<World | null> = useRef(null)

    const bindings = {}

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

        if (viewParentRef.current !== null) {
            viewRef.current.appendToElement(viewParentRef.current)
        } else {
            throw new RefAccessedBeforeComponentMountedError(
                "View parent ref is null"
            )
        }

        worldRef.current.start()

        return () => {
            viewRef.current?.destroy()
            resizeObserverRef.current?.unobserve(
                viewParentRef.current as Element
            )
            resizeObserverRef.current?.disconnect()
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
