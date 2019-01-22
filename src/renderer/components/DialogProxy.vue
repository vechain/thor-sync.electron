<template>
    <div>
        <template v-for="dialog in dialogs">
            <component :is="dialog.name" :key="dialog.key"/>
        </template>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

let nextId = 1

@Component
export default class DialogProxy extends Vue {
    dialogs: {
        key: string
        name: string | Vue
    }[] = []

    created() {
        if (Vue.prototype.$dialogProxy) {
            LOG.warn('DialogProxy:', '$dialogProxy already exist')
        } else {
            Vue.prototype.$dialogProxy = this
        }
    }
    destroyed() {
        if (Vue.prototype.$dialogProxy === this) {
            delete Vue.prototype.$dialogProxy
        }
    }

    add(component: string | Vue) {
        const key = `dialog-${nextId++}`
        this.dialogs.push({
            key,
            name: component
        })
        return key
    }
    remove(key: string) {
        this.dialogs = this.dialogs.filter(d => d.key != key)
    }
}

</script>
