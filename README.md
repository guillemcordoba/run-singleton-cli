# singleton-cli
Node CLI tool to run a process only once in a directory.

This CLI tool will check if the given process is already being run in the same directory. If it's not running, it will start the process as normal. If it's already running, it will not run it.

This is useful if you need to execute multiple parallel processes but only want a singleton execution of one of the subprocesses.

## Usage

```json
{
  "name": "where",
  "version": "0.0.2",
  "scripts": {
    "build:watch": "run-singleton \"tsc -w\""
  },
  "devDependencies": {
    "run-singleton-cli": "^0.0.2"
  }
}
```