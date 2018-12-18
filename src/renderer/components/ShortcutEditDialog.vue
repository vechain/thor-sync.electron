<template>
    <DialogEx
        persistent
        v-model="open"
        max-width="380px"
        @action:ok="save"
        @action:cancel="open=false"
    >
        <v-card>
            <v-card-title>Shortcut</v-card-title>
            <v-card-text>
                <v-text-field autofocus ref="shortcutTitle" label="Title" v-model="arg.title"/>
                <div class="grey--text text-truncate caption" style="width:100%;">{{arg.href}}</div>
            </v-card-text>
            <v-card-actions>
                <v-btn small flat color="red" @click="remove">Remove</v-btn>
                <v-spacer/>
                <v-btn small flat @click="open=false">Cancel</v-btn>
                <v-btn small flat color="primary" @click="save">Save</v-btn>
            </v-card-actions>
        </v-card>
    </DialogEx>
</template>
<script lang="ts">
import { Vue, Mixins, Component, Watch } from 'vue-property-decorator'
import DialogHelper from '@/renderer/mixins/dialog-helper'

type Arg = {
    id: number
    title: string
    href: string
}

@Component
export default class ShortcutEditDialog extends Mixins(class extends DialogHelper<Arg, void>{ }) {
    open = false
    @Watch('open')
    openChanged() {
        if (!this.open) {
            this.result = null
        }
    }

    mounted() {
        this.open = true
        const elem = (this.$refs.shortcutTitle as Vue).$el.querySelector('input')!
        setTimeout(() => {
            elem.focus()
            elem.select()
        }, 0)
    }
    save() {
        if (!this.arg.title.trim()) {
            return
        }
        GDB.preferences.update(this.arg.id, {
            value: {
                name: this.arg.title,
                href: this.arg.href,
            }
        })
        this.open = false
    }

    remove() {
        GDB.preferences.delete(this.arg.id)
        this.open = false
    }
}
</script>
