import co from 'co';
import Vue from 'vue';
import errorManagement from './errorManagement';

export default {
  mixins: [errorManagement],
  data () {
    return {
      state: {
        is: {},
        promises: {},
        has: {
          done: {},
          failed: {}
        }
      }
    };
  },
  methods: {
    executeIfNotRunning: function (context, coroutine) {
      if (this.isAsyncActionRunning(context) === false) {
        let promise = co(coroutine);
        this.handleAsyncActionState(context, promise);
        return promise;
      } else {
        return state.promise[context];
      }
    },
    assertAsyncActionHadBeenExecuted: function (context) {
      if (this.state.has.done[context] === false) {
        throw Error('Action on context ' + context + ' had not been executed!');
      }
    },
    assertAsyncActionIsNotRunning: function (context) {
      if (this.state.is[context] === true) {
        throw Error('Action on context ' + context + ' is currently running...');
      }
    },
    hasRunAtLeastOnce: function (context) {
      return this.state.has.done[context] || this.state.has.failed[context];
    },
    isAsyncActionRunning: function (context) {
      return this.state.is[context];
    },
    registerAsyncActionState: function (context) {
      this.state = Object.assign({}, this.state, {
        is: {
          [context]: false
        },
        promise: {
          [context]: null
        },
        has: {
          done: {
            [context]: false
          },
          failed: {
            [context]: false
          }
        }
      });
    },
    resetState: function (ctx) {
      this.state.is[ctx] = false;
      this.state.has.done[ctx] = false;
      this.state.has.failed[ctx] = false;
    },
    handleAsyncActionState: function (ctx, promise) {
      return co.wrap(function * (ctx, promise) {
        try {
          this.state.is[ctx] = true;
          this.state.has.done[ctx] = false;
          this.state.has.failed[ctx] = false;
          this.state.promise[ctx] = promise;
          var ret = yield promise;
          this.state.has.done[ctx] = true;
          return ret;
        } catch (e) {
          this.addError(e);
          this.state.has.failed[ctx] = true;
          throw e;
        } finally {
          this.state.is[ctx] = false;
          this.state.promise[ctx] = null;
        }
      }.bind(this))(ctx, promise);
    }
  }
};
