#!/usr/bin/env node
var program = require('commander');
var programutils = require('./commandutils');
var httpclient = require('superagent');

var SERVICE_URL = '/crx/packmgr/service/.json';

programutils.setCommonOptions(program);

program
    .arguments('<file>')
    .option('-n, --upload', 'Only upload and do not install the package')
    .option('-d, --dry-run', 'Uploads the package and performs a dry-run installation')
    .option('-f, --force', 'Force the replacement of an existing package')
    .option('-r, --recursive', 'When installing, recursively install the package')
    .option('-a, --ac-handling <mode>', 'Set access control handling on the install', /^(ignore|overwrite|clear)$/i, 'overwrite');

var handler = function(file) {
    console.info('Executing upload for %s on %s', file, program.url);

    var pauseInstallationNodeCount = getPauseInstallationNodeCount();
    if (pauseInstallationNodeCount != 0) {
        console.warn('Detected %s pauseInstallation nodes. Installation may not behave as expected.', pauseInstallationNodeCount);
    }

    var installPath;

    httpclient
        .post(program.url + SERVICE_URL)
        .auth(program.username, program.password)
        .set('Accept', 'application/json')
        .query({
            cmd: 'upload',
            force: program.force ? 'true' : 'false'
        })
        .attach('package', file)
        .end(function (err, res) {
            if (!err && res.ok) {
                console.log('API success: %s', res.body.success);
                console.log('API message: %s', res.body.msg);
                if (res.body.success) {
                    installPath = res.body.path;
                    handleUploadComplete(installPath);
                } else {
                    console.error('Package upload was not successful. Message recieved: %s', res.body.msg);
                    process.exit(1);
                }
            } else {
                console.error('Error during upload, %s', err);
                if (err.response)
                    console.error('API Response code: %s, body: %s',
                        err.response.status,
                        err.response.body);
                else
                    console.error('No response from API');
                process.exit(1);
            }
        });

};

var handleUploadComplete = function (installPath) {
    console.log("Package uploaded to %s%s", program.url, installPath);

    if (program.upload) {
        process.exit(0); // We are finished
    }

    // Proceed with the install
    var serviceCmd = program.dryRun ? 'dryrun' : 'install';
    console.log("Proceeding with install (mode=%s)", serviceCmd);

    httpclient
        .post(program.url + SERVICE_URL + installPath)
        .auth(program.username, program.password)
        .set('Accept', 'application/json')
        .query({
            cmd: serviceCmd,
            recursive: program.recursive ? 'true' : 'false',
            force: program.force ? 'true' : 'false',
            acHandling: program.acHandling
        })
        .end(function (err, res) {
            if (!err && res.ok) {
                console.log('API success: %s', res.body.success);
                console.log('API message: %s', res.body.msg);
                if (res.body.success) {
                    handleInstallComplete();
                } else {
                    console.error('Package install was not successful. Message received: %s', res.body.msg);
                    process.exit(1);
                }
            } else {
                console.error('Error during install, %s', err);
                if (err.response)
                    console.error('API Response code: %s, body: %s',
                        err.response.status,
                        err.response.body);
                else
                    console.error('No response from API');
                process.exit(1);
            }
        });

};

var getPauseInstallationNodeCount = function () {
    httpclient
        .get('/bin/querybuilder.json')
        .set('Accept', 'application/json')
        .query('path=/system/sling/installer/jcr/pauseInstallation')
        .end(function (err, res) {
            if (!err && res.ok) {
                return res.body.total;
            } else {
                return -1;
            }
        });
}

var handleInstallComplete = function () {
    // TODO
    // Package is installed. Check the state of the server
    // Verify that there are no pauseInstallation nodes
    // Verify that the bundles are all active
}

program.action(handler);
program.parse(process.argv);

programutils.handleNoAction(program);