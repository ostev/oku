import { error } from "../helpers"
import { FnBindings } from "./bindings"
import userExecutionContextIFrameScriptUrl from "./userExecutionContextIFrame?url"

export class UserExecutionContext {
    private iframe: HTMLIFrameElement | undefined
    private onError: (error: Error) => void

    bindings: FnBindings

    constructor(parent: Element, bindings: FnBindings, onError: (error: Error) => void) {
        this.onError=onError
        this.bindings = bindings
        this.initialiseIFrame(parent)
    }

    initialiseIFrame = (parent: Element) => {
        this.iframe = document.createElement("iframe")

        parent.appendChild(this.iframe)

        this.iframe.setAttribute("sandbox", "allow-scripts")
        this.iframe.setAttribute("style", "display: none;")

        this.iframe.contentWindow?.document.open()

        const script = this.iframe.contentWindow?.document.createElement(
            "script"
        ) as HTMLScriptElement
        if (import.meta.env.DEV) {
            script.setAttribute("type", "module")
        }
        script.setAttribute("src", userExecutionContextIFrameScriptUrl)
        this.iframe.contentWindow?.document.appendChild(script)

        this.iframe.contentWindow?.document.close()

        window.addEventListener("message", this.messageEventListener)

        // ;(this.iframe as HTMLIFrameElement).contentWindow?.postMessage([""], "*")
    }

    private messageEventListener = (e: MessageEvent<unknown>) => {
        if (e.source !== this.iframe?.contentWindow) {
            return
        }

        // Check that we received an array and that the program finished
        if (Array.isArray(e.data) && e.data[0] === "result") {
            // Nothing for now
        } else if (Array.isArray(e.data) && e.data[0] === "error") {
            console.error("Your code has an error! 😲 Here it is:")
            console.error(e.data[1])
            this.onError(e.data[1])
        } else if (
            Array.isArray(e.data) &&
            typeof e.data[0] === "string" &&
            !e.data[0].includes("proto") &&
            this.bindings.hasOwnProperty(e.data[0])
        ) {
            const name = e.data[0] as string
            const args = (e.data as any[]).slice(1)
            const bindingInfo = this.bindings[name]
            bindingInfo.fn(this, ...args)
        } else {
            throw new InvalidMessageReceivedFromUserExecutionContextError(
                "The user execution context iframe posted an invalid response to the host application."
            )
        }
    }

    evalAsync = async (code: string) => {
        ;(this.iframe as HTMLIFrameElement).contentWindow?.postMessage(
            ["eval", code],
            "*"
        )
    }

    destroy = () => {
        this.iframe?.remove()
        window.removeEventListener("message", this.messageEventListener)
    }

    sendMessage = (message: string) => {
        ;(this.iframe as HTMLIFrameElement).contentWindow?.postMessage(
            message,
            "*"
        )
    }

    resume = () => {
        this.sendMessage("resume")
    }
}

export const InvalidMessageReceivedFromUserExecutionContextError = error(
    "InvalidMessageReceivedFromExecutionContext"
)
