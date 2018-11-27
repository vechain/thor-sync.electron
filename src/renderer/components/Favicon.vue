<template>
    <div
        v-bind="$attrs"
        v-on="$listeners"
        style="display:inline-block;width:16px;height:16px;overflow:hidden;border-radius:2px;"
    >
        <img v-show="!icon && loaded" width="100%" height="100%" :src="src" @load="onImageLoad">
        <v-icon
            v-show="icon || !loaded"
            style="font-size:16px;vertical-align:top;"
        >{{icon || 'mdi-file-outline'}}</v-icon>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Favicon extends Vue {
    @Prop(String) src!: string
    @Prop(String) icon!: string

    loaded = false

    @Watch('src')
    srcChanged() { this.loaded = false }

    onImageLoad() { this.loaded = true }
}
</script>
