import * as Three from "three"
import * as Tween from "three/addons/libs/tween.module.js"
import * as Rapier from "@dimforge/rapier3d"

import {
    Collider,
    Entity,
    Mesh,
    Vec3,
    World,
    getComponent,
    translation,
} from "../../World"
import { Level, addParcel } from "../Level"

import houseUrl from "../../assets/house.gltf?url"
import { makeXYZGUI } from "../../View"
import { $, TweenHelper } from "../../helpers"

export class DeliveryDriverPartIV extends Level {
    private gate: Entity | undefined
    private gateText: Entity | undefined
    private isGateOpen = false
    private gateStartingY = 0
    private gateTextStartingY = 0

    private boundaryPosition: Vec3 = new Vec3(0.3, -0.7, -1.4)
    private boundaryDimensions: Vec3 = new Vec3(2, 0.75, 0.17)
    private boundaryShape: Rapier.Shape = new Rapier.Cuboid(
        this.boundaryDimensions.x / 2,
        this.boundaryDimensions.y / 2,
        this.boundaryDimensions.z / 2
    )
    private boundaryDebugEntity: Entity | undefined

    private receptaclePosition: Vec3 = new Vec3(1.6, -0.9, -2.8)
    private receptacleDimensions: Vec3 = new Vec3(1.164, 0.5, 0.48)
    private receptacleShape: Rapier.Shape = new Rapier.Cuboid(
        this.receptacleDimensions.x / 2,
        this.receptacleDimensions.y / 2,
        this.receptacleDimensions.z / 2
    )
    private receptacleDebugEntity: Entity | undefined

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
            const gateTo = {
                y: this.isGateOpen
                    ? this.gateStartingY + 3
                    : this.gateStartingY,
            }

            new Tween.Tween(this.gate.transform.position)
                .to(gateTo, duration)
                .easing(easing)
                .onUpdate(({ y }) => {
                    if (this.gate !== undefined) {
                        const position = this.gate.transform.position

                        const { collider } = getComponent(
                            this.gate,
                            "collider"
                        ) as Collider
                        collider.setTranslation(
                            new Vec3(position.x, y, position.z)
                        )
                    }
                })
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
        }, Math.random() * 2000 + 3000)
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
            const position = this.gate.transform.position
            this.gateStartingY = position.y
        }

        if (this.gateText !== undefined) {
            this.gateTextStartingY = this.gateText.transform.position.y
        }

        setTimeout(this.updateGate, Math.random() * 5_000 + 400)

        if (world.debug) {
            this.boundaryDebugEntity = world.addEntity(
                translation(this.boundaryPosition),
                new Set([
                    {
                        kind: "mesh",
                        mesh: new Three.Mesh(
                            new Three.BoxGeometry(
                                this.boundaryDimensions.x,
                                this.boundaryDimensions.y,
                                this.boundaryDimensions.z
                            ),
                            new Three.MeshStandardMaterial({ color: "orange" })
                        ),
                    },
                ])
            )

            this.receptacleDebugEntity = world.addEntity(
                translation(this.receptaclePosition),
                new Set([
                    {
                        kind: "mesh",
                        mesh: new Three.Mesh(
                            new Three.BoxGeometry(
                                this.receptacleDimensions.x,
                                this.receptacleDimensions.y,
                                this.receptacleDimensions.z
                            ),
                            new Three.MeshStandardMaterial({ color: "purple" })
                        ),
                    },
                ])
            )
        }

        if (world.debug && world.view.gui !== undefined) {
            {
                const folder = world.view.gui.addFolder("Boundary")
                makeXYZGUI(
                    folder,
                    this.boundaryPosition,
                    "Position",
                    this.updateBoundaryPosition,
                    5
                )
                makeXYZGUI(
                    folder,
                    this.boundaryDimensions,
                    "Dimensions",
                    this.updateBoundaryDimensions,
                    2
                )
                folder.open()
            }
            {
                const folder = world.view.gui.addFolder("Receptacle")
                makeXYZGUI(
                    folder,
                    this.receptaclePosition,
                    "Position",
                    () => {
                        if (
                            this.receptacleDebugEntity !== undefined &&
                            world.debug
                        ) {
                            this.receptacleDebugEntity.transform.position =
                                this.receptaclePosition
                        }
                    },
                    5
                )
                makeXYZGUI(
                    folder,
                    this.receptacleDimensions,
                    "Dimensions",
                    () => {
                        if (
                            this.receptacleDebugEntity !== undefined &&
                            world.debug
                        ) {
                            const { mesh: object3D } = getComponent(
                                this.receptacleDebugEntity,
                                "mesh"
                            ) as Mesh
                            const mesh = object3D as Three.Mesh
                            mesh.geometry.dispose()
                            mesh.geometry = new Three.BoxGeometry(
                                this.receptacleDimensions.x,
                                this.receptacleDimensions.y,
                                this.receptacleDimensions.z
                            )
                        }

                        this.receptacleShape = new Rapier.Cuboid(
                            this.receptacleDimensions.x / 2,
                            this.receptacleDimensions.y / 2,
                            this.receptacleDimensions.z / 2
                        )
                    },
                    2
                )
                folder.open()
            }
        }

        await addParcel(world, new Vec3(0.3, 0, 0))
    }

    step = (delta: number, time: number, world: World) => {
        if (
            world.physics.intersectionWithShape(
                this.boundaryPosition,
                new Three.Quaternion(),
                this.boundaryShape
            )
        ) {
            if (world.code !== undefined) {
                const cleanedCode = world.code.toLowerCase().replace(/\s+/g, "")
                if (
                    cleanedCode.match(
                        /while\(readDistance\(\)<\d+\){\s+.*\s+}/
                    ) !== null
                ) {
                    world.completeGoal(1)
                }
            }
        }

        if (
            world.physics.intersectionWithShape(
                this.receptaclePosition,
                new Three.Quaternion(),
                this.receptacleShape
            )
        ) {
            if (world.debug) {
                $("#other").textContent = "Intersect"
            }
            if (world.code !== undefined) {
                const cleanedCode = world.code.toLowerCase().replace(/\s+/g, "")
                if (
                    cleanedCode.match(
                        /while\(readDistance\(\)<\d+\){\s+.*\s+}/
                    ) !== null &&
                    cleanedCode.includes("pickUp()") &&
                    cleanedCode.includes("placeDown")
                ) {
                    world.completeGoal(2)
                }
            }
        } else if (world.debug) {
            $("#other").textContent = "No intersect"
        }

        Tween.update(time)
    }

    destroy = () => {}

    private updateBoundaryPosition = () => {
        if (this.boundaryDebugEntity !== undefined) {
            this.boundaryDebugEntity.transform.position = this.boundaryPosition
        }
    }

    private updateBoundaryDimensions = () => {
        if (this.boundaryDebugEntity !== undefined) {
            const { mesh: object3D } = getComponent(
                this.boundaryDebugEntity,
                "mesh"
            ) as Mesh
            const mesh = object3D as Three.Mesh
            mesh.geometry.dispose()
            mesh.geometry = new Three.BoxGeometry(
                this.boundaryDimensions.x,
                this.boundaryDimensions.y,
                this.boundaryDimensions.z
            )
        }

        this.boundaryShape = new Rapier.Cuboid(
            this.boundaryDimensions.x / 2,
            this.boundaryDimensions.y / 2,
            this.boundaryDimensions.z / 2
        )
    }
}
