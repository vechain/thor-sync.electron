<template>
    <input
        type="text"
        v-bind="$attrs"
        v-on="$listeners"
        :value="displayText"
        @input="emitUdpateInput($event.target.value)"
        @focus="onFocused"
        @blur="onBlur"
        @keyup.enter="onEnter"
    >
</template>
<script lang="ts">
import { Vue, Component, Watch, Emit, Model, Prop } from 'vue-property-decorator'
import * as NodeUrl from 'url'

@Component
export default class UrlBox extends Vue {
    //v-model
    @Model('goto', { type: String, default: '' }) url!: string
    @Emit('goto')
    emitGoto(val: string) {
        this.shadowUrl = val
    }

    @Watch('url')
    urlChanged(val: string) {
        this.shadowUrl = val
    }

    // input.sync
    @Prop({ type: String, default: '' }) input!: string
    @Emit('update:input')
    emitUdpateInput(val: string) {
        this.shadowInput = val
    }

    @Watch('input')
    inputChanged(val: string) {
        this.shadowInput = val
    }

    focused = false
    shadowInput = ''
    shadowUrl = ''

    get displayText() {
        if (this.focused) {
            if (!this.element.value) {
                // prevent falling back to url
                return ''
            }
            return this.shadowInput || this.shadowUrl
        } else {
            return this.shadowInput || NodeUrl.parse(this.shadowUrl).hostname || this.shadowUrl
        }
    }

    onFocused() {
        this.focused = true
        Vue.nextTick(() => {
            this.element.select()
        })
    }

    onBlur() {
        this.focused = false
    }

    onEnter() {
        const text = this.element.value
        if (!text) {
            return
        }

        this.emitGoto(normalizeUrl(text))
        this.emitUdpateInput('')
        this.$el.blur()
    }

    get element() {
        return this.$el as HTMLInputElement
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
