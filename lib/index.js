import store from './store'
import mixin from './index'

var install = function (Vue, options) {
  Vue.mixin(mixin)
}

export {
  mixin,
  store,
  install
}
