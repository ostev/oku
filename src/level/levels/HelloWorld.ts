import { Vec3, World, getComponent, translation } from "../../World"
import { Level } from "../Level"

import roadUrl from "../../assets/road.gltf?url"
import { addPeggy } from "../../characters/peggy"

export class HelloWorld implements Level {
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
        await world.importGLTF(roadUrl, new Vec3(0, -5, 0))

        world.addEntity(
            translation(new Vec3(0, 0, 0)),
            new Set([
                {
                    kind: "listener",
                    notify: (event) => {
                        if (event.kind === "speaking") {
                            const lowercaseText = event.text.toLowerCase()
                            if (
                                lowercaseText.includes("hello") &&
                                lowercaseText.includes("world")
                            ) {
                                world.completeGoal(1)
                            } else {
                                world.completeGoal(2)
                            }
                        }
                    },
                },
            ])
        )
    }

    step = (delta: number, time: number, world: World) => {}
}
