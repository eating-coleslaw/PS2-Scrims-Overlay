"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// colored console output
function red(value) { return `\x1b[35m${value}\x1b[0m`; }
function green(value) { return `\x1b[36m${value}\x1b[0m`; }
function yellow(value) { return `\x1b[33m${value}\x1b[0m`; }

exports.red		= red;
exports.green	= green;
exports.yellow	= yellow;
