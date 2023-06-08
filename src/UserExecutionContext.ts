import UserExecutionContextWorker from "./userExecutionContextWorker?worker"
import userExecutionContextIFrameScriptUrl from "./userExecutionContextIFrame?url"

export class UserExecutionContext {
    private worker: Worker
    private iframe: HTMLIFrameElement | undefined

    constructor(parent: Element) {
        this.worker = new UserExecutionContextWorker()

        this.initialiseIFrame(parent)
    }

    initialiseIFrame = (parent: Element) => {
        this.iframe = document.createElement("iframe")

        parent.appendChild(this.iframe)

        this.iframe.setAttribute("sandbox", "allow-scripts")

        this.iframe.contentWindow?.document.open()

        let script = this.iframe.contentWindow?.document.createElement(
            "script"
        ) as HTMLScriptElement
        script.setAttribute("src", userExecutionContextIFrameScriptUrl)
        this.iframe.contentWindow?.document.appendChild(script)

        this.iframe.contentWindow?.document.close()
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
