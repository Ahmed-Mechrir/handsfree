// @see https://vuepress.vuejs.org/guide/basic-config.html

const path = require('path')

module.exports = {
  dest: 'build/docs',

  alias: {
    styles: path.resolve(__dirname, './styles'),
    public: path.resolve(__dirname, './public')
  },

  configureWebpack: {
    resolve: {
      alias: {
        '@handsfree': path.resolve(__dirname, '../../src'),
        '@components': path.resolve(__dirname, './components')
      }
    }
  },

  thirdPartyComponents: {
    // @see https://github.com/HiYue/vuepress-component-font-awesome#generate-specified-icons-only
    fontAwesomeIcons: {
      regular: ['video'],
      solid: ['spinner', 'video', 'video-slash']
    }
  },
  
  title: 'Handsfree.js',
  description: 'Handsfree.js is a library that helps you add face tracking, hand tracking, and/or pose estimation to your JavaScript projects in a snap.',
  head: [
    ['link', {rel: 'icon', href: '/favicon-dark.png'}]
  ],

  globalUIComponents: ['Handsfree'],
  
  themeConfig: {
    sidebar: [
      ['/', 'Home'],
      {
        title: '📚 Documentation',
        collapsable: true,
        sidebarDepth: 1,
        children: [
          ['/docs/', 'Getting Started'],
          ['/docs/face/', '😀 Face Tracking'],
          ['/docs/hand/', '🖖 Hand Tracking'],
          ['/docs/pose/', '🤺 Pose Tracking']    
        ]
      },
      {
        title: '🎮 Examples',
        collapsable: true,
        sidebarDepth: 1,
        children: [
          ['/examples/', 'Examples'],
          ['/examples/face-pointer', '😀 Face Pointer Playground'],
          ['/examples/finger-pointer', '👆 Finger Pointer Playground']
        ]
      },
      ['https://midiblocks.com', '💻 Gesture mapper'],
      // ['/webhook/', '🔌 Connect to Webhook'],
      // ['/community/', '💜 Get Involved']
    ]
  }
}