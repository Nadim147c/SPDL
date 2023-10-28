const dirs = `${__dirname}`.split(/\\|\//g)
dirs.pop()
export const projectPath = dirs.join("\\")
