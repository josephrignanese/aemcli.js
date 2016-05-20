#!/usr/bin/env node
var program = require("commander");
var programutils = require("./commandutils");

programutils.setCommonOptions(program);

program
    .command("install", "Install a package");

program.parse(process.argv);