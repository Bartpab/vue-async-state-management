export default {
  data () {
    return {
      errors: []
    };
  },
  events: {
    'delete-error': function (error) {
      this.removeError(error);
    }
  },
  methods: {
    addError: function (error) {
      this.errors.push(error);
    },
    removeError: function (error) {
      while (this.errors.indexOf(error) !== -1) {
        this.errors.splice(this.errors.indexOf(error), 1);
      }
    }
  }
};
