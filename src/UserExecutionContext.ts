import UserExecutionContextWorker from "./userExecutionContextWorker?worker"

export class UserExecutionContext {
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
