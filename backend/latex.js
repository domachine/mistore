var fs = require('fs'),
    path = require('path');

/**
 * This is a backend for mistore that is used to render latex documents as pdf
 * streams.  All dependencies are fetched and written with their name to the
 * temporary directory.  When all streams are written the document is rendered
 * using pdflualatex.
 */

module.exports = function (app, ctx, callback) {
  var config = ctx.configuration,
      latexTemp;
  config = config.mistore || {};
  latexTemp = config.latexTemp || '/tmp';
  app.use(function (req, res, next) {
    var mistore = req.mistore;
    function Backend(context, stream) {
      var blocker = this.blocker = null;
      function render() {
      }
      if (context.dependencies) {

        /*! Since we have to wait for all dependencies to be written to disk we
         * use a blocker instance to synchronize them. */

        blocker = new mistore.Blocker(context.dependencies.length);
        blocker.once('end', render);
      } else {
        process.nextTick(render);
      }
    }
    Backend.dependencyStream = function (name) {
      var s =  fs.createWriteStream(path.join(latexTemp, name));
      this.blocker.push(s);
      return s;
    };
    mistore.backend.latex = Backend;
  });
  callback();
};
