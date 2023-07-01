import { error } from "../helpers"
import { Bindings, bindingSyncInfo } from "./bindings"
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
    private timeoutHandle: number | undefined
    private resolve: ((data: any) => void) | undefined
    private reject: ((msg: string) => void) | undefined

    constructor(bindings: Bindings, postMessage: (message: any[]) => void) {
        this.syncBuffer = new SharedArrayBuffer(8)
        this.syncArray = new Int32Array(this.syncBuffer)

        this.bindings = bindings

        this.postMessage = postMessage

        this.worker = null as any as Worker
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
                const name = e.data[0] as string
                const syncInfo = this.bindings[name]
                // if (syncInfo.delay !== 0) {
                //     console.log(`Delaying ${syncInfo.delay}ms...`)
                //     setTimeout(this.resume, syncInfo.delay)
                // }
                console.log("call binding iframe")
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

    evalAsync = (script: string, timeout = 30000) => {
        console.log("evalIFrame")
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
    console.log("Post from iframe", message)
    return window.top?.postMessage(message)
})

window.addEventListener("message", (e) => {
    console.log(e)
    if (e.data === "resume") {
        console.log("resume")
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
