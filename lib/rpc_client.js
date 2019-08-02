'use strict';

const Base = require('sdk-base');
const net = require('net');
const Connection = require('connection');
const url = require('url');
const { encoder, decoder } = require('./index');

class RpcClient extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {Logger} options.logger -
   * @param {number} [options.connectTimeout] -
   * @param {Url} options.address -
   * @param {boolean} options.noDelay -
   */
  constructor(options) {
    super(Object.assign(
      {
        noDelay: true,
        connectTimeout: 3000,
      },
      options,
      { initMethod: '_init' }
    ));
    const protocol = {
      name: 'Bolt',
      encoder,
      decoder,
    };
    this._socket = net.connect(Number(this.address.port), this.address.hostname);
    this._socket.setNoDelay(this.options.noDelay);
    this.conn = new Connection({
      socket: this._socket,
      logger: this.logger,
      protocol,
      connectTimeout: this.connectTimeout,
      url: url.format(this.address),
    });
  }

  async _init() {
    await this.conn.ready();
    this.conn.on('error', err => this.emit('error', err));
    this.conn.once('close', () => this.emit('close'));
    this.conn.on('request', req => this.emit('request', req));
  }

  async _close() {
    if (this.conn) {
      await this.conn.close();
    }
  }

  async invoke(req) {
    return this.conn.writeRequest(req);
  }

  oneway(req) {
    return this.conn.oneway(req);
  }

  async response(req, res) {
    return this.conn.writeResponse(req, res);
  }

  get address() {
    return this.options.address;
  }

  get logger() {
    return this.options.logger;
  }

  get connectTimeout() {
    return this.options.connectTimeout;
  }
}

module.exports = RpcClient;
