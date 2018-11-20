<template>
    <v-menu
        content-class="no-transition access-history-panel"
        class="access-history-panel-inline"
        v-bind="$attrs"
        v-on="$listeners"
        :value="value"
        @input="$emit('input', $event)"
    >
        <div slot="activator" @keydown="onKeyDown">
            <slot name="activator"/>
        </div>
        <v-card v-if="rows.length>0">
            <v-list dense :style="{width:width +'px'}">
                <v-list-tile
                    v-for="(row,i) in rows"
                    :key="row.href"
                    @click="select(row)"
                    :class="{'v-list__tile--highlighted': i===listIndex}"
                >
                    <v-layout align-center>
                        <v-img :src="row.favicon" :height="16" :width="16" style="flex:0 0 auto"/>
                        <span class="mx-2 text-truncate" style="flex:0 0 auto;">{{row.title}}</span>
                        <v-spacer/>
                        <span
                            class="mx-2 caption grey--text text-truncate"
                            style="flex:0 1 auto;"
                        >{{row.href}}</span>
                    </v-layout>
                </v-list-tile>
            </v-list>
        </v-card>
        <v-card v-else :style="{width:width +'px'}">
            <v-card-text>No suggestion</v-card-text>
        </v-card>
    </v-menu>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Emit, Mixins } from 'vue-property-decorator'
import { Entities } from '@/renderer/database'
import * as _ from 'lodash'
import AccessHistory from '../mixin/access-history'

@Component
export default class AccessHistoryPanel extends Mixins(AccessHistory) {
    rows: Entities.History[] = []
    listIndex = -1
    @Prop(Boolean) value!: boolean
    @Prop(String) keyword!: string
    @Prop(Number) width !: number

    @Watch('value')
    valueChanged() {
        this.listIndex = -1
    }

    @Watch('keyword')
    keywordChanged(val: string) {
        this.listIndex = -1
        this.debouncedQuery()
    }

    @Emit('update:selection')
    updateSelection(val: Entities.History) { }
    @Emit('select')
    select(val: Entities.History) { }

    onKeyDown(ev: KeyboardEvent) {
        if (!this.value) {
            return
        }
        if ([keyCodes.down, keyCodes.up, keyCodes.tab].indexOf(ev.keyCode) >= 0) {
            ev.stopPropagation()
            ev.preventDefault()

            let index = this.listIndex
            let len = this.rows.length
            if (ev.keyCode === keyCodes.down) {
                index = Math.min(index + 1, len - 1)
            } else if (ev.keyCode === keyCodes.up) {
                if (index > 0) {
                    index--
                }
            } else if (ev.keyCode === keyCodes.tab) {
                if (len > 0) {
                    index = (index + 1) % len
                }
            }

            if (index !== this.listIndex) {
                this.listIndex = index
                const item = this.rows[index]
                if (item) {
                    this.updateSelection(item)
                }
            }
        }
    }

    debouncedQuery!: () => void
    created() {
        this.debouncedQuery = _.debounce(() => {
            const keyword = this.keyword
            if (keyword.length > 0) {
                this.queryHistory(keyword)
                    .then(rows => {
                        if (rows.length < 500) {
                            this.rows = rows.sort((a, b) => {
                                return (b.lastAccessTime + b.accessCount * 3600 * 24 * 1000) -
                                    (a.lastAccessTime + a.accessCount * 3600 * 24 * 1000)
                            }).slice(0, 10)
                        } else {
                            this.rows = rows.slice(0, 10)
                        }
                        this.listIndex = -1
                    })
            } else {
                this.rows = []
                this.listIndex = -1
            }
        }, 50)
    }

}
const keyCodes = {
    enter: 13,
    tab: 9,
    delete: 46,
    esc: 27,
    space: 32,
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    end: 35,
    home: 36,
    del: 46,
    backspace: 8,
    insert: 45,
    pageup: 33,
    pagedown: 34
}
</script>
<style scoped>
.access-history-panel-inline >>> div {
  height: 100%;
  width: 100%;
}
.no-transition {
  transition: all 0s;
}
.access-history-panel.v-menu__content {
  border-radius: 0px 0px 6px 6px;
  max-width: unset;
}
</style>
