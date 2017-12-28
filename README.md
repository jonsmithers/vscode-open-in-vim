# Open in Vim

Open current file in vim. To activate this extension, press Cmd+Shift+P and
search for "Open in Vim" (alternatively, assign a Keyboard Shortcut).

Windows is not supported.

Contribute on [GitHub](https://github.com/jonsmithers/vscode-open-in-vim).

## Extension Settings

### `open-in-vim.openMethod`

| value                 | description                                         |
| --------------------- | --------------------------------------------------- |
| `integrated-terminal` | (DEFAULT) Open vim in VSCode's integrated terminal. |
| `osx.iterm`           | Open vim in iTerm2.                                 |
| `osx.macvim`          | Open in MacVim.                                     |

## To do

- support gVim!
- support OSX's native Terminal app
- support neovim?

## Inverse Plugin

If you'd like the inverse of this plugin (*Open in VSCode from Vim*), you can
just add the following vimrc line:

```
:command! VSCode exe "silent !code --goto %:" . line(".") . ":" . col(".") | redraw!
```

## Known Issues

On Mac, VSCode doesn't automatically refresh its editor when changes are made
to the underlying file (but it _does_ on Linux). Not sure how to address this
yet.
