// import './assets/handsfree.scss'
import merge from 'lodash/merge'
import trim from 'lodash/trim'
import throttle from 'lodash/throttle'
import WebojiModel from './Model/Weboji.js'
import PoseNetModel from './Model/PoseNet.js'
import Plugin from './Plugin/index.js'

// Core plugins
import pluginFacePointer from './plugins/facePointer'
import pluginFaceClick from './plugins/faceClick'
import pluginFaceGhostedPointer from './plugins/faceGhostedPointer'
import pluginFaceScroll from './plugins/faceScroll'
const defaultPlugins = {
  facePointer: pluginFacePointer,
  faceClick: pluginFaceClick,
  faceGhostedPointer: pluginFaceGhostedPointer,
  faceScroll: pluginFaceScroll
}

// Determine a default assetsPath, using this <script>'s src
let assetsPath = document.currentScript
  ? document.currentScript.getAttribute('src')
  : ''
assetsPath =
  trim(assetsPath.substr(0, assetsPath.lastIndexOf('/') + 1), '/') + '/assets/'

// Counter for unique instance IDs
let id = 0

/**
 * ✨ Handsfree.js
 */
class Handsfree {
  constructor(config = {}) {
    this.id = ++id

    // Setup options
    this.config = config
    this.cleanConfig()

    // Flags
    this.isStarted = false
    this.isLooping = false

    // Video, canvas, and other feedback elements
    this.feedback = {}
    this.createFeedback()

    // Models
    this.model = {}

    // Plugins
    this.plugin = {}
    this.prevDisabledPlugins = []
    this.loadDefaultPlugins()
  }

  /**
   * Sets config defaults
   */
  cleanConfig() {
    // Model defaults
    const weboji = {
      enabled: false,
      throttle: 0,
      // Represents the calibrator settings
      calibrator: {
        // (optional) The target element to act as the calibrator wrapping div
        target: null,
        // The message to display over the marker, can be HTML
        instructions: 'Point head towards center of circle below',
        // (optional if .target === null, otherwise required) The target element to act as the calibrator target (should be inside target)
        marker: null
      },
      morphs: {
        threshold: {
          smileRight: 0.7,
          smileLeft: 0.7,
          browLeftDown: 0.8,
          browRightDown: 0.8,
          browLeftUp: 0.8,
          browRightUp: 0.8,
          eyeLeftClosed: 0.4,
          eyeRightClosed: 0.4,
          mouthOpen: 0.3,
          mouthRound: 0.8,
          upperLip: 0.5
        }
      }
    }

    const posenet = {
      enabled: false,
      throttle: 0,
      imageScaleFactor: 0.3,
      outputStride: 16,
      flipHorizontal: false,
      minConfidence: 0.5,
      maxPoseDetections: 5,
      scoreThreshold: 0.5,
      nmsRadius: 20,
      detectionType: 'single',
      multiplier: 0.75
    }

    this.config = merge(
      {
        assetsPath,
        weboji,
        posenet,

        // Plugin overrides
        plugin: {},
        feedback: {
          enabled: false,
          $target: document.body
        }
      },
      this.config
    )

    // Transform defaults (string => [string])
    if (typeof this.config.weboji === 'boolean') {
      let isEnabled = this.config.weboji
      this.config.weboji = weboji
      this.config.weboji.enabled = isEnabled
    }
    if (typeof this.config.posenet === 'boolean') {
      let isEnabled = this.config.posenet
      this.config.posenet = posenet
      this.config.posenet.enabled = isEnabled
    }

    // Track the models we're using
    this.activeModels = []
    if (this.config.weboji.enabled) this.activeModels.push('weboji')
    if (this.config.posenet.enabled) this.activeModels.push('posenet')
  }

  /**
   * Start all enabled models
   * - Once models loaded, starts loop
   * @param {Function} callback The callback to call once everything is started
   */
  start(callback) {
    if (!this.isStarted) {
      this.startModels(this.activeModels).then(() => {
        this.isLooping = true
        this.loop()
        callback && callback()
      })
    } else {
      callback && callback()
    }
  }

