<template>
    <v-btn
        v-bind="$attrs"
        v-on="$listeners"
        flat
        style="height:auto;width:100%;"
        :ripple="false"
        class="pa-2"
    >
        <v-layout column align-center>
            <v-layout
                style="width:56px;height:56px;position:relative;border-radius:7px;"
                class="ma-2"
                align-center
                justify-center
                :style="{'background-color':faceColor}"
            >
                <span class="white--text headline font-weight-light">{{firstChar}}</span>
                <div v-show="loaded" class="badge">
                    <img
                        :src="favicon"
                        width="16px"
                        height="16px"
                        style="position:absolute;top:1px;right:1px;"
                        @load="onImageLoad"
                    >
                    <div
                        style="position:absolute;top:0px;right:0px;left:-2px;bottom:-2px;border-radius:0px 7px 0px 0px;"
                        :style="{'box-shadow': `${faceColor} 0px 0px 0px 0.5px inset`}"
                    />
                </div>
            </v-layout>
            <span
                class="caption font-weight-bold text-truncate"
                style="text-transform:none;width:100%;"
            >{{title}}</span>
        </v-layout>
    </v-btn>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as UrlUtils from '@/common/url-utils'
@Component
export default class AppIcon extends Vue {
    @Prop(String) title!: string
    @Prop(String) href !: string
    @Prop(String) favicon!: string

    loaded = false

    get firstChar() {
        return this.title ? this.title[0] : '?'
    }
    get faceColor() {
        const h = hash(UrlUtils.hostnameOf(this.href || ''))
        return colors[h % colors.length]
    }

    @Watch('favicon')
    faviconChanged() {
        this.loaded = false
    }

    onImageLoad() {
        this.loaded = true
    }
}

const colors = [
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#3f51b5',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffc107',
    '#ff9800',
    '#ff5722'
]

function hash(str: string) {
    if (str.length === 0) {
        return 0
    }
    let h = 0
    for (let i = 0; i < str.length; i++) {
        h = h * 31 + str.charCodeAt(i)
        h = h % (2 ** 32)
    }
    return h
}
</script>
<style scoped>
.badge {
    position: absolute;
    right: 0;
    top: 0;
    width: 21px;
    height: 21px;
    clip-path: url(#app-button-badge);
    background-color: white;
    overflow: hidden;
}
</style>

