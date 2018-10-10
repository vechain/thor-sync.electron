function inject(
    dest: any,
    path: string,
    obj?: { [prop: string]: (...args: any[]) => void }
) {

    const paths = path.split('.')
    for (let i = 0; i < paths.length - 1; i++) {
        if (dest[paths[i]]) {
            dest = dest[paths[i]]
        } else {
            dest = dest[paths[i]] = {}
        }
    }
    if (obj) {
        const injects = {} as any
        // tslint:disable-next-line:forin
        for (const key in obj) {
            injects[key] = promisify(obj[key])
        }
        dest[paths[paths.length - 1]] = injects
    } else {
        delete dest[paths[paths.length - 1]]
    }
}

function promisify(fn: (...args: any[]) => void) {
    return (..._args: any[]) => {
        return new Promise((resolve, reject) => {
            fn(..._args, (err: any, result: any) => {
                if (err) {
                    // here the error should have been processed by 'serialize-error'
                    // convert it back to Error
                    const _err = new Error(err.message)
                    _err.stack = err.stack
                    return reject(_err)
                }
                resolve(result)
            })
        })
    }
}

export default inject
