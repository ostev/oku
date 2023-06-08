import userExecutionContextIFrameScriptUrl from "./userExecutionContextIFrame?url"

export class UserExecutionContext {
    private iframe: HTMLIFrameElement | undefined

    constructor(parent: Element) {
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
        if (import.meta.env.DEV) {
            script.setAttribute("type", "module")
        }
        script.setAttribute("src", userExecutionContextIFrameScriptUrl)
        this.iframe.contentWindow?.document.appendChild(script)

        this.iframe.contentWindow?.document.close()
    }

    evalAsync = async (code: string) => {
        ;(this.iframe as HTMLIFrameElement).contentWindow?.postMessage(
            ["eval", code],
            "*"
        )
        window.addEventListener("message", (e) => {
            // Check that we received an array and that the program finished
            if (typeof e.data === "object" && e.data[0] === "result") {
                console.log("Code finished running.")
            } else if (typeof e.data === "object" && e.data[0] === "error") {
                console.error("Your code has an error! 😲 Here it is:")
                console.error(e.data[1])
            } else {
                throw new InvalidMessageReceivedFromUserExecutionContextError(
                    "The user execution context iframe posted an invalid response to the host application."
                )
            }
        })
    }
}

export class InvalidMessageReceivedFromUserExecutionContextError extends Error {
    constructor(message?: string | undefined) {
        super(message)
        this.name = "InvalidMessageReceivedFromExecutionContext"
    }
}
