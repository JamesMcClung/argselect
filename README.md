# argselect

A VS Code extension for selecting and manipulating arguments (or parameters) of functions.

## Added Commands

### `argselect.selectArg`
_default keybinding: `ctrl-up`_

This command expands the current selection to include increasingly more of the current argument:

![feature X](images/ctrl-up.gif)

### `argselect.moveArgLeft` and `argselect.moveArgRight`
_default keybindings: `ctrl-left`, `ctrl-right`_

If nothing is selected, these commands move the cursor one argument to the left or right:

![feature X](images/ctrl-lr.gif)
    
However, if parts of one or more arguments are selected, these commands move the selected argument(s) to the left or right:

![feature X](images/ctrl-lr-sel.gif)

## Added Settings

This extension does not currently add any settings.

## Requirements

This extension has no requirements.

## Known Issues

See https://github.com/JamesMcClung/argselect/issues

## Release Notes

### 1.1.0

Fixed a bug that caused each command to fail when the arguments contained a string.

### 1.0.0

Added `argselect.selectArg`, `argselect.moveArgLeft`, and `argselect.moveArgRight` commands.
