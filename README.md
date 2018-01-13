# Open in Vim

Open current file in vim. To activate this extension, press Cmd+Shift+P and
search for "Open in Vim" (alternatively, assign a Keyboard Shortcut).

Windows is not supported.

Contribute on [GitHub](https://github.com/jonsmithers/vscode-open-in-vim).

## Extension Settings

### `open-in-vim.openMethod`

| value                  | description                                               |
| ---------------------- | --------------------------------------------------------- |
| `gvim`                 | Open in gVim.                                             |
| `integrated-terminal`  | (DEFAULT) Open vim in VSCode's integrated terminal.       |
| `linux.gnome-terminal` | Open vim in gnome-terminal (full-screen).                 |
| `linux.tilix`          | Open vim in [Tilix](https://gnunn1.github.io/tilix-web/). |
| `macos.iterm`          | Open vim in iTerm2.                                       |
| `macos.macvim`         | Open in MacVim.                                           |

`osx.iterm` and `osx.macvim` are legacy values that still work.

### Other Settings

| value                                   | default                        | description                                                                               |
| --------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `open-in-vim.linux.gnome-terminal.args` | `--hide-menubar --full-screen` | Space-separated arguments that get passed to `gnome-terminal`.                            |
| `open-in-vim.linux.tilix.args`          | `--full-screen`                | Space-separated arguments that get passed to `tilix`.                                     |
| `open-in-vim.macos.iterm.profile`       | `default profile`              | Name of iTerm profile to use (`default profile` is a special case to use iTerm's default) |

## To do

- support macOS' native Terminal app

## Inverse Plugin

If you'd like the inverse of this plugin (*Open in VSCode from Vim*), you can
just add the following vimrc line:

```
:command! OpenInVSCode exe "silent !code --goto '%:" . line(".") . ":" . col(".") . "'" | redraw!
```

(On Mac, you'll also need to open vscode and run the command `Install 'code'
command in PATH`)
