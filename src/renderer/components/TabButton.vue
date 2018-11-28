<template>
    <v-hover :close-delay="0" :open-delay="50">
        <v-layout slot-scope="{ hover }" v-bind="$attrs" v-on="$listeners" class="tab-button">
            <div style="position:relative;width:100%;height:100%" class="px-1">
                <div v-show="!active" class="bg" :class="{'bg--hilight': hover}"/>
                <div class="active-bg" :style="{opacity: active ? 1: 0}">
                    <div class="left-corner"/>
                    <div class="right-corner"/>
                </div>
                <v-layout
                    align-center
                    style="position:relative;width:100%;height:100%;overflow:hidden;z-index:1;"
                >
                    <Favicon
                        v-show="!!faviconURL || !!faviconFont"
                        :src="faviconURL"
                        :icon="faviconFont"
                        style="flex:0 0 auto;"
                    />
                    <span class="mx-2 caption text-truncate">{{title}}</span>
                    <v-spacer/>
                    <v-btn
                        flat
                        small
                        class="ma-0"
                        @click.stop="close"
                        style="height:auto;width:auto;min-width:auto;padding:1px"
                        :ripple="false"
                        :style="{opacity: hover? 1: 0,visibility: hover? 'visible': 'hidden' }"
                    >
                        <v-icon small>close</v-icon>
                    </v-btn>
                </v-layout>
            </div>
        </v-layout>
    </v-hover>
</template>  
<script lang="ts">
import { Vue, Component, Prop, Emit, Watch } from 'vue-property-decorator'

@Component
export default class TabButton extends Vue {
    @Prop(Boolean) active !: boolean
    @Prop({ default: '', type: String }) title !: string
    @Prop({ default: '', type: String }) favicon !: string
    @Emit('close')
    close() { }

    get faviconURL() {
        if (this.favicon.indexOf(':') >= 0) {
            return this.favicon
        }
        return ''
    }

    get faviconFont() {
        if (this.favicon.indexOf(':') < 0) {
            return this.favicon
        }
        return ''
    }
}
</script>
<style scoped>
.tab-button {
    user-select: none;
    cursor: default;
    margin-left: 1px;
    transition: width 0.3s, transform 0.3s;
}

.bg {
    background-color: #d4d4d4;
    position: absolute;
    left: 0px;
    top: 0px;
    right: 0px;
    bottom: 0px;
    border-radius: 4px 4px 0px 0px;
}

.active-bg {
    background-color: white;
    position: absolute;
    left: -3px;
    top: -3px;
    right: -3px;
    bottom: 0px;
    border-radius: 4px 4px 0px 0px;
    z-index: 1;
    box-shadow: 0px 1px 2px 0.5px rgba(0, 0, 0, 0.12);
    transition: opacity 0.15s;
}

.left-corner {
    position: absolute;
    left: -4px;
    bottom: 0px;
    width: 5px;
    height: 4px;
    clip-path: url(#left-corner);
    background-color: inherit;
}
.right-corner {
    position: absolute;
    right: -4px;
    bottom: 0px;
    width: 5px;
    height: 4px;
    clip-path: url(#right-corner);
    background-color: inherit;
}

.bg--hilight {
    background-color: #e0e0e0 !important;
}

.darwin.blur .tab-button {
    color: rgba(0, 0, 0, 0.6);
}
.darwin.blur .bg {
    background-color: #e0e0e0;
}
</style>

