import * as Three from "three"
import * as Rapier from "@dimforge/rapier3d"

import { Vec3, World, getComponent, translation } from "../../World"
import { Level, addTestCube } from "../Level"

import parkUrl from "../../assets/park.gltf?url"
import { addPeggy } from "../../characters/peggy"
import { vec3Distance } from "../../maths"

export class GreetingOthers implements Level {
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
        world.view.setOrthographicScale(0.007)

        const parkPosition = new Vec3(1.5, -1, -1.5)
        await world.importGLTF(parkUrl, parkPosition)

        const peggyPosition = new Vec3(0, -1, -2.5)
        await addPeggy(world, peggyPosition)

        world.addEntity(
            translation(peggyPosition),
            new Set([
                {
                    kind: "listener",
                    notify: ({ event, source }) => {
                        if (event.kind === "speaking") {
                            console.log("Heard", event)
                            const distance = vec3Distance(
                                source.position,
                                peggyPosition
                            )
                            console.log("Distance: ", distance)

                            if (distance <= 1) {
                                console.log("Complete 1")
                                world.completeGoal(1)
                            }
                        }
                    },
                },
            ])
        )

        const arnoldPosition = new Vec3(3.5, 0, 0.5)

        world.addEntity(
            translation(arnoldPosition),
            new Set([
                {
                    kind: "listener",
                    notify: ({ event, source }) => {
                        if (event.kind === "speaking") {
                            console.log("Arnold heard", event)
                            const distance = vec3Distance(
                                source.position,
                                arnoldPosition
                            )
                            console.log("Distance from Arnold: ", distance)

                            if (distance <= 1) {
                                console.log("Complete 2")
                                world.completeGoal(2)
                            }
                        }
                    },
                },
                // {
                //     kind: "mesh",
                //     mesh: new Three.Mesh(
                //         new Three.BoxGeometry(1, 1, 1),
                //         new Three.MeshStandardMaterial({ color: "white" })
                //     ),
                // },
            ])
        )
    }

    step = (delta: number, time: number, world: World) => {}

    destroy = () => {}
}
