# Open in Vim

Open current file in vim. To activate this extension, press Cmd+Shift+P and
search for "Open in Vim".

Windows is not supported. This has not been tested on linux.

## Extension Settings

### `open-in-vim.openMethod`

| value                 | description                                         |
| --------------------- | --------------------------------------------------- |
| `integrated-terminal` | (DEFAULT) Open vim in VSCode's integrated terminal. |
| `osx.iterm`           | Open vim in iTerm2.                                 |

## To do

- investigate better ways to activate this extension
- support OSX's native Terminal app
- support linux!
- support neovim?

## Known Issues

VSCode doesn't automatically refresh its editor when changes are made to the
underlying file. Not sure how to address this yet.
