<template>
    <span class="label caption secondary font-weight-bold">{{nodeType}}</span>
</template>
<script lang="ts">
    import { Vue, Component, Prop } from 'vue-property-decorator'
    import { nameOfNetwork } from '@/node-configs'

    @Component
    export default class NetworkName extends Vue {
        @Prop(String)
        genesis!: string

        get nodeType() {
            return nameOfNetwork(this.genesis).toLocaleUpperCase()
        }
    }
</script>

