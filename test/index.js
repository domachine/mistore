var StringStream = require('string-stream'),
    mistore = require('..');
require('should');

/**
 * A simple mock to fake a mikenchin application.
 */

function Application() {
  this._cache = {};
}
Application.prototype.register = function (key, scope) {
  this._cache[key] = scope;
};
Application.prototype.require = function (key) {
  return this._cache[key];
};

/**
 * A mock to fake the nanu functionality.
 */

function Database(data) {
  this._data = data;
}
Database.prototype.get = function (doc, next) {
  next(null, this._data[doc]);
};
describe(
  'mistore',
  function () {
    var app;
    before(function (done) {
      var data;
      data = {
        'main-doc': {
          template: 'template-text',
          type: 'main',
          dependencies: ['dep-doc']
        },
        'dep-doc': {
          template: 'dep-template-text',
          type: 'dep'
        }
      };
      function MainBackend() {
        this._dependencyStreams = [];
      }
      MainBackend.prototype.start = function (doc, stream, arg, next) {
        var s = this._dependencyStreams;
        doc.template.should.equal('template-text');
        s[0].toString().should.equal('dep-test');
        stream.end('test');
        next();
      };
      MainBackend.prototype.dependencyStream = function (name) {
        var s = new StringStream();
        this._dependencyStreams.push(s);
        return s;
      };
      function DepBackend() {
      }
      DepBackend.prototype.start = function (ctx, stream, arg, next) {
        ctx.template.should.equal('dep-template-text');
        stream.end('dep-test');
        next();
      };
      app = new Application();
      app.register('nanu', new Database(data));
      mistore(app, function () {
        mistore = app.require('mistore');
        mistore.backend.main = MainBackend;
        mistore.backend.dep = DepBackend;
        done();
      });
    });
    it('should fetch and render the template', function (done) {
      var stream;
      stream = new StringStream();
      mistore.render(
        'main-doc',
        stream,
        function (error) {
          if (error) {
            done(error);
          } else {
            stream.toString().should.equal('test');
            done();
          }
        }
      );
    });
  }
);
