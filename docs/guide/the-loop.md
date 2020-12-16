# 🔌 Plugins and the main loop

When you run [handsfree.start()](/ref/method/start) a loop is started that does 3 things:

1. Synchronously updates all models and stores their data in `handsfree.model[modelName].data`
2. Triggers a `handsfree-data` event on the `document` with an object containing all the data
3. Runs all active plugins stored in `handsfree.plugin[pluginName]`

"Plugins" are the recommended way of working with Handsfree. All enabled plugins run their logic on every frame, can be attached to specific models, toggled on/off by tag, and can even manipulate your `handsfree` instance and other plugins.

## Basic plugins

Basic plugins are created with [handsfree.use(pluginName, callback)](/ref/method/use):

```js
// A plugin that console logs your data on every frame
handsfree.use('consoleLogger', data => {
  console.log(data.weboji.rotation, data.holistic.data.faceLandmarks)
})
```

The above will create a new plugin that can now be accessed with `handsfree.plugin.consoleLogger` and will be run on every frame. The callback is stored in `handsfree.plugin.consoleLogger.onFrame`, and you can toggle the plugin with:

```js
handsfree.plugin.consoleLogger.enable()
handsfree.plugin.consoleLogger.disable()
```

The callback receives a `data` object containing the data of every enabled model. It's common to simply destructure the model that you need:

```js
// A plugin that console logs your data on every frame
handsfree.use('consoleLogger', {weboji} => {
  console.log(weboji.rotation, weboji.translation, weboji.morphs)
})
```

## Complex plugins

Instead of passing a function you can pass an object into [handsfree.use(pluginName, opts)](/ref/method/use). `opts` can contain anything, but the following lists special properties and methods:

```js
handsfree.use('pluginName', {
  // Whether the plugin is enabled or not
  // - If omitted, this will default to true
  enabled: true,

  // A set of config values that can be overwritten
  // - These can be set during instantiation (see below)
  config: {},

  // Called on every frame
  // - If you only pass a callback, it'll get assigned to this method
  onFrame (data) {},

  // Called immediate after this plugin is added (whether it's enabled or not)
  // - Use this for any setup, like creating DOM elements
  onUse (handsfree) {},

  // Called when the plugin is enabled from a disabled state
  // - eg, after calling: handsfree.plugin.myPlugin.enable()
  onEnable (handsfree) {},

  // Called when the plugin is disabled from an enabled state
  // - eg, after calling: handsfree.plugin.myPlugin.disable()
  onDisable (handsfree) {}
})
```

The `onEnable` and `onDisable` methods makes it easy to run code when you run `.enable()` or `.disable()` on the plugin. A common use case is to show/hide DOM elements (for example, to toggle the face and palm pointers).

Since the basic plugin above simply maps the callback to an `onFrame` method, another way of writing it is:

```js
handsfree.use('consoleLogger', {
  onFrame (data) {
    console.log(weboji.rotation, weboji.translation, weboji.morphs)
  }
})
```

> **Note:** `.onEnable()` is only called when you run `handsfree.plugin[pluginName].enable()`. It doesn't run immediately when you `.use()` the plugin even if `.enabled === true`. Use `onUse()` instead. 

## Accessing data outside of a plugin

You may occasionally find yourself in a part of your app where you don't have easy access to your `handsfree` instance. In these cases, you can still access the data on every frame by listening to the `handsfree-data` event on the `document`:

```js
document.addEventListener('handsfree-data', event => {
  console.log(event.detail.weboji.rotation, event.detail.weboji.translation)
})
```

## Checking your data

Because you have the ability to swap out models and configs on the fly, it's highly recommended to first check that the model has data:

```js
handfree.use('consoleLogger', data => {
  if (!data.weboji) return

  console.log(data.weboji)
})
```

In some models properties are only available if detected. For example, if the face is not visible in the [holistic model](/ref/model/holistic) then the `.rightHandLandmarks` doesn't exist. In these cases it might be necessary to check if the property also exists by using the [Optional Chaining operator](https://www.joshwcomeau.com/operator-lookup?match=optional-chaining):

```js
handsfree.use('consoleLogger', data => {
  if (!data.holistic?.rightHandLandmarks?.[0]) return

  console.log(data.holistic.rightHandLandmarks[0])
})
```
