var Vue = require('vue').default;
var angular = require('angular');
var camelCase = require('lodash.camelcase');
var kebabCase = require('lodash.kebabcase');
var upperFirst = require('lodash.upperfirst');

var ngModule = angular.module('vue-angular', []);

// Returns a vue binding/attribute ie: :propName="propName"
function mapProperty(prop) {
  return ':'.concat(prop, '="', prop, '"');
}
// Returns a vue event/attribute ie: @eventName="eventName"
function mapEvent(event) {
  return '@'.concat(event, '="', event, '"');
}
// Returns an angular callback name ie: onEvent
function nameEvent(event) {
  return 'on'.concat(event.charAt(0).toUpperCase() + event.slice(1));
}

module.exports.createComponent = function(options, events, inject) {
  // Shorthand references
  inject = inject || [];
  var mixins = options.mixins || (options.mixins = []);
  var props = options.props || [];
  // A map of argument names for angular callbacks
  var eventMap = events || {};
  // Convert into an array of event names
  events = Object.keys(eventMap);
  // Camel-case name for angular
  var name = camelCase(options.name);
  // Convert props to a space-delimited string to use in html
  var propAttrs = props.map(mapProperty).join(' ');
  // Convert events to a space-delimited string to use in html
  var eventAttrs = events.map(mapEvent).join(' ');
  // Convert props to a bindings definition for angular.component
  var bindings = props.reduce(function (obj, prop) {
    obj[prop] = '<?';
    return obj;
  }, {});
  // Convert events to a bindings definition for angular.component
  bindings = events.reduce(function (obj, event) {
    obj[nameEvent(event)] = '&?';
    return obj;
  }, bindings);
  mixins.push({
    created: function() {
      console.log('createeed');
      injector = angular.element(document.body).injector();
      inject.forEach(function(dep) {
        this[dep] = injector.get(dep);
      }.bind(this));
      console.log(this)
    }
  })
  // Register with angular
  VueController.$inject = ['$timeout', '$element'];
  function VueController($timeout, $element) {
    this.$timeout = $timeout;
    this.$element = $element;
  }
  VueController.prototype = {
    $onInit: function() {
      var $ctrl = this;
      var eventCallbacks = events.reduce(function(obj, event) {
        obj[event] = function() {
          var args = Array.prototype.slice.call(arguments);
          var eventParams = eventMap[event];
          var eventArgs = eventParams.reduce(function(obj, paramName, paramIndex) {
            obj[paramName] = args[paramIndex];
            return obj;
          }, {});
          $ctrl.$timeout(function() {
            $ctrl[`on${upperFirst(event)}`](eventArgs);
          });
        }
        return obj;
      }, {});
      this.vue = new Vue({
        mounted: function() {
          $ctrl.ready = true;
          $ctrl.applyChanges();
        },
        render: function(createElement) {
          return createElement(
            options, {on: eventCallbacks}
          );
        }
      });
      this.$element.append(this.vue.$mount().$el);
    },
    applyChanges: function() {
      var vueProps = this.vue.$children[0]._props;
      var $ctrl = this;
      props.forEach(function(prop) {
        vueProps[prop] = angular.copy($ctrl[prop]);
      });
    },
    $onChanges: function(changes) {
      if (!this.ready) { return; }
      this.applyChanges();
    }
  }
  ngModule.component(name, {
    bindings: bindings || {},
    controller: VueController
  });
}