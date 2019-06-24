<template>
    <DialogEx :contentClass="arg.contentClass" v-model="show" max-width="420px">
        <v-card :class="arg.customClass">
            <v-card-title class="subheading">{{arg.title}}</v-card-title>
            <v-card-text>
                <div>{{arg.content}}</div>
            </v-card-text>
            <v-card-actions></v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import DialogHelper from '../mixins/dialog-helper'
type Arg = {
    title: string,
    content: string,
    contentClass?: string
}

@Component
export default class ContenDialog extends Mixins(class extends DialogHelper<Arg, void>{ }) {
    show = false
    @Watch('show')
    showChanged(val: boolean) {
        if (!val) {
            this.$resolve(undefined)
        }
    }

    mounted() {
        this.show = true
    }
}
</script>
