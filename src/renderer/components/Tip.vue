<template>
    <div class="caption pa-2" v-bind="$attrs" style="position:relative;">
        <div class="tip-background" :class="type"/>
        <v-layout align-start row style="position:relative">
            <v-icon small class="mr-1" style="color:currentColor">{{iconString}}</v-icon>
            <div >
                <slot/>
            </div>
        </v-layout>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Tip extends Vue {
    @Prop(String) icon!: string
    @Prop(String) type !: 'warning' | 'error' | 'info'

    get iconString() {
        return this.icon || 'mdi-alert-circle-outline'
    }
}
</script>
<style scoped>
.tip-background {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  opacity: 0.5;
}
</style>

