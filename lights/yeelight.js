'use strict';

const net = require('net');
const { EventEmitter } = require('events');

class Bulb extends EventEmitter {
  constructor(bulb, port) {
    super();

    this.bulb = bulb;
    this.port = port || 55443;
    this.connected = false;
  }

  connect() {
    this.client = new net.Socket();
    this.cmdId = 0;

    this.props = {};

    this.messageHandler = {
      props: this.onProps.bind(this)
    };

    this.waitingRequest = new Map();

    this.client.connect(this.port, this.bulb, this._onConnected.bind(this));

    this.client.on('data', this._onData.bind(this));
    this.client.on('close', this._onClose.bind(this));
    this.client.on('error', this._onError.bind(this));
  }

  disconnect() {
    this.client.end();
  }

  _onData(data) {
    try {
      const r = JSON.parse(data.toString());
      if (r && r.method && this.messageHandler[r.method]) {
        this.messageHandler[r.method](r.params);
        this.emit('props', this);
      } else {
        if (
          Number.isInteger(r.id) &&
          Array.isArray(r.result) &&
          r.result.length === 1
        ) {
          const [re] = r.result;

          const request = this.waitingRequest.get(r.id);
          this.waitingRequest.delete(r.id);

          if (re !== 'ok') {
            // console.log('retry', request);
            setTimeout(this.sendCmd.bind(this, request), 500);
          }
        }
        this.emit('data', this, r);
      }
    } catch (e) {
      this._onError(e);
    }
  }

  _onConnected() {
    // console.log('_onConnected');
    this.connected = true;

    this.emit('connected', this);
  }

  _onError(err) {
    // console.log(`_onError, ${err}`);

    this.emit('error', this, err);
  }

  _onClose() {
    // console.log('_onClose');
    this.connected = false;

    this.emit('disconnected', this);
  }

  onProps(prop) {
    // console.log('onProps', prop);
    for (const p in prop) {
      if (p in prop) {
        this.props[p] = prop[p];
      }
    }
  }

  toggle() {
    this.sendCmd({
      params: ['smooth', 300],
      method: 'toggle'
    });
  }

  off() {
    this.sendCmd({
      params: ['off', 'smooth', 300],
      method: 'set_power'
    });
  }

  onn() {
    this.sendCmd({
      params: ['on', 'smooth', 300],
      method: 'set_power'
    });
  }

  brightness(value) {
    this.sendCmd({
      params: [value, 'smooth', 300],
      method: 'set_bright'
    });
  }

  addBrightness(delta) {
    let current = this.props['bright'];
    let value = 50;
    if (current) {
      if (current + delta > 100)
        value = 100;
      else if (current + delta < 1)
        value = 1;
      else
        value = current + delta;
    }
    this.sendCmd({
      params: [value, 'smooth', 300],
      method: 'set_bright'
    });
  }

  temperature(value){
    this.sendCmd({
      params: [value, 'sudden', 300],
      method: 'set_ct_abx'
    })
  }

  color(r, g, b) {
    this.sendCmd({
      params: [r * 65536 + g * 256 + b, 'smooth', 300],
      method: 'set_rgb'
    });
  }

  sendCmd(cmd) {
    cmd.id = this.cmdId++;
    this.waitingRequest.set(cmd.id, cmd);
    this.client.write(`${JSON.stringify(cmd)}\r\n`);
  }

  status() {
    return this.props;
  }
}

module.exports = {
    Bulb,
    toggle: (bulb) => {
        bulb.toggle();
    },
    on: (bulb) => {
        bulb.onn();
    },
    off: (bulb) => {
        bulb.off();
    },
    brightness: (bulb, level) => {
        bulb.brightness(level);
    },
    temperature: (bulb, temp) => {
        bulb.temperature(temp);
    },
    color: (bulb, r, g, b) => {
        bulb.color(r, g, b);
    },
    addBrightness: (bulb, delta) => {
      bulb.addBrightness(delta);
    }
};