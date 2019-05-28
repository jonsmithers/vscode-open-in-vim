# Open in Vim

Open current file in vim. To activate this extension, open the [Command
Palette] (Ctrl+Shift+P on linux or ⇧⌘P on mac) and search for "Open in Vim".
Alternatively, you can [assign a keyboard shortcut of your choosing].

[Command Palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[assign a keyboard shortcut of your choosing]: https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor

Windows is not supported.

Contribute on [GitHub](https://github.com/jonsmithers/vscode-open-in-vim).

## Extension Settings

* **`open-in-vim.openMethod`**: specifies how vim should be launched. Allowed
  values are tabulated below.

  | value                  | description                                               |
  | ---------------------- | --------------------------------------------------------- |
  | `gvim`                 | Open in gVim.                                             |
  | `integrated-terminal`  | (DEFAULT) Open vim in VSCode's integrated terminal.       |
  | `linux.gnome-terminal` | Open vim in gnome-terminal (full-screen).                 |
  | `linux.tilix`          | Open vim in [Tilix](https://gnunn1.github.io/tilix-web/). |
  | `macos.iterm`          | Open vim in iTerm2.                                       |
  | `macos.macvim`         | Open in MacVim.                                           |

* **`open-in-vim.useNeovim`**: whether to launch vim or neovim (ignored when
  `openMethod` is set to gvim/macvim).
* **`open-in-vim.restoreCursorAfterVim`**: *(EXPERIMENTAL)* syncs cursor
  position from vim to vscode when you close vim. Assumes that the `code`
  executable is in the *$PATH*.
* Other settings for specific openMethods are tabulated below:
  
  | Setting                                 | Description                                                                                | Default                        |
  | --------------------------------------- | -------------------------------------------------------------------------------------------| ------------------------------ |
  | `open-in-vim.linux.gnome-terminal.args` | Space-separated arguments that get passed to `gnome-terminal`.                             | `--hide-menubar --full-screen` |
  | `open-in-vimlinux.tilix.args`           | Space-separated arguments that get passed to `tilix`.                                      | `--full-screen`                |
  | `open-in-vimmacos.iterm.profile`        | Name of iTerm profile to use (`default profile` is a special case to use iTerm's default). | `default profile`              |

## To do

- [ ] Support macOS' native Terminal app

## Inverse Plugin

If you'd like the inverse of this plugin (*Open in VSCode from Vim*), you can
just add the following vimrc line:

```
:command! OpenInVSCode exe "silent !code --goto '" . expand("%") . ":" . line(".") . ":" . col(".") . "'" | redraw!
```

(On Mac, you'll also need to open vscode and run the command `Install 'code'
command in PATH`)

If you additionally want to preserve the working directory, you can add `getcwd()` like so:

```
:command! OpenCwdInVSCode exe "silent !code '" . getcwd() . "' --goto '" . expand("%") . ":" . line(".") . ":" . col(".") . "'" | redraw!
```
