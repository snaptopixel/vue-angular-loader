// Postloader for vue-loader that will take a Vue component and generate an AngularJS wrapper for it, makes a lot of assumptions
var loaderUtils = require('loader-utils');

// Converted to string and injected/appended to each .vue module
function vueAngular(options, events, inject) {
  var util = require('vue-angular-loader/util');
  util.createComponent(options, events, inject);
}

module.exports = function(source, map) {
  var options = loaderUtils.getOptions(this) || {};
  var exportName = options.exportName || 'exports.default';
  var eventsName = options.eventsName || '$events';
  var injectName = options.injectName || '$inject';
  source += `(${vueAngular.toString()})(${exportName}, ${eventsName}, ${injectName});`;
  this.callback(null, source, map);
};