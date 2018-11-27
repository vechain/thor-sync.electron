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
                style="width:56px;height:56px;overflow:hidden;position:relative;border-radius:6px 6px 6px 6px"
                class="ma-2"
                align-center
                justify-center
                :style="{'background-color':faceColor}"
            >
                <span class="white--text headline font-weight-light">{{firstChar}}</span>
                <div
                    v-show="loaded"
                    style="position:absolute;width:19px;height:19px;top:0px;right:0px;border-radius:0px 6px 0px 0px"
                >
                    <div
                        class="white"
                        style="position:absolute;width:3px;height:3px;left:0px;top:0px"
                    >
                        <div
                            style="width:100%;height:100%;border-radius:0px 3px 0px 0px"
                            :style="{'background-color':faceColor}"
                        />
                    </div>
                    <div
                        class="white"
                        style="position:absolute;width:3px;height:3px;right:0px;bottom:0px"
                    >
                        <div
                            style="width:100%;height:100%;border-radius:0px 3px 0px 0px"
                            :style="{'background-color':faceColor}"
                        />
                    </div>
                    <img
                        class="white"
                        :src="favicon"
                        width="16px"
                        height="16px"
                        style="position:absolute;top:0px;right:0px;border-radius:0px 6px 0px 6px;overflow:hidden"
                        @load="onImageLoad"
                    >
                </div>
                <div
                    :style="{'box-shadow': `${faceColor} 0px 0px 0px 0.5px inset`}"
                    style="position:absolute;left:0;right:0;top:0;bottom:0;border-radius:6px 6px 6px 6px;"
                ></div>
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
