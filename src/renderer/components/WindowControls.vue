<template>
    <v-layout v-bind="$attrs" v-on="$listeners" style="width: 138px">
        <div class="btn" @click="minimize">
            <div class="icon minimize"/>
        </div>
        <div class="btn" @click="maximize">
            <div class="icon maximize" :class="isMaximized? 'unmaximize': 'maximize'"/>
        </div>
        <div class="btn btn-close" @click="close">
            <div class="icon close"/>
        </div>
    </v-layout>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { remote, ipcRenderer } from 'electron';

const win = remote.getCurrentWindow()

@Component
export default class WindowControls extends Vue {
    isMaximized = win.isMaximized()

    listener !: (_: any, event: string) => void
    created() {
        this.listener = (_, event) => {
            if (event === 'maximize') {
                this.isMaximized = true
            } else if (event === 'unmaximize') {
                this.isMaximized = false
            }
        }
        ipcRenderer.addListener('browser-window-event', this.listener)
    }

    destroyed() {
        ipcRenderer.removeListener('browser-window-event', this.listener)
    }
    minimize() {
        remote.app.EXTENSION.mq.post('WindowAction', {
            windowId: win.id,
            action: 'minimize'
        })
    }
    maximize() {
        remote.app.EXTENSION.mq.post('WindowAction', {
            windowId: win.id,
            action: this.isMaximized ? 'unmaximize' : 'maximize'
        })
    }

    close() {
        win.close()
    }
}
</script>
<style scoped>
.btn {
    width: 33.34%;
    height: 28px;
    background-color: none;
    transition: background 0.15s;
    display: inline-block;
}

.btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

.theme--dark .btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.icon {
    height: 100%;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.7);
}
.theme--dark .icon {
    background-color: rgba(255, 255, 255, 0.7);
}
.btn >>> .icon {
    -webkit-mask-size: 23.1%;
}

.icon >>> svg {
    shape-rendering: crispEdges;
    text-align: center;
}
.blur .icon {
    background-color: rgba(0, 0, 0, 0.3);
}
.blur .theme--dark .icon {
    background-color: rgba(255, 255, 255, 0.5);
}

.close {
    -webkit-mask: url("../../../assets/svgs/chrome-close.svg") no-repeat 50% 50%;
}
.maximize {
    -webkit-mask: url("../../../assets/svgs/chrome-maximize.svg") no-repeat 50%
        50%;
}
.unmaximize {
    -webkit-mask: url("../../../assets/svgs/chrome-restore.svg") no-repeat 50%
        50%;
}
.minimize {
    -webkit-mask: url("../../../assets/svgs/chrome-minimize.svg") no-repeat 50%
        50%;
}

.close:hover {
    background-color: white;
}

.btn-close:hover {
    background-color: rgba(232, 17, 35, 0.9) !important;
}
</style>
