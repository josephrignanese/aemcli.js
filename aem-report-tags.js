#!/usr/bin/env node
var program = require('commander');
var programutils = require('./commandutils');
var httpclient = require('superagent'); // TODO: use promise wrapper - bluebird
var xlsx = require('xlsx');

const ALPHA = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P', 'Q','R','S','T','U','V','W','X','Y','Z'];

var DEFAULT_ROOT_PATH = '/etc/tags';
var DEFAULT_LIMIT = 30;

var TAG_PLACEHOLDER = '%TAG%';

// List of tags with count: /etc/tags.tags.json?_dc=1493173517570&start=0&limit=30&count=true
var URL_TAG_LIST = TAG_PLACEHOLDER + '.tags.json';
// List of tagged items: /bin/tagcommand?cmd=list&path=%2Fetc%2Ftags%2Fmycategory%2Fmytag
var URL_TAGGED_ITEMS = '/bin/tagcommand';

programutils.setCommonOptions(program);

program
    .option('-r, --root-path <root-path>', 'When reporting start from this point. Default is /etc/tags', /^\/etc\/tags([\/].+)?$/, DEFAULT_ROOT_PATH)
    .option('-l, --limit <limit>', 'The tag pagination limit. Default is 30', /^[0-9]+$/, DEFAULT_LIMIT);

program.arguments('<file>');

var tags = new Array(0);
var tagLists = { paths: new Set() };
var fileName;
var limit;

var handler = function(file) {
    console.info('Executing tag report and outputting to file %s for %s', file, program.url);
    limit = program.limit ? parseInt(program.limit, 10) : DEFAULT_LIMIT; // Limit needs to be an int

    console.log('Root path set to %s', program.rootPath);
    console.log('Limit set to %s', program.limit);
    console.log('Output file set to %s', file);

    fileName = file;

    handleTag(program.rootPath, 0);
};

var handleTag = function (tag, start) {
    var tagUrl = URL_TAG_LIST.replace(new RegExp(TAG_PLACEHOLDER, 'g'), tag);
    console.log('Getting tag list for tag %s with start %s and limit %s. API url is: %s', tag, start, limit, tagUrl);
    httpclient
        .get(program.url + tagUrl)
        .auth(program.username, program.password)
        .set('Accept', 'application/json')
        .query({
            start: start,
            limit: limit,
            count: 'true'
        })
        .end(function (err, res) {
            if (!err && res.ok) {
                var results = res.body.results;
                console.log("Tag %s has %s children", tag, results);
                tagLists[tag] = results; // Track results count
                tagLists.paths.add(tag);

                res.body.tags.forEach(function (rawTag) {
                    handleTag(rawTag.path, 0);
                });

                handleTagList(res.body.tags);
                start = start + limit;
                if (results > start) {
                    handleTag(tag, start);
                }
            } else {
                console.error('Error during get tag list, %s', err);
                if (err.response)
                    console.error('API Response code: %s, body: %s',
                        err.response.status,
                        err.response.body);
                else
                    console.error('No response from API');
                process.exit(1);
            }
        });
}

var handleTagList = function (rawTags) {
    //DEBUG: console.log('Processing %s tags', rawTags.length);
    rawTags.forEach(function(rawTag) {
        var tag = {path: rawTag.path, count: rawTag.count};
        getTaggedItems(tag);
    });
};

var getTaggedItems = function (tag) {
    console.log("Getting tagged items for tag with path %s", tag.path);
    httpclient
        .get(program.url + URL_TAGGED_ITEMS)
        .auth(program.username, program.password)
        .set('Accept', 'application/json')
        .query({
            cmd: 'list',
            path: tag.path
        })
        .end(function (err, res) {
            if (!err && res.ok) {
                tag.taggedItems = res.body.taggedItems;
                console.log('Tag %s has %s items tagged', tag.path, res.body.results);
                tags.push(tag);
                writeOutput();
            } else {
                console.error('Error during get tagged items list, %s', err);
                if (err.response)
                    console.error('API Response code: %s, body: %s',
                        err.response.status,
                        err.response.body);
                else
                    console.error('No response from API');
                process.exit(1);
            }
        });
}

var writeOutput = function() {
    // TODO: remove this once we are using promises.
    if (!checkDataIsReady()) {
        //DEBUG: console.log('checkDataIsReady returned false, skipping execution');
        return;
    }

    console.log('Producing report for %s tags', tags.length);

    var wb = {}; //workbook
    wb.SheetNames = [];
    wb.Sheets = {};

    // Set up summary sheet with headers
    var ss = {};
    var ssCols = ['Path', 'Count'];
    var ssLineNum = 1;
    ss['!ref'] = 'A1:' + getCellReference(ssCols.length - 1, tags.length + 1);
    ss['!cols'] = [];
    for(var i = 0; i < ssCols.length; i++){
        ss['!cols'].push( {wch: 100} );
        var currentCell = getCellReference(i, ssLineNum);
        ss[currentCell] = { t: "s", v: ssCols[i], s: { font: { bold: true } } };
    }
    ssLineNum++;
    wb.SheetNames.push('Summary');
    wb.Sheets['Summary'] = ss;

    // Set up data sheet with headers
    var ds = {};
    var dsCols = ['Tag Path', 'Item Path'];
    var dsLineNum = 1;
    ds['!ref'] = 'A1:';
    ds['!cols'] = [];
    for(var i = 0; i < dsCols.length; i++){
        ds['!cols'].push( {wch: 100} );
        var currentCell = getCellReference(i, dsLineNum);
        ds[currentCell] = { t: 's', v: dsCols[i], s: { font: { bold: true } } };
    }
    dsLineNum++;
    wb.SheetNames.push('Data');
    wb.Sheets['Data'] = ds;

    tags.forEach(function(tag) {
        ss[getCellReference(0, ssLineNum)] = { t: 's', v: tag.path };
        ss[getCellReference(1, ssLineNum)] = { t: 'n', v: tag.count };
        ssLineNum++;

        tag.taggedItems.forEach(function (taggedItem) {
            ds[getCellReference(0, dsLineNum)] = { t: 's', v: tag.path };
            ds[getCellReference(1, dsLineNum)] = { t: 's', v: taggedItem.path };
            dsLineNum++;
        });
    });

    ds['!ref'] += getCellReference(dsCols.length - 1, dsLineNum - 1);

    // Finally we write it to a file
    xlsx.writeFile(wb, fileName);
}

var checkDataIsReady = function() {
    // Only proceed if the count matches
    // Note: Test is not completely accurate as some requests can still be in progress.
    var tagCount = 0;
    tagLists.paths.forEach(function (path) {
        //DEBUG: console.log("Check: Tag %s has %s children", path, tagLists[path]);
        tagCount = tagCount + tagLists[path];
        //DEBUG: console.log('tagCount is %s after path %s', tagCount, path);
    });
    //DEBUG: console.log('checkDataIsReady comparing tags processed (%s) with expected amount (%s)', tags.length, tagCount);
    return tagCount == tags.length; // All tags have been added
}

// Sourced from https://talesofthefluxfox.com/2016/10/07/writing-to-xlsx-spreadsheets-in-node-js/
var getCellReference = function (index, lineNumber) {
    return (index > 25) ? ALPHA[Math.floor((index/26)-1)] + ALPHA[index % 26] + lineNumber : ALPHA[index] + lineNumber;
}

program.action(handler);
program.parse(process.argv);

programutils.handleNoAction(program);