var events = require('events'),
    util = require('util'),
    request = require('supertest'),
    express = require('express'),
    mistore = require('..');
require('should');
describe(
  'mistore',
  function () {
    it(
      'should fetch and render the template',
      function (done) {
        function Stream() {
          events.EventEmitter.call(this);
          var buffer = '';
          function write(data, encoding) {
            buffer += data;
          }
          function end() {
            write.apply(this, arguments);
            this.emit('end');
          }
          this.__defineGetter__(
            'buffer',
            function () {
              return buffer;
            }
          );
          this.write = write;
          this.end = end;
        }
        util.inherits(Stream, events.EventEmitter);
        var stream = new Stream(),
            app = express();
        app.use(function (req, res, next) {

          /* We have to fake the database backend.  Mistore relies on the get
           * function only so we can easily control which document is
           * fetched. */

          req.db = {
            get: function (name, callback) {
              if (name === 'main-doc') {
                callback(
                  null,
                  {
                    template: 'template-text',
                    type: 'Latex',
                    dependencies: ['dep-doc']
                  }
                );
              } else {
                callback(
                  null,
                  {
                    template: 'dep-template-text',
                    type: 'latexInc'
                  }
                );
              }
            }
          };
          next();
        });
        mistore(
          app,
          function () {
            app.use(function (req, res, next) {
              var backend,
                  LatexInc,
                  mistore;
              function Backend() {
                this._dependencyStreams = [];
              }
              Backend.prototype.start = function (doc, stream, arg, next) {
                var s = this._dependencyStreams;
                doc.template.should.equal('template-text');
                s[0].buffer.should.equal('dep-test');
                stream.end('test');
                next();
              };
              Backend.prototype.dependencyStream = function (name) {
                var s = new Stream();
                this._dependencyStreams.push(s);
                return s;
              };
              mistore = req.mistore;
              mistore.backend.Latex = Backend;
              mistore.backend.latexInc = function () {
              };
              LatexInc = mistore.backend.latexInc;
              LatexInc.prototype.start = function (ctx, stream, arg, next) {
                ctx.template.should.equal('dep-template-text');
                stream.end('dep-test');
                next();
              }
              next();
            });
            app.get(
              '/',
              function (req, res) {
                var stream = new Stream();
                req.mistore.render(
                  'main-doc',
                  stream,
                  function (error) {
                    if (error) {
                      done(error);
                    } else {
                      try {
                        stream.buffer.should.equal('test');
                        res.end();
                      } catch (x) {
                        done(x);
                      }
                    }
                  }
                );
              }
            );
            request(app)
              .get('/')
              .end(done);
          }
        );
      }
    );
  }
);
