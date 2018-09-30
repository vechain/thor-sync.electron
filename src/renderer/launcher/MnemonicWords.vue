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

    readonly words = generateWords()

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

function generateWords() {
    for (; ;) {
        // to avoid duplicated words
        const words = cry.mnemonic.generate()
        const map: { [i: string]: any } = []
        if (words.every(w => {
            if (map[w]) {
                return false
            }
            map[w] = 1
            return true
        })) {
            return words
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
