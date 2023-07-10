import * as Three from "three"
import * as Tween from "three/addons/libs/tween.module.js"
import * as Rapier from "@dimforge/rapier3d"

import { Vec3, World, getComponent, translation } from "../../World"
import { Level } from "../Level"

import stageUrl from "../../assets/stage.gltf?url"
import { addPeggy } from "../../characters/peggy"
import { vec3Distance } from "../../maths"

function tween(light: Three.SpotLight) {
    new Tween.Tween(light)
        .to(
            {
                angle: Math.random() * 0.7 + 0.1,
                penumbra: Math.random() + 1,
            },
            Math.random() * 800 + 2000
        )
        .easing(Tween.Easing.Quadratic.Out)
        .start()

    new Tween.Tween(light.position)
        .to(
            {
                x: Math.random() * 3 - 1.5,
                y: Math.random() * 1 + 1.5,
                z: Math.random() * 3 - 1.5,
            },
            Math.random() * 700 + 2000
        )
        .easing(Tween.Easing.Quadratic.Out)
        .start()

    new Tween.Tween(light.rotation)
        .to({ x: 0, y: 0, z: Math.random() * 2 - 1 }, Math.random() * 1000)
        .easing(Tween.Easing.Quadratic.Out)
        .start()
}

export class SongAndDance implements Level {
    private previousSpotlightAnimationTime: number = 0
    private spotlights: Three.SpotLight[] = []
    private spotlightHelpers: Three.SpotLightHelper[] | undefined

    //     css = `
    //         canvas {
    //             background-image: linear-gradient(
    //   45deg,
    //   hsl(240deg 100% 20%) 0%,
    //   hsl(262deg 90% 27%) 22%,
    //   hsl(271deg 78% 35%) 33%,
    //   hsl(278deg 70% 43%) 42%,
    //   hsl(285deg 66% 50%) 51%,
    //   hsl(291deg 85% 58%) 59%,
    //   hsl(291deg 85% 69%) 67%,
    //   hsl(292deg 86% 77%) 75%,
    //   hsl(294deg 87% 85%) 82%,
    //   hsl(295deg 88% 93%) 90%,
    //   hsl(0deg 0% 100%) 99%
    // );
    //         }
    // `

    css = `
        canvas {
            background-image: linear-gradient(
                45deg,
                hsl(128deg 16% 65%) 0%,
                hsl(157deg 30% 58%) 27%,
                hsl(174deg 51% 47%) 40%,
                hsl(184deg 100% 38%) 50%,
                hsl(193deg 100% 44%) 60%,
                hsl(200deg 100% 49%) 69%,
                hsl(203deg 100% 50%) 77%,
                hsl(207deg 100% 50%) 85%,
                hsl(251deg 100% 71%) 92%,
                hsl(291deg 85% 58%) 100%
            );

        }
    `

    init = async (world: World) => {
        world.view.sun.removeFromParent()
        world.view.ambientLight.color = new Three.Color("#5e5e5e")

        world.view.setOrthographicScale(0.007)

        await world.importGLTF(stageUrl, new Vec3(0, -2, 0))

        // const peggyPosition = new Vec3(0, 0, -2.4)
        // const peggy = await addPeggy(world, peggyPosition)

        // const peggyListener = world.addEntity(
        //     translation(peggyPosition),
        //     new Set([
        //         {
        //             kind: "listener",
        //             notify: (event) => {
        //                 if (event.kind === "speaking") {
        //                     console.log("Heard", event)
        //                     const distance = vec3Distance(
        //                         event.source.position,
        //                         peggyPosition
        //                     )
        //                     console.log("Distance: ", distance)

        //                     if (distance <= 1) {
        //                         console.log("Complete 1")
        //                         world.completeGoal(1)
        //                     }
        //                 }
        //             },
        //         },
        //     ])
        // )

        this.initSpotlights(world)
    }

    private initSpotlights = (world: World) => {
        this.spotlights = [
            new Three.SpotLight("#F87EFF"),
            new Three.SpotLight("#73FFF2"),
            new Three.SpotLight("#F6FFB1"),
        ]

        for (const spotlight of this.spotlights) {
            spotlight.angle = 0.3
            spotlight.penumbra = 0.2
            spotlight.decay = 2
            spotlight.distance = 50

            spotlight.castShadow = true
            spotlight.shadow.bias = -0.0004

            world.view.scene.add(spotlight)

            tween(spotlight)
        }

        if (world.debug) {
            this.spotlightHelpers = this.spotlights.map(
                (spotlight) => new Three.SpotLightHelper(spotlight)
            )

            for (const spotlightHelper of this.spotlightHelpers) {
                world.view.scene.add(spotlightHelper)
            }
        }
    }

    step = (delta: number, time: number, world: World) => {
        if (time - this.previousSpotlightAnimationTime >= 1100) {
            this.previousSpotlightAnimationTime = time
            for (const spotlight of this.spotlights) {
                tween(spotlight)
            }
        }

        Tween.update()
    }

    destroy = (world: World) => {
        for (const spotlight of this.spotlights) {
            spotlight.removeFromParent()
        }

        if (this.spotlightHelpers !== undefined) {
            for (const spotlightHelper of this.spotlightHelpers) {
                spotlightHelper.removeFromParent()
            }
        }
    }
}
