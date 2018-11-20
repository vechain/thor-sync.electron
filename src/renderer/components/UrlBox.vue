<template>
    <input
        type="text"
        v-bind="$attrs"
        v-on="listeners"
        :value="displayText"
        @focus="onFocused"
        @blur="onBlur"
        @keydown.enter="onEnter"
    >
</template>
<script lang="ts">
import { Vue, Component, Watch, Emit, Model, Prop } from 'vue-property-decorator'
import * as NodeUrl from 'url'


@Component
export default class UrlBox extends Vue {
    @Model('input', { type: String, default: '' }) value !: string
    @Emit('input')
    updateInput(val: string) {
        this.shadowValue = val
    }
    @Watch('value')
    valueChanged(val: string) {
        this.shadowValue = val
    }

    @Prop(String) href!: string
    @Emit('update:href')
    updateHref(val: string) {
        this.shadowHref = val
    }
    @Watch('href')
    hrefChanged(val: string) {
        this.shadowHref = val
    }

    focused = false
    shadowValue = ''
    shadowHref = ''
    // for input method
    composing = false

    get prettyHost() {
        const host = NodeUrl.parse(this.shadowHref).host || ''
        if (host.startsWith('www.')) {
            return host.slice(4)
        }
        return host
    }

    get displayText() {
        this.shadowValue
        this.shadowHref
        if (this.focused) {
            if (this.element.value) {
                // prevent falling back to url
                return this.shadowValue || this.shadowHref
            }
            return ''
        } else {
            return this.shadowValue || this.prettyHost || this.shadowHref
        }
    }

    get listeners() {
        return {
            ...this.$listeners,
            input: (ev: any) => {
                this.updateInput(ev.target.value)
            }
        }
    }

    onFocused() {
        this.focused = true
        setTimeout(() => this.element.select(), 0)
    }

    onBlur() {
        this.focused = false
        this.composing = false
    }

    onEnter() {
        if (this.composing) {
            return
        }
        const text = this.element.value
        if (!text) {
            return
        }

        this.updateHref(normalizeUrl(text))
        this.updateInput('')
        this.$el.blur()
    }

    get element() {
        return this.$el as HTMLInputElement
    }

    mounted() {
        this.$el.addEventListener('compositionstart', () => this.composing = true)
        this.$el.addEventListener('compositionend', () => this.composing = false)
    }
}


function normalizeUrl(str: string) {
    let url = NodeUrl.parse(str)
    if (url.protocol === 'file:' || url.hostname) {
        return NodeUrl.format(url)
    }

    url = NodeUrl.parse('http://' + str)
    if (/^[a-z0-9]{1,61}(?:\.[a-z]{2,})+$/i.test(url.hostname || '')) {
        return NodeUrl.format(url)
    }
    return `https://www.google.com/search?q=${encodeURIComponent(str)}`
}

</script>
