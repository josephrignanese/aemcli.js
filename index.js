#!/usr/bin/env node
var program = require("commander");
var programutils = require("./commandutils");

programutils.setCommonOptions(program);

program
    .command("package", "Handles interaction with the AEM Package Manager");

program.parse(process.argv);

