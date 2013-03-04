var fs = require('fs'),
    isArray = require('util').isArray,
    async = require('async'),
    files;
module.exports = function (app, ctx, callback) {
  app.use(function (req, res, next) {

    /**
     * Fetches the document with the given name and passes it to render.
     *
     * @param {String} key The name of the desired document.
     * @param {Stream} stream The stream to write the output to.
     * @param {Object} arg Optional argument to the renderers.
     */

    function render(key, stream, arg, callback) {

      /* The render function first retrieves the desired document.  This is
       * the place where we should implement a cache mechanism to avoid
       * unnecessary retrievals. */

      if (typeof arg === 'function') {
        callback = arg;
        arg = null;
      }
      stream.once('end', callback);
      if (typeof key === 'string') {
        req.db.get(
          key,
          function (error, res) {
            if (error) {
              callback(error);
            } else {
              _render(res, stream, arg, callback);
            }
          }
        );
      }
      else if (typeof key === 'object') {
        _render(key, stream, arg, callback);
      }
    }
    function _render(doc, stream, arg, callback) {
      var backend,
          dependencyFactory,
          error;

      /* The right backend is choosen using the type field of the
       * document. */

      backend = req.mistore.backend[doc.type];
      if (backend == null) {
        error = new Error(
          [
            'no_backend: No backend to handle type',
            doc.type
          ].join(' ')
        );
        error.error = 'no_backend';
        callback(error);
      } else {

        /* Notice that the last action is triggered asynchronously
         * exactly like the resolution of the dependencies.  This makes
         * sure that we won't get stackoverflows in large dependency
         * trees but means also that the backend needs to make sure that
         * all dependencies are rendered before using them. */

        backend = new backend(doc, stream, arg);
        if (isArray(doc.dependencies)) {
          async.forEach(
            doc.dependencies,
            function (d, callback) {
              render(d, backend.dependencyStream(d), callback);
            }
          );
        }
      }
    }
    req.mistore = {
      render: render,
      backend: {}
    };
    next();
  });
  callback();
};

/* Load all available backends into namespace. */

module.exports.backend = {};
files = fs.readdirSync(__dirname + '/backend');
files.forEach(
  function (f) {
    var m = f.match(/^(.+)\.js/);
    if (m) {
      module.exports.backend[m[1]] = require('./backend/' + m[1]);
    }
  }
);
module.exports.Blocker = require('./blocker');
