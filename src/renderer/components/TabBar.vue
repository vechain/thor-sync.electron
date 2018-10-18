<template>
    <div class="sync-tab-bar">
        <v-tabs slider-color="#37474F" class="cus-v-tabs" show-arrows color="#f5f5f5" left height="35px"
            v-model="tab">
            <v-tab dark :class="{'active-tab': tab === index}" class="cus-tab-item" v-for="(item, index) in tabs"
                :key="index" @dblclick.stop.prevent>
                <div>
                    <template v-if="item.iconUrl">
                        <img :src="item.iconUrl">
                    </template>
                        <div class="tab-title text-truncate">{{item.title || 'New tab'}}</div>
                        <v-btn dark @click.stop.prevent="popClose(index)" icon class="tab-close">
                            <v-icon>close</v-icon>
                        </v-btn>
                </div>
            </v-tab>
        </v-tabs>
        <v-btn class="sync-add-tab" @dblclick.stop.prevent @click="addTab" icon>
            <v-icon>
                add
            </v-icon>
        </v-btn>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from 'vue-property-decorator'

@Component
export default class TabBar extends Vue {
    @Prop({ default: 0 })
    private value!: number | null

    private tab: number | null = this.value

    @Prop({ default: [] })
    private tabs!: TabBar.Item[]

    @Watch('tab')
    tabChange(newVal: number | null) {
        this.updateValue(newVal)
    }
    @Watch('value')
    onValueChange(val: number | null) {
        this.tab = val
    }

    @Emit('input')
    updateValue(val: number | null) {}

    @Emit('close')
    popClose(index: number) {
        const isCurrent = index === this.tab
        this.$nextTick(() => {
            if (this.tab === this.tabs.length) {
                this.tab = this.tabs.length - 1
            }

            if (this.tabs.length === 0) {
                this.tab = null
            }
        })
    }

    @Emit('new-tab')
    addTab(item: TabBar.Item) {
        this.$nextTick(() => {
            this.tab = this.tabs.length - 1
        })
    }
}
</script>

<style lang="scss" scoped>
.sync-tab-bar {
    padding-top: 5px;
    padding-right: 5px;
    height: 40px;
    width: 100%;
    // -webkit-user-select: none;
    // user-select: none;
    transition: padding-left 300ms ease-in-out;
    display: flex;
    // justify-content: space-between;
}
.darwin .sync-tab-bar {
    padding-left: 55px;
    overflow: hidden;
}
.sync-tab-bar .cus-tab-item {
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    background-color: #90a4ae;
    -webkit-app-region: no-drag;
    color: #fff;
    height: 35px;
    width: 200px;
}
.sync-tab-bar .cus-tab-item.active-tab {
    z-index: 5;
    background-color: #546e7a;
}

.cus-tab-item .v-tabs__item > div {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.cus-tab-item .v-tabs__item .tab-title {
    float: left;
    max-width: 140px;
    text-transform: none;
}
.cus-tab-item img {
    width: 14px;
    height: 14px;
    margin-top: 1px;
    margin-right: 2px;
    float: left;
}
.cus-tab-item .v-tabs__item {
    padding: 6px;
}
.tab-close {
    width: 20px;
    height: 20px;
    margin: 0;
    float: right;
}
.tab-close .v-icon {
    color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
}

.sync-tab-bar .v-tabs.cus-v-tabs {
    max-width: calc(100% - 50px);
}
.sync-tab-bar .sync-add-tab {
    margin: 0;
    width: 35px;
    height: 35px;
}
</style>
<style lang="scss">
.sync-tab-bar .cus-v-tabs .v-tabs__slider-wrapper {
    z-index: 6;
}
.sync-tab-bar .v-tabs__wrapper.v-tabs__wrapper--show-arrows {
    margin-left: 0;
    margin-right: 0;
    padding-left: 40px;
    padding-right: 40px;
    overflow: visible;
}
.sync-tab-bar .v-tabs__icon--prev,
.sync-tab-bar .v-tabs__icon--next {
    background-color: rgba(255, 255, 255, 0.3);
    z-index: 7;
    width: 35px;
    height: 35px;
    border-radius: 50%;
}
.sync-tab-bar .v-tabs__container.v-tabs__container--overflow {
    margin-left: -40px;
}
.sync-tab-bar .v-tabs__icon--prev:hover,
.sync-tab-bar .v-tabs__icon--next:hover {
    background-color: rgba(255, 255, 255, 0.9);

}
</style>
