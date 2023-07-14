import * as Three from "three"
import * as Tween from "three/addons/libs/tween.module.js"
import * as Rapier from "@dimforge/rapier3d"

import { Entity, Vec3, World, getComponent, translation } from "../../World"
import { Level } from "../Level"

import houseUrl from "../../assets/house.gltf?url"

export class DeliveryDriverPartII extends Level {
    private gate: Entity | undefined
    private gateText: Entity | undefined
    private isGateOpen = false
    private gateStartingY = 0
    private gateTextStartingY = 0

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

    tween = () => {
        if (this.gate !== undefined && this.gateText !== undefined) {
            const duration = Math.random() * 100 + 2000
            const easing = Tween.Easing.Quadratic.Out

            new Tween.Tween(this.gate.transform.position)
                .to(
                    {
                        y: this.isGateOpen
                            ? this.gateStartingY + 3
                            : this.gateStartingY,
                    },
                    duration
                )
                .easing(easing)
                .start()
            new Tween.Tween(this.gateText.transform.position)
                .to(
                    {
                        y: this.isGateOpen
                            ? this.gateTextStartingY + 3
                            : this.gateTextStartingY,
                    },
                    duration
                )
                .easing(easing)
                .start()
        }
    }

    private updateGate = () => {
        setTimeout(() => {
            this.isGateOpen = !this.isGateOpen
            this.tween()
            this.updateGate()
        }, Math.random() * 4000 + 6000)
    }

    init = async (world: World) => {
        world.view.setOrthographicScale(0.005)
        world.view.sun.position.set(0.6, 3, 3.2)

        const entities = await world.importGLTF(houseUrl, new Vec3(-2, -1, 0.2))
        this.gate = entities.find(
            ({ label }) => label !== undefined && label.includes("MoveableGate")
        )
        this.gateText = entities.find(
            ({ label }) =>
                label !== undefined && label.includes("GateWarningText")
        )

        if (this.gate !== undefined) {
            this.gateStartingY = this.gate.transform.position.y
        }

        if (this.gateText !== undefined) {
            this.gateTextStartingY = this.gateText.transform.position.y
        }

        if (Math.random() > 0.4) {
            setTimeout(this.updateGate, Math.random() * 10_000)
        } else {
            this.updateGate()
        }

        world.addEntity(
            translation(new Vec3(0, 0, 0)),
            new Set([
                {
                    kind: "listener",
                    notify: ({ event }) => {
                        if (world.code !== undefined) {
                            const cleanedCode = world.code.replace(/\s+/g, "")

                            if (event.kind === "speaking") {
                                const lowercaseText = event.text.toLowerCase()
                                if (
                                    lowercaseText.includes(
                                        "5 is not less than three"
                                    ) &&
                                    cleanedCode.includes("if(5>3)")
                                ) {
                                    world.completeGoal(1)
                                }
                            } else if (
                                (event.kind === "forward" ||
                                    event.kind === "turn") &&
                                cleanedCode.includes("readDistance()") &&
                                cleanedCode.includes("if(distance<1)")
                            ) {
                                world.completeGoal(2)
                            } else if (
                                event.kind === "executionComplete" &&
                                cleanedCode.includes("readDistance()") &&
                                cleanedCode.includes("if(distance>1)")
                            ) {
                                world.completeGoal(3)
                            }
                        }
                    },
                },
            ])
        )
    }

    step = (delta: number, time: number, world: World) => {
        Tween.update(time)
    }

    destroy = () => {}
}
