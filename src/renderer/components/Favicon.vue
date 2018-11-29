<template>
    <div
        v-bind="$attrs"
        v-on="$listeners"
        style="width:16px;height:16px;overflow:hidden;border-radius:2px;"
    >
        <img
            v-show="loaded"
            width="100%"
            height="100%"
            :src="src"
            @load="onUpdateLoaded(true)"
            @error="onUpdateLoaded(false)"
        >
        <v-icon
            v-show="!loaded && !!placeholder"
            style="font-size:16px;vertical-align:top;"
        >{{placeholder}}</v-icon>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Emit } from 'vue-property-decorator'

@Component
export default class Favicon extends Vue {
    @Prop(String) src!: string
    @Prop(String) placeholder!: string

    @Emit('update:loaded')
    onUpdateLoaded(val: boolean) {
        this.loaded = val
    }

    loaded = false

    @Watch('src')
    srcChanged() { this.onUpdateLoaded(false) }
}
</script>
