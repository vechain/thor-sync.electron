<template>
    <input
        type="text"
        v-bind="$attrs"
        v-on="$listeners"
        @input="emitUdpateInput($event.target.value)"
        :value="displayText"
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
    @Model('goto', { type: String }) url!: string
    @Emit('goto')
    emitGoto(val: string) { }


    focused = false
    inputShadow = ''

    @Prop(String) input!: string
    @Emit('update:input')
    emitUdpateInput(val: string) {
        this.inputShadow = val
    }
    @Watch('input')
    inputChanged(val: string) {
        this.inputShadow = val
    }

    @Watch('url')
    urlChanged(val: string) {
        if (this.focused) {
            this.emitUdpateInput(val)
        } else {
            this.emitUdpateInput('')
        }
    }

    get displayText() {
        if (this.focused) {
            return this.inputShadow
        } else {
            return this.inputShadow || NodeUrl.parse(this.url).hostname || this.url
        }
    }

    onFocused() {
        this.focused = true;
        if (!this.inputShadow) {
            this.emitUdpateInput(this.url)
        }
        Vue.nextTick(() => {
            Vue.nextTick(() => {
                (this.$el as HTMLInputElement).select()
            })
        })
    }

    onBlur() {
        this.focused = false
        if (this.inputShadow === this.url) {
            this.emitUdpateInput('')
        }
    }

    onEnter() {
        if (!this.inputShadow) {
            return
        }
        this.emitGoto(normalizeUrl(this.inputShadow))
        this.$el.blur()
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
