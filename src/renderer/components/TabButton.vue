<template>
    <v-hover :close-delay="0" :open-delay="50">
        <v-layout
            slot-scope="{ hover }"
            v-bind="$attrs"
            v-on="$listeners"
            class="tab-button"
            :style="{'z-index': active?1:0}"
        >
            <div
                class="pl-2 pr-1 bg"
                :class="{'bg--hilight': hover}"
                style="position:relative;width:100%;height:100%"
            >
                <div class="active-bg" :style="{opacity: active ? 1: 0}"/>
                <v-layout
                    align-center
                    style="position:relative;width:100%;height:100%;overflow:hidden;"
                >
                    <Favicon
                        v-show="iconLoaded || !!placeholder"
                        :src="favicon"
                        :placeholder="placeholder"
                        style="flex:0 0 auto;"
                        @update:loaded="iconLoaded=$event"
                    />
                    <span class="mx-1 caption text-truncate">{{title}}</span>
                    <v-spacer/>
                    <v-btn
                        flat
                        small
                        class="ma-0"
                        @mouseup.native.stop="close"
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
    @Prop(String) title !: string
    @Prop(String) favicon !: string
    @Prop(String) placeholder !: string

    iconLoaded = false

    @Emit('close')
    close() { }
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
    border-radius: 5px 5px 0px 0px;
    transition: background 0.15s;
}

.bg--hilight {
    background-color: #dddddd !important;
}

.active-bg {
    background-color: white;
    position: absolute;
    left: -3px;
    top: -3px;
    right: -3px;
    bottom: 0px;
    border-radius: 5px 5px 0px 0px;
    filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.15));
    transition: opacity 0.15s;
}
.active-bg::before {
    position: absolute;
    content: "";
    left: -5px;
    bottom: 0px;
    width: 6px;
    height: 5px;
    clip-path: url(#left-corner);
    background-color: inherit;
}
.active-bg::after {
    position: absolute;
    content: "";
    right: -5px;
    bottom: 0px;
    width: 6px;
    height: 5px;
    clip-path: url(#right-corner);
    background-color: inherit;
}

.blur .tab-button {
    color: rgba(0, 0, 0, 0.6);
}
.blur .bg {
    background-color: #e0e0e0;
}
</style>

