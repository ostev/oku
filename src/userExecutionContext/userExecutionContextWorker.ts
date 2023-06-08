import { Bindings } from "./bindings"

let safeObjects = [
    "self",
    "onmessage",
    "postMessage",
    "console", // Probably not safe, but we're in a sandboxed iframe anyway
    "__proto__",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
    "constructor",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toLocaleString",
    "toString",
    "eval",
    "Array",
    "Boolean",
    "Date",
    "Function",
    "Object",
    "Promise",
    "String",
    "Int32Array",
    "undefined",
    "Infinity",
    "isFinite",
    "isNaN",
    "Math",
    "NaN",
    "Number",
    "parseFloat",
    "parseInt",
    "RegExp"
]

function secure(item: any, prop: string) {
    if (safeObjects.indexOf(prop) < 0) {
        const descriptor = Object.getOwnPropertyDescriptor(item, prop)
        if (descriptor && descriptor.configurable) {
            Object.defineProperty(item, prop, {
                get: () => {
                    throw new Error(`Security Exception: cannot access ${prop}`)
                },
                configurable: false
            })
        } else {
            if (typeof item.prop === "function") {
                item.prop = () => {
                    throw new Error(`Security Exception: cannot access ${prop}`)
                }
            } else {
                delete item.prop
            }
        }
    }
}

;[self].forEach((item: any) => {
    while (item) {
        Object.getOwnPropertyNames(item).forEach((prop) => {
            secure(item, prop)
        })

        item = Object.getPrototypeOf(item)
    }
})

let executionContextBindings: Bindings | undefined = undefined
let __syncArray__: Int32Array | undefined = undefined

function __sync__() {
    Atomics.wait(
        __syncArray__ as Int32Array,
        0,
        (__syncArray__ as Int32Array)[0]
    )
}

onmessage = (e) => {
    let data: any[] = e.data

    if (
        e.data[0] === "init" &&
        typeof e.data[1] === "object" &&
        typeof e.data[2] === "object"
    ) {
        executionContextBindings = e.data[1] as Bindings
        __syncArray__ = new Int32Array(e.data[2])
    } else if (e.data[0] === "eval" && typeof e.data[1] === "string") {
        let workerResult = undefined
        ;(() => {
            // Remove some things from scope
            var e = undefined
            var secure = undefined
            var safeObjects = undefined
            const env = {
                source: `
                    // === Library code ===
                    ${Object.entries(executionContextBindings as Bindings)
                        .map(([name, syncInfo]) => {
                            ;`function ${name}() {
                                __sync__()
                            }`
                        })
                        .join("\n\n")}
                    \n\n
                    // === User code ===
                    \n
                    ${data[1]}
                    `
            }
            Object.freeze(env)
            ;(() => {
                var data = undefined
                var executionContextBindings = undefined

                workerResult = eval(env.source)
            })()
        })()

        self.postMessage(["result", workerResult])
    }
}
