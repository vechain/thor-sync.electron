
export default class Deferred<T> implements PromiseLike<T> {
    private readonly promise: Promise<T>
    private resolver?: (v?: T) => void
    private rejecter?: (reason?: any) => void

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolver = resolve
            this.rejecter = reject
        })
    }
    public resolve(v?: T) {
        this.resolver!(v)
    }

    public reject(reason?: any) {
        this.rejecter!(reason)
    }

    public then<R1 = T, R2 = never>(
        onfulfilled?: ((value: T) => R1 | PromiseLike<R1>) | undefined | null,
        onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | undefined | null
    ) {
        return this.promise.then(onfulfilled, onrejected)
    }

    public catch<R = never>(
        onrejected?: ((reason: any) => R | PromiseLike<R>) | undefined | null
    ) {
        return this.promise.catch(onrejected)
    }
}
