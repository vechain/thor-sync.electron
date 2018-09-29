<template>
    <v-layout py-2 row wrap style="background: rgba(128,128,0,0.05);" text-xs-center>
        <v-flex xs3 py-2 v-for="word in words" :key="word">
            <span>{{word}}</span>
        </v-flex>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Model, Watch } from 'vue-property-decorator'
import { cry } from 'thor-devkit'

@Component
export default class MnemonicWords extends Vue {
    @Model('change') value !: string[]

    readonly words = cry.mnemonic.generate()

    created() {
        this.enforceValue()
    }
    @Watch('value')
    enforceValue() {
        if (this.words !== this.value) {
            this.$emit('change', this.words)
        }
    }
}
</script>
<style lang="css" scoped>
span {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
}
</style>
