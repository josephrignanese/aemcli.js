#!/usr/bin/env node
var program = require('commander');
var programutils = require('./commandutils');

program
    .command('package', 'Handles interaction with the AEM Package Manager');

program.parse(process.argv);
