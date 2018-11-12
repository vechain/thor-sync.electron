<template>
    <v-hover :close-delay="0" :open-delay="50">
        <v-card
            flat
            tile
            slot-scope="{ hover }"
            v-bind="$attrs"
            v-on="$listeners"
            class="tab-button pl-2 pr-1 py-1"
            :class="{'tab-button--active': active}"
        >
            <v-img
                v-if="!!faviconURL || !!faviconFont"
                :height="16"
                :width="16"
                style="flex: 0 0 auto;overflow:hidden;border-radius:2px;"
                :src="faviconURL"
            >
                <v-layout slot="placeholder" fill-height align-center justify-center ma-0>
                    <v-icon small>{{faviconFont}}</v-icon>
                </v-layout>
            </v-img>
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
        </v-card>
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
        return 'mdi-file-plus'
    }
}
</script>
<style scoped>
.tab-button {
  border-radius: 4px 4px 0px 0px;
  overflow: hidden;
  user-select: none;
  cursor: default;
  z-index: 0;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  margin-left: 0.5px;
  margin-right: 0.5px;
  transition: background 0.15s cubic-bezier(0.25, 0.8, 0.5, 1),
    box-shadow 0.15s cubic-bezier(0.25, 0.8, 0.5, 1), transform 0.25s,
    width 0.3s, padding 0.3s;
}

.theme--light.tab-button {
  background-color: #d4d4d4;
  box-shadow: 0px 0px 0px 0px #d4d4d4;
}
.theme--dark.tab-button {
  background-color: #303030;
  box-shadow: 0px 0px 0px 0px #303030;
}

.tab-button--active {
  border-radius: 2px 2px 0px 0px;
  z-index: 1;
}

.theme--light.tab-button--active {
  box-shadow: 0px -1px 0px 2px #ffffff, 0px 0px 2px 2px rgba(0, 0, 0, 0.3);
  background-color: #ffffff;
}
.theme--dark.tab-button--active {
  box-shadow: 0px -1px 0px 2px #212121, 0px 0px 2px 2px rgba(0, 0, 0, 0.3);
  background-color: #212121;
}

.theme--light.tab-button:not(.tab-button--active):hover {
  background-color: #e0e0e0;
}
.theme--dark.tab-button:not(.tab-button--active):hover {
  background-color: #282828;
}
</style>

