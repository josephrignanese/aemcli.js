#!/usr/bin/env node
var program = require('commander');
var programutils = require('./commandutils');

program
    .command('install', 'Installs a package');

program.parse(process.argv);