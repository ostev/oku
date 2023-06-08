import UserExecutionContextWorker from "./userExecutionContextWorker?worker"

class UserExecutionContext {
    worker: Worker

    constructor() {
        this.worker = new UserExecutionContextWorker()
    }

    killWorker = () => {
        this.worker.terminate()
        this.worker = new UserExecutionContextWorker()
    }

    evalAsync = (script: string, timeout = 2000) =>
        new Promise((resolve, reject) => {
            let handle = setTimeout(() => {
                this.killWorker, reject("timeout")
            }, timeout)

            this.worker.postMessage(script)

            this.worker.onmessage = (e) => {
                clearTimeout(handle)
                resolve(e.data)
            }

            this.worker.onerror = (e) => {
                clearTimeout(handle)
                reject(e.message)
            }
        })
}

const context = new UserExecutionContext()

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
