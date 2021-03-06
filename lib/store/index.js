import co from 'co';
import Vue from 'vue';

var resetContextState = function (state, context) {
  state.is[context] = false;
  state.has.done[context] = false;
  state.has.failed[context] = false;
  state.promises[context] = null;
  state.errors[context] = null;
  state.values[context] = null;
};

var registerContext = function (state, getters, mutations, context) {
  state.is = !!state.is ? state.is : {};
  state.has = !!state.has ? state.has: {
    done: {},
    failed: {}
  };
  state.has.done = !!state.has.done ? state.has.done: {};
  state.has.failed = !!state.has.failed ? state.has.failed : {};
  state.promises = !!state.promises ? state.promises: {};
  state.errors = !!state.errors ? state.errors: {};
  state.values = !!state.values ? state.values : {};

  state.errors = Object.assign({}, state.errors, {[context]: null});

  state.is[context] = false;
  state.has.done[context] = false;
  state.has.failed[context] = false;
  state.promises[context] = null;
  state.errors[context] = null;
  state.values[context] = null;

  // Define the getters related to the context
  getters['is_' + context] = (state) => {
    return state.is[context];
  };
  getters['has_done_' + context] = (state) => {
    return state.has.done[context];
  };
  getters['has_failed_' + context] = (state) => {
    return state.has.failed[context];
  };
  getters['error_' + context] = (state) => {
    return state.errors[context];
  };
  getters['value_' + context] = (state) => {
    return state.values[context];
  };
  getters['promise_' + context] = (state) => {
    return state.promises[context];
  };
  getters['async_wait_for_' + context] = (state) => {
    return state.promises[context];
  };
  // Define the mutations
  mutations['reset_' + context] = state => {
    resetContextState(state, context);
  };
  mutations['begin_' + context] = (state) => {
    resetContextState(state, context);
    state.is[context] = true;
  };
  mutations['success_' + context] = (state, value) => {
    resetContextState(state, context);

    state.has.done[context] = true;
    state.values[context] = value;
  };
  mutations['failed_' + context] = (state, error) => {
    state.has.failed[context] = true;
    state.errors = Object.assign({}, state.errors, {[context]: error});
  };
  mutations['finally_' + context] = (state) => {
    state.is[context] = false;
    state.promises[context] = null;
  };
  mutations['set_promise_' + context] = (state, promise) => {
    state.promises[context] = promise;
  };
};

var isHandlingContext = function (context, getters) {
  return getters['is_' + context];
};

var executeCoIfNotAlreadyHandling = function (context, getters, commit, coroutine) {
  if (isHandlingContext(context, getters) === false) {
    let promise = co(coroutine);
    handleContext(context, getters, commit, promise);
    return promise;
  } else {
    return getters['promise_' + context];
  }
};

var handleContext = function (context, getters, commit, promise) {
  if (getters['is_' + context] === true) {
    throw new Error('Already handling an incomplete async. action which context is' + context);
  } else {
    return co.wrap(function * () {
      commit('begin_' + context);
      commit('set_promise_' + context, promise);
      try {
        var value = yield promise;
        commit('success_' + context, value);
        return value;
      } catch (e) {
        commit('failed_' + context, e);
        throw e;
      } finally {
        commit('finally_' + context);
      }
    })();
  }
};

function StateWrapper (context, state, getters, mutations) {
  this.context = context;

  registerContext(state, getters, mutations, context);

  this.executeIfNotRunning = function ({getters, commit}, coroutine) {
    return executeCoIfNotAlreadyHandling (this.context, getters, commit, coroutine);
  };

  this.executeIfHadNotRun = function ({getters, commit}, coroutine) {
    if (getters['has_done_' + this.context] === false) {
      return this.executeIfNotRunning({getters, commit}, coroutine);
    } else {
      return Promise.resolve(getters['value_' + this.context]);
    }
  };

  this.handle = function ({getters, commit}, promise) {
    return handleContext (this.context, getters, commit, promise);
  };

  this.reset = function ({getters, commit}) {
    commit('reset_' + this.context);
  };

  this.isRunning = function ({getters}) {
    return isHandlingContext(this.context, this.getters);
  };
};

export {resetContextState, registerContext, isHandlingContext, executeCoIfNotAlreadyHandling, handleContext};
export default {StateWrapper, resetContextState, registerContext, isHandlingContext, executeCoIfNotAlreadyHandling, handleContext};
