import * as Three from "three"
import * as Rapier from "@dimforge/rapier3d"

import {
    Entity,
    Mesh,
    Vec3,
    World,
    getComponent,
    translation,
} from "../../World"
import { Level, addParcel } from "../Level"

import pathUrl from "../../assets/path.gltf?url"
import { benchmark } from "../../benchmark"
import { $ } from "../../helpers"
import { makeXYZGUI } from "../../View"

export class DeliveryDriverPartI extends Level {
    private receptaclePosition: Vec3 = new Rapier.Vector3(0.02, -0.63, -3)
    private receptacleDimensions: Vec3 = new Rapier.Vector3(0.6, 0.1, 0.6)
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

    init = async (world: World) => {
        world.view.setOrthographicScale(0.005)

        await world.importGLTF(pathUrl, new Vec3(0.2, -1, -2))

        const parcelPos = new Vec3(0.1, 0, Math.random() * -1.2 - 1)
        addParcel(world, parcelPos)

        if (world.debug) {
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
                            new Three.MeshStandardMaterial({ color: "orange" })
                        ),
                    },
                ])
            )
        }

        if (world.debug && world.view.gui !== undefined) {
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

    step = (delta: number, time: number, world: World) => {
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
            world.completeGoal(1)
        } else {
            if (world.debug) {
                $("#other").textContent = "No intersect"
            }
        }
    }

    destroy = () => {}
}
