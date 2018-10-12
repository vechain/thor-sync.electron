<template>
    <div class="sync-tab-bar">
        <v-tabs class="cus-v-tabs" show-arrows color="#f5f5f5" left height="35px" v-model="tab">
            <v-tab dark class="cus-tab-item" v-for="(item, index) in tabs" :key="index"
                active-class="active-tab" @dblclick.stop.prevent>
                <template v-if="item.iconUrl">
                    <img :src="item.iconUrl">
                </template>
                    <div>{{item.title || 'New tab'}}</div>
                    <v-icon @click.stop.prevent="popClose(index)" class="tab-close">close</v-icon>
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
.full-screen .sync-tab-bar {
    padding-left: 5px;
}
// .sync-tab {
//     padding-top: 8px;
//     width: 150x;
//     height: 32px;
//     -webkit-user-select: none;
//     user-select: none;
//     -webkit-app-region: no-drag;
//     border-top-left-radius: 7px;
//     border-top-right-radius: 7px;
//     width: 200px;
//     background-color: #48bbc7;
//     cursor: normal;
// }
.sync-tab.current-tab {
    z-index: 5;
    background-color: rgb(154, 236, 218);
}
.sync-tab img {
    width: 15px;
    height: 15px;
    margin-top: 2px;
}
.sync-tab span {
    font-size: 13px;
    max-width: 140px;
    height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.sync-tab .tab-container {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    cursor: normal;
}
.tab-close {
    color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
}
.sync-tab-bar .cus-tab-item {
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;
    background-color: rgb(24, 78, 82);
    -webkit-app-region: no-drag;
    color: #fff;
    height: 35px;
    width: 200px;
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