  /**
   * The main "Game Loop"
   */
  loop() {
    let data = {}

    // Get model data
    this.activeModels.forEach((modelName) => {
      if (this[modelName].isReady && this[modelName].enabled) {
        this[modelName].getData()
        data[modelName] = this[modelName].data || {}
      }
    })

    // Run on frames
    Object.keys(this.plugin).forEach((name) => {
      this.plugin[name].enabled &&
        this.plugin[name].onFrame &&
        this.plugin[name].onFrame(data)
    })

    // Emit event and loop again
    this.emit('data', data)
    this.isLooping && requestAnimationFrame(() => this.isLooping && this.loop())
  }

  /**
   * Stop all models
   */
  stop() {
    location.reload()
  }

  /**
   * Starts all active models
   * @param {Array} models A list of model names to load
   * @returns {Promise} Resolves after all models loaded or rejected
   */
  startModels(models) {
    return new Promise((resolve) => {
      // Set loading/ready classes
      document.body.classList.add('handsfree-loading')
      let numModels = this.activeModels.length
      this.on('modelLoaded', () => {
        if (--numModels === 0) {
          document.body.classList.remove('handsfree-loading')
          document.body.classList.add('handsfree-started')
          resolve()
        }
      })

      // Loop through each model and initialize them
      models.forEach((modelName) => {
        switch (modelName) {
          /**
           * Weboji
           */
          case 'weboji':
            if (!this.weboji) {
              this.weboji = new WebojiModel(
                {
                  name: 'weboji',
                  ...this.config.weboji,
                  deps: this.config.assetsPath + '/jeelizFaceTransfer.js'
                },
                this
              )
            } else {
              this.emit('modelLoaded')
            }
            break

          /**
           * PoseNet
           */
          case 'posenet':
            if (!this.posenet) {
              this.posenet = new PoseNetModel(
                {
                  name: 'posenet',
                  ...this.config.posenet,
                  deps: this.config.assetsPath + '/ml5.min.js'
                },
                this
              )
            } else {
              this.emit('modelLoaded')
            }
            break
        }
      })
    })
  }

  /**
   * Adds a callback (we call it a plugin) to be called after every tracked frame
   *
   * @param {String} name The plugin name
   * @param {Object|Function} config The config object, or a callback to run on every fram
   * @returns {Plugin} The plugin object
   */
  use(name, config) {
    // Make sure we have an options object
    if (typeof config === 'function') {
      config = {
        onFrame: config
      }
    }

    config = Object.assign(
      {
        // Stores the plugins name for internal use
        name,
        // Whether the plugin is enabled by default
        enabled: true,
        // A set of default config values the user can override during instanciation
        config: {},
        // (instance) => Called on every frame
        onFrame: null,
        // (instance) => Called when the plugin is first used
        onUse: null,
        // (instance) => Called when the plugin is enabled
        onEnable: null,
        // (instance) => Called when the plugin is disabled
        onDisable: null
      },
      config
    )

    // Create the plugin
    this.plugin[name] = new Plugin(config, this)
    this.plugin[name].enabled &&
      this.plugin[name].onUse &&
      this.plugin[name].onUse()

    return this.plugin[name]
  }

  /**
   * Triggers an event on the document
   *
   * @param {String} eventName The event name, appended as `handsfree-${eventName}`
   */
  emit(eventName, detail = null) {
    const event = new CustomEvent(`handsfree-${eventName}`, { detail })
    document.dispatchEvent(event)
  }

  /**
   * Calls a callback on `document` when an event is triggered
   *
   * @param {String} eventName The `handsfree-${eventName}` to listen to
   * @param {Function} callback The callback to call
   */
  on(eventName, callback) {
    document.addEventListener(`handsfree-${eventName}`, (ev) => {
      callback(ev.detail)
    })
  }

