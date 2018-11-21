<template>
    <div v-bind="$attrs" @wheel.capture.passive="onWheel" style="position:relative">
        <slot/>
        <div class="arrow-container" z-index="1000" :style="leftArrowStyleObject">
            <v-icon>arrow_back</v-icon>
        </div>
        <div class="arrow-container" style="right:0;" z-index="1000" :style="rightArrowStyleObject">
            <v-icon>arrow_forward</v-icon>
        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Emit } from 'vue-property-decorator'
import { remote } from 'electron'

const arrowSize = 120
@Component
export default class Swiper extends Vue {

    @Prop(Boolean) canSwipeRight !: boolean
    @Prop(Boolean) canSwipeLeft !: boolean
    @Emit('swipe')
    swipe(dir: Direction) { }

    gesture = new Gesture()
    leftArrowRatio = 0
    rightArrowRatio = 0

    get leftArrowStyleObject() {
        const style = {
            width: arrowSize + 'px',
            height: arrowSize + 'px',
            transform: `translateX(${(this.leftArrowRatio - 1) * 100}%)`,
            opacity: 0,
            transition: 'all 0.3s'
        }
        if (this.gesture.seized && this.gesture.dir === 'right') {
            style.opacity = this.leftArrowRatio
            style.transition = ''
        }
        return style
    }
    get rightArrowStyleObject() {
        const style = {
            width: arrowSize + 'px',
            height: arrowSize + 'px',
            transform: `translateX(${(1 - this.rightArrowRatio) * 100}%)`,
            opacity: 0,
            transition: 'all 0.3s'
        }
        if (this.gesture.seized && this.gesture.dir === 'left') {
            style.opacity = this.rightArrowRatio
            style.transition = ''
        }
        return style
    }

    _unbind!: () => void
    created() {
        const win = remote.getCurrentWindow()

        const listeners = {
            'scroll-touch-begin': () => {
                this.gesture.begin()
                this.leftArrowRatio = this.rightArrowRatio = 0
            },
            'scroll-touch-end': () => {
                if (this.gesture.seized) {
                    if (this.gesture.dir === 'right') {
                        if (this.gesture.ratio < 1) {
                            this.leftArrowRatio = 0
                        } else {
                            this.leftArrowRatio = 1
                            this.swipe('right')
                        }
                    } else {
                        if (this.gesture.ratio < 1) {
                            this.rightArrowRatio = 0
                        } else {
                            this.rightArrowRatio = 1
                            this.swipe('left')
                        }
                    }
                }
                this.gesture.end()
            },
            'scroll-touch-edge': () => {
                this.gesture.edge()
            }
        }
        for (const k in listeners) {
            win.addListener(k as any, (listeners as any)[k])
        }

        const keydownListener = () => {
            // end gesture on any key down
            this.leftArrowRatio = 0
            this.rightArrowRatio = 0
            this.gesture.end()
        }
        window.addEventListener('keydown', keydownListener)
        this._unbind = () => {
            for (const k in listeners) {
                win.removeListener(k as any, (listeners as any)[k])
            }
            window.removeEventListener('keydown', keydownListener)
        }
    }

    destroyed() {
        this._unbind()
    }

    onWheel(ev: WheelEvent) {
        this.gesture.wheel(ev.deltaX, ev.deltaY)
        if (this.gesture.seized) {
            if (this.gesture.dir === 'right') {
                if (this.canSwipeRight) {
                    this.leftArrowRatio = this.gesture.ratio
                }
            } else {
                { }
                if (this.canSwipeLeft) {
                    this.rightArrowRatio = this.gesture.ratio
                }
            }
        }
    }
}

export type Direction = 'left' | 'right'

class Gesture {
    scrolling = false
    scrollX = 0
    scrollY = 0
    ratio = 0
    dir: Direction = 'left'
    edgeDir: Direction | null = null
    seized = false


    begin() {
        this.scrolling = true
        this.scrollX = this.scrollY = 0
        this.dir = 'left'
        this.edgeDir = null
        this.seized = false
        this.ratio = 0
    }

    end() {
        this.scrolling = false
        this.seized = false
    }

    edge() {
        this.edgeDir = this.dir
    }

    wheel(dx: number, dy: number) {
        if (!this.scrolling) {
            return
        }

        if (this.seized) {
            this.scrollX += dx
            this.scrollY += dy

            let x = Math.max(0, this.dir === 'left' ? this.scrollX : -this.scrollX)

            this.ratio = Math.min(x / 200, 1)
        } else {
            this.dir = dx > 0 ? 'left' : 'right'
            if (this.dir !== this.edgeDir) {
                this.edgeDir = null
                this.scrollX = this.scrollY = 0
            } else {
                this.scrollX += dx
                this.scrollY += dy
                const x = Math.abs(this.scrollX)
                const y = Math.abs(this.scrollY)
                if (x > 20 && x > y * 2.5) {
                    this.scrollX = 0
                    this.scrollY = 0
                    this.seized = true
                    this.ratio = 0
                }
            }
        }
    }
}


</script>
<style scoped>
.arrow-container {
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-container .v-icon {
  font-size: 100px;
  color: white;
}
</style>

