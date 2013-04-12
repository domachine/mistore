var fs = require('fs'),
    isArray = require('util').isArray,
    async = require('async'),
    Blocker = require('./blocker'),
    files;
module.exports = function (app, next) {
  var db = app.require('nanu'),
      mistore;
  mistore = {
    render: render,
    backend: {}
  };
  app.register('mistore', mistore);

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
    if (typeof key === 'string') {
      db.get(
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
        error,
        blocker;

    /* The right backend is choosen using the type field of the
     * document. */

    backend = mistore.backend[doc.type];
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

      /*! Instantiate the backend. */

      backend = new backend();
      if (isArray(doc.dependencies)) {

        /*! And if there are dependencies render them before calling the main
         * backend. */

        blocker = new Blocker(doc.dependencies.length);
        blocker.once(
          'end',
          backend.start.bind(backend, doc, stream, arg, callback)
        );
        async.forEach(
          doc.dependencies,
          function (d, callback) {
            var stream = backend.dependencyStream(d);
            blocker.push(stream);
            render(d, stream, callback);
          }
        );
      } else {

        /*! If there are no dependencies we spawn the backend
         * asynchronously. */

        process.nextTick(
          backend.start.bind(backend, doc, stream, arg, callback)
        );
      }
    }
  }
  next();
};
