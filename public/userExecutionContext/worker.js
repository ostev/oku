// import { Bindings } from "../../src/userExecutionContext/bindings"

// let safeObjects = [
//     "self",
//     "onmessage",
//     "postMessage",
//     "console", // Probably not safe, but we're in a sandboxed iframe anyway
//     "__proto__",
//     "__defineGetter__",
//     "__defineSetter__",
//     "__lookupGetter__",
//     "__lookupSetter__",
//     "constructor",
//     "hasOwnProperty",
//     "isPrototypeOf",
//     "propertyIsEnumerable",
//     "toLocaleString",
//     "toString",
//     "eval",
//     "Array",
//     "Boolean",
//     "Date",
//     "Function",
//     "Object",
//     "Promise",
//     "String",
//     "Int32Array",
//     "undefined",
//     "Infinity",
//     "isFinite",
//     "isNaN",
//     "Math",
//     "NaN",
//     "Number",
//     "parseFloat",
//     "parseInt",
//     "RegExp"
// ]

// function secure(item: any, prop: string) {
//     if (safeObjects.indexOf(prop) < 0) {
//         const descriptor = Object.getOwnPropertyDescriptor(item, prop)
//         if (descriptor && descriptor.configurable) {
//             Object.defineProperty(item, prop, {
//                 get: () => {
//                     throw new Error(`Security Exception: cannot access ${prop}`)
//                 },
//                 configurable: false
//             })
//         } else {
//             if (typeof item.prop === "function") {
//                 item.prop = () => {
//                     throw new Error(`Security Exception: cannot access ${prop}`)
//                 }
//             } else {
//                 delete item.prop
//             }
//         }
//     }
// }

// ;[self].forEach((item: any) => {
//     while (item) {
//         Object.getOwnPropertyNames(item).forEach((prop) => {
//             secure(item, prop)
//         })

//         item = Object.getPrototypeOf(item)
//     }
// })

// let executionContextBindings: Bindings | undefined = undefined
// let __syncArray__: Int32Array | undefined = undefined
let executionContextBindings = undefined
let __syncArray__ = undefined

onmessage = (e) => {
    // let data: any[] = e.data
    let data = e.data

    if (
        e.data[0] === "init" &&
        typeof e.data[1] === "object" &&
        typeof e.data[2] === "object"
    ) {
        // executionContextBindings = e.data[1] as Bindings
        executionContextBindings = e.data[1]
        __syncArray__ = new Int32Array(e.data[2])
        // __syncArray__[1] = 352
        // console.log(__syncArray__)
        // setTimeout(() => {
        //     console.log(__syncArray__)
        // }, 2000)
    } else if (e.data[0] === "eval" && typeof e.data[1] === "string") {
        // console.log("eval", e)
        // console.log(__syncArray__?.buffer)

        let workerResult = undefined
        ;(() => {
            // Remove some things from scope
            var e = undefined
            var secure = undefined
            var safeObjects = undefined
            // console.log(executionContextBindings)
            const env = {
                source: `
// === Library code ===
${Object.entries(executionContextBindings)
    .map(([name, syncInfo]) => {
        if (syncInfo.delay === 0) {
            return `function ${name}(...args) {
    self.postMessage(["${name}", ...args])
}`
        } else if (syncInfo.delay === "parameterSeconds") {
            return `function ${name}(delay, ...args) {
    self.postMessage(["${name}", delay, ...args])
    Atomics.wait(__syncArray__, 0, 0, delay * 1000)
}`
        } else if (syncInfo.delay === "untilResume") {
            return `function ${name}(...args) {
    self.postMessage(["${name}", ...args])
    Atomics.wait(__syncArray__, 0, 0)
}`
        } else {
            return `function ${name}(...args) {
    self.postMessage(["${name}", ...args])
    Atomics.wait(__syncArray__, 0, 0, ${syncInfo.delay})
}`
        }
    })
    .join("\n")}
\n
// === User code ===
\n
${data[1]}
`,
            }
            Object.freeze(env)
            // console.log(env.source)
            ;(() => {
                var data = undefined
                var executionContextBindings = undefined

                workerResult = eval(env.source)
            })()
        })()

        self.postMessage(["result", workerResult])
    }
}
