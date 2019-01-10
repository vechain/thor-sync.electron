<template>
    <div v-bind="$attrs" v-on="$listeners" class="app-button pa-3">
        <v-layout column align-center>
            <v-layout
                style="width:50px;height:50px;position:relative;border-radius:7px;"
                class="ma-2"
                align-center
                justify-center
                :style="{'background-color':faceColor}"
            >
                <span class="white--text headline font-weight-light">{{firstChar}}</span>
                <div v-show="loaded" class="badge">
                    <Favicon
                        :src="favicon"
                        style="position:absolute;top:1px;right:1px;"
                        @update:loaded="loaded=$event"
                    />
                    <div
                        style="position:absolute;top:0px;right:0px;left:-2px;bottom:-2px;border-radius:0px 7px 0px 0px;"
                        :style="{'box-shadow': `${faceColor} 0px 0px 0px 0.5px inset`}"
                    />
                </div>
            </v-layout>
            <div class="caption text-truncate font-weight-medium" style="width:100%;text-align:center;">{{title}}</div>
        </v-layout>
        <slot/>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as UrlUtils from '@/common/url-utils'
@Component
export default class AppButton extends Vue {
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
.app-button {
    cursor: default;
    position: relative;
}

.app-button::before {
    border-radius: 3px;
    position: absolute;
    content: "";
    left: 0px;
    bottom: 0px;
    right: 0px;
    top: 0px;
    background-color: currentColor;
    opacity: 0;
    transition: all 0.3s;
}

.app-button:hover::before {
    opacity: 0.15;
}

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

