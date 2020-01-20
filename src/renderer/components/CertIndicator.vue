<template>
    <v-icon
        style="font-size:100%;"
        @click="onClick"
        :color="secure?'':'red'"
    >{{secure? 'mdi-lock': 'mdi-lock-question'}}</v-icon>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { remote } from 'electron'
import errorMap from '../net-error-list'

@Component
export default class CertIndicator extends Vue {
    @Prop(Object) cert!: Electron.ProcRequest

    get secure() {
        return this.cert.verificationResult === 'net::OK'
    }

    onClick() {
        let message
        if (this.secure) {
            message = `Securely accessing '${this.cert.hostname}'`
        } else {
            const err = errorMap.get(this.cert.errorCode) || {
                name: '',
                desc: ''
            }
            message = `Connection is not secure!
                ${this.cert.verificationResult}
                ${err.desc}`
        }
        remote.dialog.showCertificateTrustDialog(
            remote.getCurrentWindow(),
            {
                certificate: this.cert.certificate,
                message
            }
        )
    }
}
</script>

