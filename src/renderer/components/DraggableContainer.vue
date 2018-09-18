<template>
    <div ref="container" class="draggable-container">
        <div class="port-title" v-if="titleBar">
            <slot name="title"/>
        </div>
        <v-container v-if="titleBar" fluid class='pa-0 ma-0 container-title-bar'>
            <v-layout row>
                <v-flex>
                    <v-icon @click.stop="toggleFullSize">picture_in_picture_alt</v-icon>
                </v-flex>
                <v-flex>
                    <v-icon @click.stop="close">close</v-icon>
                </v-flex>
            </v-layout>
        </v-container>
        <slot name="contant"/>
    </div>
</template>

<script lang="ts">
const Dragable = require('draggabilly')
import { Vue, Component, Prop, Emit } from 'vue-property-decorator'

declare type DraggableOpts = {
    containment: string
    handle: string
}

@Component
export default class DraggableContainer extends Vue {
    private name: string = 'draggable_container'
    private draggie: any
    private winResizeEnd: any

    @Prop()
    private titleBar: boolean = this.titleBar !== false ? true : false

    @Prop({
        default: {
            containment: 'body',
            handle: '.draggable-container'
        }
    })
    private opts!: DraggableOpts

    onWindowResize() {
        window.clearTimeout(this.winResizeEnd)
        let _this = this
        this.winResizeEnd = window.setTimeout(function() {
            let position = _this.draggie.position
            let x: number = position.x
            let y: number = position.y
            if (position.x > 800) {
                x = position.x % 800
            }
            if (position.y > 600) {
                y = position.y % 600
            }
            _this.draggie.setPosition(x, y)
        }, 150)
    }
    eventBind() {
        if (this.titleBar) {
            this.opts.handle = '.container-title-bar'
        }

        let draggie = new Dragable(this.$refs.container, this.opts)
        this.draggie = draggie

        draggie.on('staticClick', () => {
            this.$emit('switch-view')
        })
        draggie.on('dragStart', () => {
            this.$emit('switch-view')
        })
        window.addEventListener('resize', this.onWindowResize)
    }

    @Emit('full-size')
    toggleFullSize() {}

    @Emit('close')
    close() {}

    eventUnbind() {
        this.draggie.destroy()
        window.removeEventListener('resize', this.onWindowResize)
    }

    created() {
        this.eventBind()
    }

    destoryed() {
        this.eventUnbind()
    }
}
</script>

<style lang="scss" scoped>
.draggable-container {
    background-color: #fff;
}
.draggable-container .port-contral {
    width: 50px;
    height: 25px;
    position: absolute;
    top: 0;
    right: 0;
}
.draggable-container .port-contral .v-icon {
    font-size: 19px;
    line-height: 20px;
}

.draggable-container .port-title {
    height: 25px;
    left: 20px;
    text-align: center;
    font-size: 14px;
    line-height: 25px;
    color: #424242;
    border-bottom: 1px solid #eee;
    background-image: -webkit-gradient(
        linear,
        right bottom,
        right top,
        color-stop(0, #d8d8d8),
        color-stop(0.83, #afafaf)
    );
}
.draggable-container .port-title:hover {
    cursor: move;
}
</style>

