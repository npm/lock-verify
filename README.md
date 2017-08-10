# lock-verify

Report if your package.json is out of sync with your package-lock.json.

## USAGE

Call it with no arguments to verify the current project's lock file.  Errors
are printed out to stdout and the status code set to 1.

```
$ npx lock-verify
Invalid: lock file's example@2.1.0 does not satisfy example@^1.1.0
Errors found
$
```


Call it with a path to a project to verify that project's lock file. If there
are no errors, it prints nothing and the status code is 0.


```
$ npx lock-verify /path/to/my/project
$
```
