import { Vue, Component } from 'vue-property-decorator'
import cloneDeep from 'lodash.clonedeep'

const running: {
    [key: string]: {
        arg: any,
        resolve: (result: any) => void
        reject: (err: Error) => void
    }
} = {}

@Component
export default class DialogHelper<T, U> extends Vue {
    public static install(vue: typeof Vue) {
        vue.prototype.$dialog = function(dlg: { new(): DialogHelper<any, any> }, arg: any) {
            const proxy = this.$dialogProxy
            if (!proxy) {
                throw new Error('$dialogProxy not found')
            }
            return new Promise((resolve, reject) => {
                const key = proxy.add(dlg.name)
                running[key] = { arg: cloneDeep(arg), resolve, reject }
            })
        }
    }

    public arg!: T
    public data() {
        return {
            arg: running[this.$vnode.key!].arg
        }
    }

    public destroyed() {
        this.$reject(new Error('aborted'))
    }

    public $resolve(result: U) {
        this._end(undefined, result)
    }

    public $reject(err: Error) {
        this._end(err)
    }

    private _end(err?: Error, result?: U) {
        const key = this.$vnode.key!
        if (running[key]) {
            if (err) {
                running[key].reject(err)
            } else {
                running[key].resolve(result)
            }
            delete running[key]
            setTimeout(() => this.$dialogProxy && this.$dialogProxy.remove(key as string), 1000)
        }
    }
}

type ArgumentType<F> = F extends (a: infer A) => void ? A : never

declare module 'vue/types/vue' {
    export interface Vue {
        $dialogProxy?: {
            add(componentName: string): string
            remove(key: string): void
        }
        $dialog<D extends DialogHelper<any, any>>(
            dialog: { new(): D },
            arg: D['arg']
        ): Promise<ArgumentType<D['$resolve']>>
    }
}
