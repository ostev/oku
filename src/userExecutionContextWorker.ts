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

onmessage = (e) => {
    let data: string = e.data
    let workerResult = null
    ;(() => {
        var e = null // remove "e" from execution context
        workerResult = eval(data)
    })()

    self.postMessage(workerResult)
}
