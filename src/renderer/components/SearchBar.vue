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
        <UrlBox v-model="userInput" @update:href="gotoHref" :href="href" class="pa-1" style="flex: 1 1 auto;background-color:#fff;"/>
        <slot/>
    </v-toolbar>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from 'vue-property-decorator'
import NewWalletDialog from '@/renderer/launcher/NewWalletDialog.vue';
import UrlBox from './UrlBox.vue'

@Component({
    components: {
        UrlBox
    }
})
export default class SearchBar extends Vue {
    private href = ''
    private userInput = ''

    @Prop({
        default: {
            canGoBack: false,
            canGoForward: false,
            url: ''
        }
    })
    private opt!: SearchBar.Opt
    @Watch('opt.url')
    urlChanged(val: string) {
        this.href = val
    }

    @Emit('operate')
    onBtnClick(action: string) {
       // this.urlString = ''
    }

    gotoHref(val: string){
        this.onInoputed(val)
    }

    @Emit('urlRequest')
    onInoputed(url: string) { }
}
</script>
