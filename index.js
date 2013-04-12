var package = require('./package');
module.exports = {
  name: package.name,
  dependencies: [
    require('mikenchin-nanu')
  ],
  install: require('./lib')
};
module.exports.Blocker = require('./lib/blocker');
