<template>
    <div>
        <component ref="builtin" :is="_builtinClass" :href="href" :nav="nav" v-on="$listeners"/>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Model, Emit } from 'vue-property-decorator'
import BuiltinBase, { builtinClass } from './Builtin.vue'


@Component
export default class Launcher extends Vue {
    @Prop(String) href!: string
    @Prop(Object) nav!: WebView.Nav

    builtin!: BuiltinBase
    _builtinClass!: typeof BuiltinBase

    beforeCreate() {
        this._builtinClass = builtinClass()
    }

    mounted() {
        this.builtin = this.$refs.builtin as any
    }
}
</script>
