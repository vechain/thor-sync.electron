<template>
    <span class="label caption font-weight-bold text-uppercase" :class="classes">{{nodeType}}</span>
</template>
<script lang="ts">
    import { Vue, Component, Prop } from 'vue-property-decorator'
    import { nameOfNetwork } from '@/node-configs'

    @Component
    export default class NetworkName extends Vue {
        @Prop(String)
        genesis!: string

        get nodeType() {
            return nameOfNetwork(this.genesis)
        }

        get classes () {
            if(nameOfNetwork(this.genesis) === 'main') {
                return 'secondary lighten-2'
            }
            return 'secondary lighten-4'
        }
    }
</script>

