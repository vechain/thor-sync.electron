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
import * as UrlUtils from '@/common/url-utils'


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
            return this.shadowValue ||
                UrlUtils.prettyForDisplay(this.shadowHref) ||
                this.shadowHref
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

        this.updateHref(text)
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

</script>
