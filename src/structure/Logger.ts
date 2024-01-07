import ora, { Ora } from "ora"
import c from "chalk"

export default class Logger {
    ora: Ora
    count?: [number, number]
    titleText: string
    verbose: boolean
    constructor(title: string, verbose: boolean, count?: [number, number]) {
        this.count = count
        this.verbose = verbose
        this.titleText = ""
        this.ora = ora({ text: "", color: "cyan", spinner: "arc" })
        this.setTitle(title)
    }

    setTitle(title: string) {
        if (!this.count) {
            this.titleText = title
            this.ora.text = title
            return
        }

        const index = c.yellow(this.count[0])
        const total = c.cyan(this.count[1])
        const text = `${index}/${total}. ${title}`
        this.titleText = text
        this.ora.text = text
    }

    start() {
        this.ora.start()
    }

    exit(message: unknown) {
        this.show(message)
        this.ora.fail()
    }

    show(message: unknown, lowPriority: boolean = false) {
        if (lowPriority && !this.verbose) return

        if (typeof message === "string") this.ora.text = `${this.titleText}\n${message}`
        else this.ora.text = `${this.titleText}\n${JSON.stringify(message)}`
    }

    succeed() {
        this.ora.text = this.titleText
        this.ora.succeed()
    }

    fail() {
        this.ora.text = this.titleText
        this.ora.fail()
    }

    warn() {
        this.ora.text = this.titleText
        this.ora.warn()
    }
}
