(function CommandUtils() {

    function increaseVerbosity(v, total) {
        return total + 1;
    }

    /**
     * Sets a number of common options. This can be called by subcommands before the arguments are processed to set
     * options that will be common to all commands.
     *
     * @param program   commander object.
     */
    module.exports.setCommonOptions = function (program) {
        var packageJson = require('./package.json');

        program
            .version(packageJson.version)
            .option('-u, --username <username>', 'The user to authenticate as. Default is admin', 'admin')
            .option('-p, --password <password>', 'The user\'s password. Default is admin', 'admin')
            .option('-U, --url <url>', 'The url of the instance. Default is http://localhost:4502', 'http://localhost:4502')
            .option('-v, --verbose', 'Logging verbosity', increaseVerbosity, 0)
            .option('-s, --silent', 'Supressess all output');
    };

    /**
     * Outputs the commander help message when no arguments are provided
     *
     * @param program   commander object.
     */
    module.exports.handleNoAction = function (program) {
        if (!process.argv.slice(2).length) {
            program.help();
        }
    };

    // TODO: Check for a logging framework
    module.exports.error = function (program, message) {
        if (program.silent || program.verbose < 1) {
            return;
        }
        console.error(message);
    };

    module.exports.warn = function (program, message) {
        if (program.silent || program.verbose < 1) {
            return;
        }
        console.warn(message);
    };

    module.exports.info = function (program, message) {
        if (program.silent || program.verbose < 1) {
            return;
        }
        console.info(message);
    };

    module.exports.debug = function (program, message) {
        if (program.silent || program.verbose < 1) {
            return;
        }
        console.log(message.length);
        console.log(message);
    };

}());