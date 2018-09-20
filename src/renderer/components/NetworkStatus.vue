<template>
    <v-chip :color="syncProgress === 1 ? 'green' : 'red'" disabled text-color="white" small>
        {{network}}
    </v-chip>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { remote } from 'electron'
import Deferred from '@/base/deferred'
import { setInterval, clearInterval } from 'timers';

@Component
export default class NetworkStatus extends Vue {
    network = remote
        .app
        .backend
        .getSiteConfig(remote.getCurrentWebContents().id)!.name

    progress = THOR.status.progress

    created() {
        const timer = setInterval(() => {
            this.progress = THOR.status.progress
        }, 5000)

        this.beforeDestroy = () => {
            clearInterval(timer)
        }
    }
}
</script>
