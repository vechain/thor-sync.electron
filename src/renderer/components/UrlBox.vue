<template>
    <input
        type="text"
        v-bind="$attrs"
        v-on="$listener"
        v-model="inputValue"
        :readonly="!focused"
        @focus="onFocused"
        @blur="onBlur"
        @keyup.enter="onEnter"
    >
</template>
<script lang="ts">
import { Vue, Component, Watch, Emit, Model } from 'vue-property-decorator'
import * as NodeUrl from 'url'
@Component
export default class UrlBox extends Vue {
    @Model('goto', { type: String }) url!: string
    @Emit('goto')
    emitGoto(val: string) { }

    @Watch('url')
    valueChanged(val: string) {
        if (!this.focused) {
            this.inputValue = this.hostName
        }
    }

    inputValue = ''

    focused = false

    onFocused() {
        this.focused = true;
        if (!this.inputValue || this.inputValue === this.hostName) {
            this.inputValue = this.url
        }
        Vue.nextTick(() => {
            (this.$el as HTMLInputElement).select()
        })
    }

    onBlur() {
        this.focused = false
        if (!this.inputValue || this.inputValue === this.url) {
            this.inputValue = this.hostName
        }
    }

    onEnter() {
        if (!this.inputValue) {
            return
        }
        if (this.inputValue !== this.url) {
            this.emitGoto(normalizeUrl(this.inputValue))
        }
        this.$el.blur()
    }

    get hostName() {
        return NodeUrl.parse(this.url).hostname || this.url
    }
}


function normalizeUrl(str: string) {
    let url = NodeUrl.parse(str)
    if (url.hostname) {
        return NodeUrl.format(url)
    }

    url = NodeUrl.parse('http://' + str)
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
        .test(url.hostname || '')) {
        return NodeUrl.format(url)
    }
    return `https://www.google.com/search?q=${encodeURIComponent(str)}`
}
</script>
