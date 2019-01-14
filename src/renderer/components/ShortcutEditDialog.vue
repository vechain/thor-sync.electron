<template>
    <DialogEx
        persistent
        v-model="open"
        max-width="400px"
        @action:ok="save"
        @action:cancel="open=false"
    >
        <v-card>
            <v-card-title class="subheading">Shortcut</v-card-title>
            <v-card-text>
                <v-text-field v-focus label="Title" v-model="arg.title"/>
                <div class="grey--text text-truncate" style="width:100%;">{{arg.href}}</div>
            </v-card-text>
            <v-divider/>
            <v-card-actions>
                <v-btn small flat color="red" @click="remove">Remove</v-btn>
                <v-spacer/>
                <v-btn small flat @click="open=false">Cancel</v-btn>
                <v-btn small flat class="primary" @click="save">Save</v-btn>
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
            this.$resolve(undefined)
        }
    }

    mounted() {
        this.open = true
    }
    save() {
        if (!this.arg.title.trim()) {
            return
        }
        GDB.shortcuts.update(this.arg.id, {
            title: this.arg.title,
            href: this.arg.href,
        }).catch(err => LOG.warn('ShortcutEditDialog', 'save error', err))
        this.open = false
    }

    remove() {
        GDB.shortcuts.delete(this.arg.id)
            .catch(err => LOG.warn('ShortcutEditDialog', 'remove error', err))
        this.open = false
    }
}
</script>
