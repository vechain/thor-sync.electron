<template>
    <input
        type="text"
        v-bind="$attrs"
        v-on="listeners"
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

    get displayText() {
        if (this.focused) {
            const text = this.shadowValue || this.shadowHref
            if (this.element.value) {
                // prevent falling back to url
                return text
            }
            return ''
        } else {
            return this.shadowValue || NodeUrl.parse(this.shadowHref).hostname || this.shadowHref
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

        this.updateHref(normalizeUrl(text))
        this.updateInput('')
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
    if (/^[a-z0-9]{1,61}(?:\.[a-z]{2,})+$/i.test(url.hostname || '')) {
        return NodeUrl.format(url)
    }
    return `https://www.google.com/search?q=${encodeURIComponent(str)}`
}

</script>
