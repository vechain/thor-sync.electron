const errorClasses: { [name: string]: { new(msg: string): Error } } = {}

// remake error which will look good in browser
export function remakeError(err: Error) {
    let cls = errorClasses[err.name]
    if (!cls) {
        // tslint:disable-next-line:no-eval
        cls = eval(`()=> class ${err.name} extends global.Error {
            constructor(message) {
                super(message)
                this.name= '${err.name}'
                this.stack = undefined
            }
        }`)()
        errorClasses[err.name] = cls
    }
    return new cls(err.message)
}
