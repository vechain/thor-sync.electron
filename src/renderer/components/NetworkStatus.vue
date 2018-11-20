<template>
    <v-layout align-center class="caption" :style="styleObject">
        <v-icon small style="font-size:120%;color:inherit" class="mr-1">mdi-hexagon-slice-6</v-icon>
        <b>{{name}}</b>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { remote } from 'electron'
type Status = Connex.Thor.Status

@Component
export default class NetworkStatus extends Vue {
    name = remote.getCurrentWebContents().getWebPreferences().siteConfig!.name
    @State chainStatus!: Status
    syncing = false
    timer?: any
    created() {
        let bestNum = this.chainStatus.head.number
        let idelTimes = 0
        this.timer = setInterval(() => {
            if (bestNum === this.chainStatus.head.number) {
                idelTimes++
                if (idelTimes > 6) {
                    this.syncing = false
                }
            } else {
                bestNum = this.chainStatus.head.number
                idelTimes = 0
                this.syncing = true
            }
        }, 5000)
    }
    destroyed() {
        clearInterval(this.timer)
    }

    get styleObject() {
        if (this.chainStatus.progress === 1) {
            return {
                color: 'rgba(0,192,0,0.9)'
            }
        } else {
            if (this.syncing) {
                return {
                    color: 'rgba(192,96,0,0.9)'
                }
            } else {
                return {
                    color: 'rgba(192,0,0,0.9)'
                }
            }
        }
    }
}
</script>
