<template>
    <v-menu
        content-class="no-transition access-history-panel"
        class="access-history-panel-inline"
        v-bind="$attrs"
        v-on="$listeners"
        :value="value"
        @input="$emit('input', $event)"
    >
        <div
            slot="activator"
            @keydown.down.prevent.stop="onDownKey"
            @keydown.up.prevent.stop="onUpKey"
            @keydown.tab.prevent.stop="onTabKey"
        >
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

    onDownKey() {
        this.listIndex = Math.min(this.listIndex + 1, this.rows.length - 1)
        if (this.listIndex < this.rows.length) {
            this.updateSelection(this.rows[this.listIndex])
        }
    }
    onUpKey() {
        if (this.listIndex < 0) {
            return
        }

        this.listIndex = Math.max(this.listIndex - 1, 0)
        if (this.listIndex < this.rows.length) {
            this.updateSelection(this.rows[this.listIndex])
        }
    }
    onTabKey() {
        if (this.rows.length > 0) {
            this.listIndex = (this.listIndex + 1) % this.rows.length
            this.updateSelection(this.rows[this.listIndex])
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
                    })
            } else {
                this.rows = []
            }
        }, 50)
    }

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
