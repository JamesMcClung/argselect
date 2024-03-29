# Change Log

## v2.1.0

- Fix https://github.com/JamesMcClung/argselect/issues/8

## v2.0.0: Shift Select

- New commands: `argselect.selectArgLeft` and `argselect.selectArgRight`
    - Default keybindings: `shift+ctrl+left` and `shift+ctrl+right`, respectively
    - Jumps cursor left or right 1 argument, highlighting intermediate text

## v1.2.1

- Change "-" to "+" in keybinding descriptions in readme

## v1.2.0

- Fix https://github.com/JamesMcClung/argselect/issues/3
- Fix https://github.com/JamesMcClung/argselect/issues/4
- Fix https://github.com/JamesMcClung/argselect/issues/5

## v1.1.2

- Improve error messages and suppress a particularly annoying one

## v1.1.1

- Update README release notes

## v1.1.0

- Fix https://github.com/JamesMcClung/argselect/issues/1

## v1.0.3

- Link to GitHub issues in README.md

## v1.0.2

- Update description in package.json

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