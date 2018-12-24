<template>
    <v-layout py-2 row wrap style="background: rgba(128,128,0,0.05);" text-xs-center>
        <v-flex xs3 py-2 v-for="word in words" :key="word">
            <span class="text-uppercase body-2">{{word}}</span>
        </v-flex>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class MnemonicWords extends Vue {
    @Prop(Array) words!: string[]
}

</script>
