<template>
    <v-hover :close-delay="0" :open-delay="50">
        <v-card
            flat
            tile
            slot-scope="{ hover }"
            v-bind="$attrs"
            v-on="$listeners"
            class="tab-button pl-2 pr-1 py-1"
            :class="{'tab-button--selected': isSelected}"
        >
            <v-img
                :height="16"
                :width="16"
                style="flex: 0 0 auto;overflow:hidden;border-radius:2px;"
                :src="iconURL"
            >
                <v-layout slot="placeholder" fill-height align-center justify-center ma-0>
                    <v-progress-circular indeterminate color="primary"/>
                </v-layout>
            </v-img>
            <span
                class="mx-2"
                style="overflow:hidden;text-overflow:ellipsis;white-space: nowrap"
            >{{title}}</span>
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
import { Vue, Component, Prop, Emit } from 'vue-property-decorator'

@Component
export default class TabButton extends Vue {
    @Prop(Object) value!: TabButton.Value
    @Emit('close')
    close() { }

    get isSelected() {
        return this.value && this.value.selected
    }
    get title() {
        return this.value ? (this.value.title || this.value.url) : ''
    }
    get iconURL() {
        return this.value ? this.value.iconURL : ''
    }

}
</script>
<style scoped>
.tab-button {
  border-radius: 2px 2px 0px 0px;
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
    box-shadow 0.15s cubic-bezier(0.25, 0.8, 0.5, 1), transform 0.25s;
}

.theme--light.tab-button {
  background-color: #d4d4d4;
  box-shadow: 0px 0px 0px 0px #d4d4d4;
}
.theme--dark.tab-button {
  background-color: #303030;
  box-shadow: 0px 0px 0px 0px #303030;
}

.tab-button--selected {
  border-radius: 0.5px 0.5px 0px 0px;
  z-index: 1;
}

.theme--light.tab-button--selected {
  box-shadow: 0px 0px 0px 3px #ffffff, 0px 1px 2px 2px rgba(0, 0, 0, 0.3);
  background-color: #ffffff;
}
.theme--dark.tab-button--selected {
  box-shadow: 0px 0px 0px 3px #212121, 0px 1px 2px 2px rgba(0, 0, 0, 0.3);
  background-color: #212121;
}

.theme--light.tab-button:not(.tab-button--selected):hover {
  background-color: #e0e0e0;
}
.theme--dark.tab-button:not(.tab-button--selected):hover {
  background-color: #282828;
}
</style>

