import { error } from "../helpers"
import { Bindings } from "./bindings"
import UserExecutionContextWorker from "./userExecutionContextWorker?worker"

export const InvalidMessageReceivedFromHostApplicationError = error(
    "InvalidMessageReceivedFromHostApplicationError"
)

class UserExecutionContext {
    bindings: Bindings

    private worker: Worker
    private syncBuffer: SharedArrayBuffer
    private syncArray: Int32Array
    private postMessage: (message: any[]) => void

    constructor(bindings: Bindings, postMessage: (message: any[]) => void) {
        this.syncBuffer = new SharedArrayBuffer(8)
        this.syncArray = new Int32Array(this.syncBuffer)

        this.bindings = bindings

        this.postMessage = postMessage

        this.worker = null as any as Worker
        this.initWorker()
    }

    initWorker = () => {
        if (this.worker !== undefined && this.worker !== null) {
            this.worker.terminate()
        }

        this.worker = new UserExecutionContextWorker()

        this.worker.postMessage(["init", this.bindings, this.syncBuffer])
    }

    killWorker = () => {
        this.worker.terminate()
        this.initWorker()
    }

    resume = () => {
        Atomics.store(this.syncArray, 0, 1)
        Atomics.notify(this.syncArray, 0, 1)
        console.log(`Resumed with value ${this.syncArray[0]}`)
        console.log(this.syncArray.buffer)
        Atomics.store(this.syncArray, 0, 0)
    }

    evalAsync = (script: string, timeout = 30000) =>
        new Promise((resolve, reject) => {
            const handle = setTimeout(() => {
                this.killWorker, reject("timeout")
            }, timeout)

            this.worker.onmessage = (e) => {
                clearTimeout(handle)

                if (
                    typeof e.data === "object" &&
                    typeof e.data[0] === "string" &&
                    !e.data[0].includes("proto") &&
                    this.bindings.hasOwnProperty(e.data[0])
                ) {
                    const name = e.data[0] as string
                    const syncInfo = this.bindings[name]
                    // if (syncInfo.delay !== 0) {
                    //     console.log(`Delaying ${syncInfo.delay}ms...`)
                    //     setTimeout(this.resume, syncInfo.delay)
                    // }

                    this.postMessage(e.data)
                }

                resolve(e.data)
            }

            this.worker.onerror = (e) => {
                clearTimeout(handle)
                reject(e.message)
            }

            this.worker.postMessage(["eval", script])
        })
}

const context = new UserExecutionContext(
    { helloThere: { delay: 0 }, forward: { delay: "parameterSeconds" } },
    (message) => window.top?.postMessage(message)
)

window.addEventListener("message", (e) => {
    if (typeof e.data === "object" && e.data[0] === "eval") {
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
