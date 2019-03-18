<template>
    <div v-bind="$attrs" v-on="$listeners" class="app-button pa-3">
        <v-layout column align-center>
            <v-layout
                style="width:50px;height:50px;position:relative;border-radius:7px;"
                class="ma-2"
                align-center
                justify-center
                :style="{'background-color': (getFaceColor(href) && !loaded) }"
            >
                <span v-if="!loaded" class="white--text headline font-weight-light">{{firstChar}}</span>
                <div v-show="loaded">
                    <img
                        width="100%"
                        :src="src"
                        @load="onUpdateLoaded(true)"
                        @error="onUpdateLoaded(false)"
                    >
                </div>
            </v-layout>
            <div
                class="caption text-truncate font-weight-medium"
                style="width:100%;text-align:center;"
            >{{title}}</div>
        </v-layout>
        <slot/>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch, Emit } from 'vue-property-decorator'
import * as NodeUrl from 'url'
import Color from 'color'

@Component
export default class AppHubItem extends Vue {
    @Prop(String) title!: string
    @Prop(String) href!: string
    @Prop(String) src!: string

    loaded = false

    get firstChar() {
        const str = (this.title || '').trim()
        return str ? str[0].toUpperCase() : '?'
    }

    @Emit('update:loaded')
    onUpdateLoaded(val: boolean) {
        this.loaded = val
    }


    getFaceColor (val: string) {
        return Vue.filter('faceColor')(val)
    }
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
</style>

