import { Vue, Component } from 'vue-property-decorator'
import cloneDeep from 'lodash.clonedeep'

const argsMap: {
    [key: string]: {
        arg: any,
        resolve: (result: any) => void
    }
} = {}

let nextKey = 1

@Component
export default class DialogHelper<T, U> extends Vue {
    public static install(vue: typeof Vue) {
        vue.dialog = (dialog, arg) => {
            const key = `dialog-${nextKey++}`
            return new Promise(resolve => {
                argsMap[key] = { arg, resolve }
                BUS.$emit('add-dialog', { name: dialog.name, key })
            })
        }
    }

    public arg!: T
    private _result: U | null = null

    public set result(val: U | null) {
        this._result = val
        this.emitResult()
    }
    public get result() { return this._result }

    public created() {
        this.arg = cloneDeep(argsMap[this.$vnode.key!].arg)
    }

    public destroyed() {
        this.emitResult()
    }

    private emitResult() {
        const key = this.$vnode.key!
        if (argsMap[key]) {
            argsMap[key].resolve(this.result)
            delete argsMap[key]
            setTimeout(() => BUS.$emit('remove-dialog', key), 1000)
        }
    }
}


declare module 'vue/types/vue' {
    export interface VueConstructor {
        dialog<D extends DialogHelper<any, any>>(
            dialog: { new(): D },
            arg: D['arg']
        ): Promise<D['result']>
    }
}
