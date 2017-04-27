#!/usr/bin/env node
var program = require('commander');
var programutils = require('./commandutils');

program
    .command('package', 'Handles interaction with the AEM Package Manager')
    .command('report', 'Handles report generation');

program.parse(process.argv);
