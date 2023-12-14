# Change Log

## v1.0.1

- Add keywords to package.json

## v1.0.0: Initial Release

- New command: `argselect.selectArg`
    - Default key binding: `ctrl+up`
    - Expands current selection to include increasingly more of the current argument
- New commands: `argselect.moveArgLeft` and `argselect.moveArgRight`
    - Default key bindings: `ctrl+left` and `ctrl+right`, respectively
    - If nothing is selected: moves cursor to the next argument on the left or right, respectively
    - If parts of one or more arguments are selected: moves the selected argument(s) to the left or right, respectively
- Tests of low-level helper functions