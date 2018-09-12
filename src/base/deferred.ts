export class Deferred<T> {
    public readonly promise: Promise<T>
    private resolver?: (v?: T) => void
    constructor() {
        this.promise = new Promise<T>(resolve => {
            this.resolver = resolve
        })
    }
    public resolve(v?: T) {
        if (this.resolver) {
            this.resolver(v)
            return
        }
        process.nextTick(() => {
            this.resolve(v)
        })
    }
}