  /**
   * Disables all plugins
   * @param {String|Array} plugins List of plugin names to disable, or null to disable all
   */
  disablePlugins(plugins) {
    if (!plugins) plugins = Object.keys(this.plugin)
    if (typeof plugins === 'string') plugins = [plugins]

    this.prevDisabledPlugins = []

    plugins.forEach((name) => {
      this.plugin[name].disable()
      this.prevDisabledPlugins.push(name)
    })
  }

  /**
   * Reenables plugins previously disabled with disableAllPlugins
   */
  reenablePlugins() {
    this.prevDisabledPlugins.forEach((name) => {
      this.plugin[name].enable()
    })
    this.prevDisabledPlugins = []
  }

  /**
   * Enable all plugins
   * @param {Array} plugins List of plugin names to enable, or null to disable all
   */
  enablePlugins(plugins) {
    if (!plugins) plugins = Object.keys(this.plugin)
    this.prevDisabledPlugins = []

    plugins.forEach((name) => {
      this.plugin[name].enable()
      this.prevDisabledPlugins.push(name)
    })
  }

  /**
   * Load default plugins
   */
  loadDefaultPlugins() {
    Object.keys(defaultPlugins).forEach(name => {
      this.use(name, defaultPlugins[name])
    })
  }

  /**
   * Throttles callback to run timeInMilliseconds
   *
   * @param {function} callback The callback to run
   * @param {Integer} time How many milliseconds to throttle (in other words, run this method at most ever x milliseconds)
   * @param {Object} options {leading: true, trailing: true} @see https://lodash.com/docs/4.17.15#throttle
   */
  throttle(cb, time, opts) {
    return throttle(cb, time, opts)
  }

  /**
   * Creates the feedback debugger, which contains the canvas/video element
   */
  createFeedback() {
    const $wrap = document.createElement('DIV')
    $wrap.classList.add('handsfree-feedback')
    this.feedback.$wrap = $wrap

    // Main canvas
    const $canvas = document.createElement('CANVAS')
    $canvas.classList.add('handsfree-canvas')
    $canvas.setAttribute('id', `handsfree-canvas-${this.id}`)
    $wrap.appendChild($canvas)
    this.feedback.$canvas = $canvas

    // Create video element
    const $video = document.createElement('VIDEO')
    $video.setAttribute('playsinline', true)
    $video.classList.add('handsfree-video')
    $video.setAttribute('id', `handsfree-video-${this.id}`)
    // @TODO make this configurable
    $video.width = 640
    $video.height = 480
    $wrap.appendChild($video)
    this.feedback.$video = $video

    // Debug canvas
    const $debug = document.createElement('CANVAS')
    $debug.classList.add('handsfree-debug')
    $debug.setAttribute('id', `handsfree-debug-${this.id}`)
    $wrap.appendChild($debug)
    this.feedback.$debug = $debug
    $debug.width = $video.width
    $debug.height = $video.height

    // Toggle the debugger
    if (this.config.feedback.enabled) {
      this.feedback.isVisible = true
    } else {
      this.feedback.isVisible = false
      $wrap.style.display = 'none'
    }

    this.config.feedback.$target.appendChild($wrap)
  }

  /**
   * Toggle feedback on/off
   */
  showFeedback() {
    this.feedback.isVisible = true
    this.feedback.$wrap.style.display = 'block'
  }
  hideFeedback() {
    this.feedback.isVisible = false
    this.feedback.$wrap.style.display = 'none'
  }

  /**
   * Gets the webcam media stream into handsfree.feedback.stream
   * @param {Object} callback The callback to call after the stream is received
   */
  getUserMedia(callback) {
    if (!this.feedback.stream) {
      navigator.mediaDevices
        .getUserMedia({ audio: false, video: true })
        .then((stream) => {
          this.feedback.stream = stream
          this.feedback.$video.srcObject = stream
          this.feedback.$video.onloadedmetadata = () => {
            this.feedback.$video.play()
            callback && callback()
          }
        })
        .catch((err) => {
          console.error(`Error loading models: ${err}`)
        })
    } else {
      this.feedback.$video.play()
      callback && callback()
    }
  }
}

window.dispatchEvent(new Event('handsfree.ready'))
export default Handsfree