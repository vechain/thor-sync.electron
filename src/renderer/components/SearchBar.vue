<template>
    <v-toolbar height="40px" v-bind="$attrs">
        <v-btn @click.stop="onBtnClick('back')" :disabled="!opt.canGoBack" icon>
            <v-icon>arrow_back</v-icon>
        </v-btn>
        <v-btn @click.stop="onBtnClick('forward')" :disabled="!opt.canGoForward" icon>
            <v-icon>arrow_forward</v-icon>
        </v-btn>
        <v-btn @click.stop="onBtnClick('refresh')" :disabled="!opt.url" icon>
            <v-icon>refresh</v-icon>
        </v-btn>
        <v-text-field @focus="urlString = urlString || opt.url" @blur="urlString === opt.url ? urlString = '' : ''" v-model="urlString" @keyup.enter="onUrl" @change="onChange(urlString)" :placeholder="urlOrigin"></v-text-field>
        <slot />
    </v-toolbar>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from 'vue-property-decorator'
import NewWalletDialog from '@/renderer/launcher/NewWalletDialog.vue';

@Component
export default class SearchBar extends Vue {
    private urlString: string = ''

    @Prop({
        default: {
            canGoBack: false,
            canGoForward: false,
            url: ''
        }
    })
    private opt!: SearchBar.Opt

    get urlOrigin() {
        if (this.opt.url) {
            const temp = new URL(this.opt.url)
            return temp.host
        } else {
            return
        }
    }

    @Emit('change')
    onChange(str: string) {}

    @Emit('operate')
    onBtnClick(action: string) {
        this.urlString = ''
    }

    @Emit('urlRequest')
    onInoputed(url: string) { }

    onUrl() {
        try {
            const url = new URL(this.urlString)
            this.onInoputed(url.toString())
        } catch (error) {
            console.log(error)
        } finally {
            this.urlString = ''
        }
        
    }
}
</script>
