#!/usr/bin/env node

const asp_analyzer = require("./analyze.js")({});
const optsBuilder = require('./opts_builder.js');

asp_analyzer.start(optsBuilder.getOpts());

