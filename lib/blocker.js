var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;

/**
 * This little helper class can be used to synchronize the dependency stream.
 * It wraps a dependency array and waits for all contained streams to be ended.
 */

function Blocker(length) {
  Blocker.super_();

  /**
   * The streams attribute saves the streams expected to return.
   *
   * @api private
   */

  this.length = length;
  this.streams = [];
  this.counter = 0;
}
inherits(Blocker, EventEmitter);

/**
 * The arrived counter counts the returned streams.
 *
 * @api private
 */

Blocker.prototype.arrived = function () {
  ++this.counter;
  if (this.counter === this.length) {

    /*! If we detect that the blocker is full, we fire the end event for all
     * streams. */

    this.counter = 0;
    this.emit('end', this.streams);
  }
};
Blocker.prototype.push = function (stream) {
  this.streams.push(stream);
  stream.once(
    'end',
    this.arrived.bind(this)
  );
};
module.exports = Blocker;
