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
        name: string
    }[] = []

    created() {
        if (Vue.prototype.$dialogProxy) {
            console.warn("$dialogProxy already exist")
        } else {
            Vue.prototype.$dialogProxy = this
        }
    }
    destroyed() {
        if (Vue.prototype.$dialogProxy === this) {
            delete Vue.prototype.$dialogProxy
        }
    }

    add(componentName: string) {
        const key = `dialog-${nextId++}`
        this.dialogs.push({
            key,
            name: componentName
        })
        return key
    }
    remove(key: string) {
        this.dialogs = this.dialogs.filter(d => d.key != key)
    }
}

</script>
