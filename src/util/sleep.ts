import ora from "ora"

export default function sleep(sleepMS: number, intervalMS = 100) {
    if (sleepMS === 0) return
    if (intervalMS > 1000 && intervalMS < 50) throw "Interval must be between 50 to 1000"

    let remainingTime = sleepMS

    const spinner = ora({
        text: `Sleeping for ${(remainingTime / 1000).toFixed(1)} seconds`,
        color: "cyan",
        spinner: "clock",
    })
    spinner.start()

    return new Promise((resolve) => {
        const interval = setInterval(() => {
            remainingTime -= intervalMS
            spinner.text = `Sleeping for ${(remainingTime / 1000).toFixed(1)} seconds`
        }, intervalMS)

        setTimeout(() => {
            clearInterval(interval)
            spinner.stop()
            resolve(1)
        }, sleepMS)
    })
}
