#!/usr/bin/env node
var program = require('commander');
var programutils = require('./commandutils');

program
    .command('tags', 'Produces a report on tags in the system');

program.parse(process.argv);