(function CommandUtils() {
    var co = require("co");

    function increaseVerbosity(v, total) {
        return total + 1;
    }

    module.exports.setCommonOptions = function (program) {
        program
            .option("-u, --username <username>", "The user to authenticate as")
            .option("-p, --password <password>", "The user's password")
            .option('-v, --verbose', 'Logging verbosity', increaseVerbosity, 0)

    }
}());