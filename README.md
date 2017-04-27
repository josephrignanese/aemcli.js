# AEM Command Line Interface (CLI)

A command line interface for interacting with AEM APIs.

## Options available to all commands

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -u, --username <username>  The user to authenticate as. Default is admin
    -p, --password <password>  The user's password. Default is admin
    -U, --url <url>            The url of the instance. Default is http://localhost:4502
    -v, --verbose              Increase logging verbosity
    -s, --silent               Supressess all output


## Commands

### Package Install

  Usage: aem package install [options] <file>

  Options:

    -n, --upload               Only upload and do not install the package
    -d, --dry-run              Uploads the package and performs a dry-run installation
    -f, --force                Force the replacement of an existing package
    -r, --recursive            When installing, recursively install the package
    -a, --ac-handling <mode>   Set access control handling on the install


### Report Tags

  Usage: aem report tags [options] <file>

  Options:

    -r, --root-path <root-path>  When reporting start from this point. Default is /etc/tags
