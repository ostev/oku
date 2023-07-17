import * as Three from "three"
import * as Tween from "three/addons/libs/tween.module.js"
import * as Rapier from "@dimforge/rapier3d"

import { Entity, Vec3, World, getComponent, translation } from "../../World"
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
        .to(
            { x: 0, y: 0, z: Math.random() * 2 - 1 },
            Math.random() * 1000 + 1000
        )
        .easing(Tween.Easing.Quadratic.Out)
        .start()
}

export class GrandFinale extends Level {
    private previousSpotlightAnimationTime: number = 0
    private spotlights: Three.SpotLight[] = []
    private spotlightHelpers: Three.SpotLightHelper[] | undefined
    private progress = {
        forward: false,
        turn: false,
        say: false,
        wait: false,
        repeat: false,
    }

    private peggy: Entity | undefined

    css = `
        canvas {
            background-image: linear-gradient(
                45deg,
                hsl(240deg 100% 20%) 0%,
                hsl(255deg 95% 24%) 21%,
                hsl(261deg 89% 27%) 30%,
                hsl(266deg 83% 32%) 39%,
                hsl(270deg 78% 36%) 46%,
                hsl(273deg 74% 40%) 54%,
                hsl(276deg 71% 45%) 61%,
                hsl(279deg 69% 49%) 69%,
                hsl(282deg 75% 53%) 79%,
                hsl(285deg 86% 57%) 100%
            );
        }
    `

    private mainGoalIsComplete = () =>
        this.progress.forward &&
        this.progress.say &&
        this.progress.turn &&
        this.progress.wait &&
        this.progress.repeat

    init = async (world: World) => {
        world.view.sun.removeFromParent()
        world.view.ambientLight.color = new Three.Color("#5e5e5e")

        world.view.setOrthographicScale(0.007)

        await world.importGLTF(stageUrl, new Vec3(0, -2, 0))

        this.peggy = (await addPeggy(world, new Vec3(1, 0, 0)))[0]

        world.addEntity(
            translation(new Vec3(0, 0, 0)),
            new Set([
                {
                    kind: "listener",
                    notify: ({ event }) => {
                        console.log("Received event", event)
                        switch (event.kind) {
                            case "forward":
                                this.progress.forward = true
                                break
                            case "speaking":
                                this.progress.say = true
                                break
                            case "turn":
                                this.progress.turn = true
                                break

                            case "wait":
                                this.progress.wait = true
                                break

                            case "repeat":
                                this.progress.repeat = true
                                break

                            case "executionComplete":
                                if (world.code !== undefined) {
                                    const cleanedCode = world.code.replace(
                                        /\s+/g,
                                        ""
                                    )

                                    const namedFunctionRegex =
                                        /let\s+(singChorus|singchorus|SINGCHORUS|SINGchorus|singCHORUS|sing|chorus|SING|CHORUS)\s*=\s*\(.*\)\s*=>\s*{[\s\S]*}/

                                    const repeatRegex =
                                        /repeat\((0x.+|0b\d(\d|_)*|\d(\d|_)*|),(.+)\)/

                                    const whileLoopRegex = /while\(.*\){.*\}/

                                    if (this.progress.say) {
                                        const match =
                                            world.code.match(namedFunctionRegex)
                                        if (match !== null) {
                                            world.completeGoal(1)
                                        }
                                    }

                                    if (this.progress.repeat) {
                                        const match =
                                            cleanedCode.match(repeatRegex)
                                        if (match !== null) {
                                            world.completeGoal(2)
                                        }
                                    }

                                    if (
                                        this.mainGoalIsComplete() &&
                                        cleanedCode.includes("if") &&
                                        cleanedCode.includes("else") &&
                                        cleanedCode.match(repeatRegex) !==
                                            null &&
                                        cleanedCode.includes(")=>{") &&
                                        cleanedCode.match(whileLoopRegex) !==
                                            null
                                    ) {
                                        world.completeGoal(3)
                                    }
                                }
                                break

                            default:
                                break
                        }
                    },
                },
            ])
        )

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
        if (
            time - this.previousSpotlightAnimationTime >=
            Math.random() * 2000 + 3000
        ) {
            this.previousSpotlightAnimationTime = time
            for (const spotlight of this.spotlights) {
                tween(spotlight)
            }
        }

        Tween.update(time)
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
