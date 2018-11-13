<template>
    <div style="position:relative" @click="onClick">
        <v-icon style="font-size:95%">mdi-lock</v-icon>
        <v-icon
            v-show="!secure"
            color="error"
            style="position:absolute;left:0;top:0;right:0;bottom:0;font-size:95%"
        >mdi-close</v-icon>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { remote } from 'electron'

@Component
export default class CertIndicator extends Vue {
    @Prop(Object) cert!: Electron.CertificateVerifyProcRequest

    get secure() { return this.cert.verificationResult === 'net::OK' }

    onClick() {
        let message
        if (this.secure) {
            message = `Securely accessing '${this.cert.hostname}'`
        } else {
            message = `Certificate from '${this.cert.hostname}' is broken!`
        }
        remote.dialog
            .showCertificateTrustDialog(
                remote.getCurrentWindow(), {
                    certificate: this.cert.certificate,
                    message
                }, () => { })
    }
}
</script>

