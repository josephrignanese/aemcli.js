#!/usr/bin/env node
var program = require("commander");
var programutils = require("./commandutils");

programutils.setCommonOptions(program);

program
    .arguments("<file> <url>")
    .action(function(file, url) {
       console.log("TODO: install %s to %s", file, url);
    });

program.parse(process.argv);
