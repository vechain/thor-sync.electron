<template>
    <OverlayedMenu left offset-y v-model="opened" :close-on-content-click="false">
        <slot slot="activator" name="activator"/>
        <v-card width="280">
            <v-list dense>
                <template v-for="(item,i) in items">
                    <v-divider v-show="!item.invisible" v-if="item.divider" :key="i+'_d'"/>
                    <v-list-tile
                        v-show="!item.invisible"
                        :key="i"
                        @click="opened=false;item.action()"
                        :disabled="!!item.disabled"
                    >
                        {{item.label}}
                        <v-spacer/>
                        <span
                            class="text-capitalize"
                            style="font-family: 'Roboto Mono'"
                        >{{prettyKeys(item.keys)}}</span>
                    </v-list-tile>
                </template>
            </v-list>
        </v-card>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import Mousetrap from 'mousetrap'
import 'mousetrap/plugins/global-bind/mousetrap-global-bind'

@Component
export default class WindowMenu extends Vue {
    opened = false
    @Prop(Array) items!: WindowMenu.Item[]

    created() {
        this.bindKeys()
    }

    unbindKeys?: () => void

    @Watch('items')
    bindKeys() {
        if (this.unbindKeys) {
            this.unbindKeys()
        }

        const keys: string[] = []
        this.items.forEach(i => {
            if (i.disabled) {
                return
            }
            if (i.keys.length > 0) {
                Mousetrap.bindGlobal(i.keys, (ev, combo) => {
                    if (this.opened || !this.isModaling()) {
                        ev.preventDefault()
                        ev.stopPropagation()
                        this.opened = false
                        i.action()
                    }
                })
                keys.push(...i.keys)
            }
        })
        this.unbindKeys = () => Mousetrap.unbind(keys)
    }

    isModaling() {
        return !!document.querySelector('.v-overlay--active')
    }


    prettyKeys(keys: string[]) {
        if (process.platform === 'darwin') {
            return keys.join(' ')
                .replace('command+', '⌘')
                .replace('option+', '⌥')
                .replace('shift+', '⇧')
                .replace('ctrl+', '⌃')
        }
        return keys.join(' ')

    }
}
</script>
