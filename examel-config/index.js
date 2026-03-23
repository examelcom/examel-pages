/**
 * EXAMEL CONFIG — Master export
 * require('./examel-config') gives you everything
 */

const urls = require('./urls');
const components = require('./components');
const registry = require('./registry');
const validator = require('./validator');
const safeWrite = require('./safe-write');
const dataGate = require('./data-gate');

module.exports = {
  ...urls,
  ...components,
  ...registry,
  ...validator,
  ...safeWrite,
  ...dataGate
};
