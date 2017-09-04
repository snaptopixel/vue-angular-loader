// Identity loader with SourceMap support
module.exports = function(source, map) {
  console.log('SOURCE', source);
  this.callback(null, source, map);
};