import store from './store/index';
import mixin from './mixin/index';

var install = function (Vue, options) {
  Vue.mixin(mixin);
};

export default {
  mixin: mixin,
  store: store,
  install: install
};
