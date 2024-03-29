const workerSource = `
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
                source: \`
// === Library code ===
\${Object.entries(executionContextBindings)
    .map(([name, syncInfo]) => {
        if (syncInfo.delay === 0) {
            return \`function \${name}(...args) {
    self.postMessage(["\${name}", ...args])
}\`
        } else if (syncInfo.delay === "parameterSeconds") {
            return \`function \${name}(delay, ...args) {
    self.postMessage(["\${name}", delay, ...args])
    Atomics.wait(__syncArray__, 0, 0, delay * 1000)
}\`
        } else if (syncInfo.delay === "untilResume") {
            return \`function \${name}(...args) {
    self.postMessage(["\${name}", ...args])
    Atomics.wait(__syncArray__, 0, 0)
}\`
        } else {
            return \`function \${name}(...args) {
    self.postMessage(["\${name}", ...args])
    Atomics.wait(__syncArray__, 0, 0, \${syncInfo.delay})
}\`
        }
    })
    .join("\n")}
\n
// === User code ===
\n
\${data[1]}
\`,
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
`

const error = (name) => {
    return class extends Error {
        name = name

        constructor(message) {
            super(message)
        }
    }
}

const bindingSyncInfo = {
    say: { delay: 0 },
    wait: { delay: "parameterSeconds" },
    forward: { delay: "untilResume" },
}

const InvalidMessageReceivedFromHostApplicationError = error(
    "InvalidMessageReceivedFromHostApplicationError"
)

class UserExecutionContext {
    // bindings: Bindings

    // private worker: Worker
    // private syncBuffer: SharedArrayBuffer
    // private syncArray: Int32Array
    // private postMessage: (message: any[]) => void
    // private timeoutHandle: number | undefined
    // private resolve: ((data: any) => void) | undefined
    // private reject: ((msg: string) => void) | undefined

    // constructor(bindings: Bindings, postMessage: (message: any[]) => void) {
    constructor(bindings, postMessage) {
        this.syncBuffer = new SharedArrayBuffer(8)
        this.syncArray = new Int32Array(this.syncBuffer)

        this.bindings = bindings

        this.postMessage = postMessage

        // this.worker = null as any as Worker
        this.worker = null
        this.initWorker()

        this.worker.addEventListener("message", (e) => {
            if (this.timeoutHandle !== undefined) {
                clearTimeout(this.timeoutHandle)
            }

            if (
                typeof e.data === "object" &&
                typeof e.data[0] === "string" &&
                !e.data[0].includes("proto") &&
                this.bindings.hasOwnProperty(e.data[0])
            ) {
                // const name = e.data[0] as string
                const name = e.data[0]
                const syncInfo = this.bindings[name]
                // if (syncInfo.delay !== 0) {
                //     console.log(`Delaying ${syncInfo.delay}ms...`)
                //     setTimeout(this.resume, syncInfo.delay)
                // }
                this.postMessage(e.data)
            }

            if (this.resolve !== undefined) {
                this.resolve(e.data)
            }
        })

        this.worker.onerror = (e) => {
            if (this.timeoutHandle !== undefined) {
                clearTimeout(this.timeoutHandle)
            }

            if (this.reject !== undefined) {
                this.reject(e.message)
            }
        }
    }

    initWorker = () => {
        if (this.worker !== undefined && this.worker !== null) {
            this.worker.terminate()
        }

        this.worker = new Worker(
            URL.createObjectURL(
                new Blob([workerSource], { type: "application/javascript" })
            )
        )

        this.worker.postMessage(["init", this.bindings, this.syncBuffer])
    }

    killWorker = () => {
        this.worker.terminate()
        this.initWorker()
    }

    resume = () => {
        Atomics.store(this.syncArray, 0, 1)
        Atomics.notify(this.syncArray, 0, 1)
        // console.log(`Resumed with value ${this.syncArray[0]}`)
        Atomics.store(this.syncArray, 0, 0)
    }

    // evalAsync = (script: string, timeout = 30000) => {
    evalAsync = (script, timeout = 30000) => {
        return new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject

            this.timeoutHandle = setTimeout(() => {
                this.killWorker, reject("timeout")
            }, timeout)

            this.worker.postMessage(["eval", script])
        })
    }
}

const context = new UserExecutionContext(bindingSyncInfo, (message) => {
    return window.top?.postMessage(message)
})

window.addEventListener("message", (e) => {
    if (e.data === "resume") {
        context.resume()
    } else if (Array.isArray(e.data) && e.data[0] === "eval") {
        ;(() => context.evalAsync(e.data[1]))().then(
            () => window.top?.postMessage(["result"]),
            (error) => window.top?.postMessage(["error", error])
        )
    } else {
        throw new InvalidMessageReceivedFromHostApplicationError(
            "Invalid message received from host application."
        )
    }
})
