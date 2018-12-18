<template>
    <div>
        <template v-for="dialog in dialogs">
            <component :is="dialog.name" :key="dialog.key"/>
        </template>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class DialogProxy extends Vue {
    dialogs: {
        name: string
        key: string
    }[] = []

    created() {
        BUS.$on('add-dialog', (data: { name: string, key: string }) => {
            this.dialogs.push(data)
        })
        BUS.$on('remove-dialog', (key: string) => {
            this.dialogs = this.dialogs.filter(d => d.key != key)
        })
    }
}
</script>
