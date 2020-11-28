# Hand Gesture Playground

<table>
  <tr>
    <td class="col-6"><img src="https://media.giphy.com/media/2vcbWI2ZAPeGvJVpII/source.gif"></td>
    <td class="col-6">
      <h2>Try it</h2>
      <ul>
        <li>🖐 With palm facing towards camera, move hand around to move pointer</li>
        <li>👌 Pinch your index and thumb to click or drag the page</li>
        <li>✊ Close hand and move hand to scroll page up and down</li>
      </ul>
      <HandsfreeToggle class="handsfree-hide-when-started-without-handpose" text-off="Activate Hand Gestures" text-on="Stop Handsfree" :opts="demoOpts" @started="onStarted" />
      <button class="large handsfree-show-when-started-without-handpose handsfree-show-when-loading" disabled><Fa-Spinner spin /> Loading...</button>
      <button class="large handsfree-show-when-started-without-handpose handsfree-hide-when-loading" @click="startDemo">👆 Activate Hand Gestures</button>
    </td>
  </tr>
</table>


The finger pointer estimates a ray from your index/pointer finger onto the screen. It positions a pointer there and you can use the calculated values to all sorts of things which we'll explore!

```js
const handsfree = new Handsfree({hand: true})
handsfree.start()

// Where on the screen to position the pointer
handsfree.hand.data.pointer.x
handsfree.hand.data.pointer.y
```

## Plugins used
- `fingerPointer` - calculates and positions a pointer on the screen
- `palmScroll` - scrolls the window or active scroll area

## Scroll focus

<table>
  <tr>
    <td>
      <div class="demo-focus-area">
        <div><div></div></div>
      </div>
      <p><button id="demo-toggle-scroll-speed" onclick="demo.toggleScrollSpeed()" class="block">🐢 Activate slow scrolling</button></p>
    </td>
    <td>
      <div class="demo-focus-area">
        <div><div></div></div>
      </div>
      <p><button id="demo-toggle-scroll-zone" onclick="demo.toggleScrollZone()" class="block">↕ Decrease scroll zone</button></p>
    </td>
  </tr>
</table>

## Calibrating

> ⌚ More info coming soon

## Changing scroll speed

> ⌚ More info coming soon

## Changing other properties

> ⌚ More info coming soon

## Extending the Face Pointer

> ⌚ More info coming soon

## Contributing

> ⌚ More info coming soon


<!-- Code -->
<script>
export default {
  data () {
    return {
      demoOpts: {
        weboji: false,
        handpose: true
      }
    }
  },

  methods: {
    /**
     * Start the page with our preset options
     */
    startDemo () {
      this.$root.handsfree.start(this.demoOpts, this.onStarted)
    },
    
    /**
     * Toggle plugins
     */
    onStarted () {
      console.log('🖐 Hand Tracking started')
    }
  }
}
</script>