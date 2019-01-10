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
        <v-card v-if="items.length>0">
            <v-list dense :style="{width:width +'px'}">
                <v-list-tile
                    tag="div"
                    v-for="(item,i) in items"
                    :key="item.href"
                    @click.stop
                    @mousedown="select(item)"
                    :class="{'v-list__tile--highlighted': i===listIndex}"
                >
                    <v-layout align-center>
                        <Favicon
                            :src="item.favicon"
                            placeholder="mdi-link-variant"
                            style="flex:0 0 auto"
                        />
                        <span class="mx-2 text-truncate">{{item.title}}</span>
                        <v-spacer/>
                        <span class="mx-2 caption grey--text text-truncate">{{item.href}}</span>
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
import { Vue, Component, Prop, Watch, Emit } from 'vue-property-decorator'
import debounce from 'lodash.debounce'
import * as AccessRecords from '../access-records'

@Component
export default class AccessHistoryPanel extends Vue {
    items: AccessHistoryPanel.Item[] = []
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
    updateSelection(val: AccessHistoryPanel.Item) { }
    @Emit('select')
    select(val: AccessHistoryPanel.Item) { }

    onKeyDown(ev: KeyboardEvent) {
        if (keyCodes.enter === ev.keyCode) {
            // here stop propagate keydown to v-menu, since v-menu will prevent enter key,
            // which will break keypress.enter handling in activator slot
            ev.stopPropagation()
            return
        }
        if (!this.value) {
            return
        }
        if ([keyCodes.down, keyCodes.up, keyCodes.tab].indexOf(ev.keyCode) >= 0) {
            ev.stopPropagation()
            ev.preventDefault()

            let index = this.listIndex
            let len = this.items.length
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
                const item = this.items[index]
                if (item) {
                    this.updateSelection(item)
                }
            }
        }
    }

    debouncedQuery!: () => void
    created() {
        this.debouncedQuery = debounce(() => {
            const keyword = this.keyword
            if (keyword.length > 0) {
                AccessRecords.query(keyword)
                    .then(rows => {
                        if (this.value && keyword === this.keyword) {
                            if (rows.length < 50) {
                                rows = rows.sort((a, b) => {
                                    return b.accessCount - a.accessCount
                                }).slice(0, 10)
                            } else {
                                rows = rows.slice(0, 10)
                            }
                            const items: AccessHistoryPanel.Item[] = []
                            if (rows.length === 1) {
                                rows[0].pages.forEach(p => items.push({
                                    href: p.href,
                                    title: p.title,
                                    favicon: p.favicon,
                                }))
                            } else {
                                rows.forEach(row => {
                                    const p0 = row.pages[0]
                                    items.push({
                                        href: p0.href,
                                        title: p0.title,
                                        favicon: p0.favicon,
                                    })
                                })
                            }
                            this.items = items
                            this.listIndex = -1
                        }
                    })
            } else {
                if (this.value) {
                    this.items = []
                    this.listIndex = -1
                }
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
