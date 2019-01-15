<template>
    <v-snackbar :value="readyToInstall && !dismissed" bottom :timeout="0" color="success">
        {{message}}
        <v-btn flat small dark @click="quitAndInstall">Update Now</v-btn>
        <v-btn dark icon @click="dismissed=true">
            <v-icon small>close</v-icon>
        </v-btn>
    </v-snackbar>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { remote } from 'electron'

@Component
export default class UpdateChecker extends Vue {
    downloaded = remote.app.EXTENSION.updateChecker.status === 'downloaded'
    newVersion = remote.app.EXTENSION.updateChecker.newVersion
    dismissed = false

    get readyToInstall() {
        return this.downloaded && !!this.newVersion
    }
    get message() {
        if (this.readyToInstall) {
            return `New version ${this.newVersion!.version} is available`
        }
        return ''
    }

    timer: any
    created() {
        this.timer = setInterval(() => {
            const { status, newVersion } = remote.app.EXTENSION.updateChecker
            this.downloaded = status === 'downloaded'
            this.newVersion = newVersion
        }, 60 * 1000)
    }

    destroyed() {
        clearInterval(this.timer)
    }

    quitAndInstall() {
        remote.app.EXTENSION.updateChecker.quitAndInstall()
    }
}
</script>
