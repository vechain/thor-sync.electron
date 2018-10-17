import { } from 'vue-router'

declare module 'vue-router/types/router' {
    interface VueRouter {
        history: {
            index: number
            stack: any[]
        }
    }
}
