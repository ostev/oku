import { Bindings } from "./bindings"
import UserExecutionContextWorker from "./userExecutionContextWorker?worker"

class UserExecutionContext {
    bindings: Bindings

    private worker: Worker
    private syncBuffer: SharedArrayBuffer
    private syncArray: Int32Array
    private postMessage: (message: any[]) => void

    constructor(bindings: Bindings, postMessage: (message: any[]) => void) {
        this.syncBuffer = new SharedArrayBuffer(32)
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
        this.syncArray[0] += 1
    }

    evalAsync = (script: string, timeout = 2000) =>
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
                    if (syncInfo.delay !== 0) {
                        setTimeout(this.resume, syncInfo.delay)
                    }

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

const context = new UserExecutionContext({}, (message) =>
    window.top?.postMessage(message)
)

window.addEventListener("message", (e) => {
    if (typeof e.data === "object" && e.data[0] === "eval") {
        ;(() => context.evalAsync(e.data[1]))().then(
            () => window.top?.postMessage(["result"]),
            (error) => window.top?.postMessage(["error", error])
        )
    } else {
        throw new InvalidMessageReceivedFromHostApplicationError()
    }
})

class InvalidMessageReceivedFromHostApplicationError extends Error {
    constructor(message?: string | undefined) {
        super(message)
        this.name = "InvalidMessageReceivedFromHostApplication"
    }
}
