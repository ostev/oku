// import { LevelNode } from "../../level"

// export interface Patch {
//     index: number
//     newNode: LevelNode
// }

// export interface Diff {
//     patched: Patch[]
//     added: LevelNode[]
//     removed: number[]
// }

// function deepEquality(x: Record<string, any>, y: Record<string, any>): boolean {
//     const ok = Object.keys,
//         tx = typeof x,
//         ty = typeof y
//     return x && y && tx === "object" && tx === ty
//         ? ok(x).length === ok(y).length &&
//               ok(x).every((key) => deepEquality(x[key], y[key]))
//         : x === y
// }

// export const diff = (
//     oldNodes: LevelNode[],
//     currentNodes: LevelNode[]
// ): Diff => {
//     const added: LevelNode[] = []
//     const removed: number[] = []
//     const patched: Patch[] = []

//     for (let i = 0; i < Math.max(currentNodes.length, oldNodes.length); i++) {
//         const currentNode = currentNodes[i]
//         const oldNode = oldNodes[i]

//         if (oldNode === undefined) {
//             added.push(currentNode)
//         } else if (currentNode === undefined) {
//             removed.push(i)
//         } else {
//             if (currentNode.kind !== oldNode.kind) {
//                 patched.push({ index: i, newNode: currentNode })
//             } else if (deepEquality(currentNode, oldNode)) {
//                 // Do nothing
//             } else {
//                 patched.push({ index: i, newNode: currentNode })
//             }
//         }
//     }

//     return { added, removed, patched }
// }
