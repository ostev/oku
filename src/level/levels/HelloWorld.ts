import { Vec3, World } from "../../World"
import { Level } from "../Level"

import roadUrl from "../../assets/road.gltf?url"

export class HelloWorld implements Level {
    css = `
        canvas {
            background-image: linear-gradient(
  45deg,
  hsl(240deg 100% 20%) 0%,
  hsl(262deg 90% 27%) 22%,
  hsl(271deg 78% 35%) 33%,
  hsl(278deg 70% 43%) 42%,
  hsl(285deg 66% 50%) 51%,
  hsl(291deg 85% 58%) 59%,
  hsl(291deg 85% 69%) 67%,
  hsl(292deg 86% 77%) 75%,
  hsl(294deg 87% 85%) 82%,
  hsl(295deg 88% 93%) 90%,
  hsl(0deg 0% 100%) 99%
);
        }
    `

    init = async (world: World) => {
        await world.importGLTF(roadUrl, new Vec3(0, -5, 0))
    }

    step = (delta: number, time: number, world: World) => {}
}
