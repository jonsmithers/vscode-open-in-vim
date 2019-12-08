# Change Log
All notable changes to the "open-in-vim" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.6.0] - 2019-08-2019
### Added
- Support for integrated-terminal on Windows.

## [0.5.0] - 2019-05-29
### Added
- Configuration option to use Neovim instead of Vim.
- Experimental configuration option to sync vim's cursor position to vscode
  when it exits. It's possible this does not belong within the scope of this
  plugin.

### Fixed
- Upgrade vscode module to resolve flag for [potential (harmless) security
  vulnerability](https://nvd.nist.gov/vuln/detail/CVE-2018-20834)

## [0.4.3] - 2018-12-08
### Fixed
- Upgrade vscode module to address [event-stream security
  issue](https://github.com/dominictarr/event-stream/issues/116). Along with
  many others, vscode flagged this plugin as "problematic" and automatically
  uninstalled it. ([blog post link
  here](https://code.visualstudio.com/blogs/2018/11/26/event-stream))

## [0.4.2] - 2018-09-22
### Fixed
- Show helpful info for people who try to use this on Windows

## [0.4.1] - 2018-05-25
### Fixed
- Fix issue in reverse-plugin vim commands when line number starts with "8"
- Upgrade vscode module to address https://github.com/Microsoft/vscode-extension-vscode/issues/106, https://nvd.nist.gov/vuln/detail/CVE-2018-3728

## [0.4.0] - 2018-01-13
### Added
- Introduce Gnome Terminal support
- Introduce Tilix support
- Add option to customize iTerm profile

## [0.3.0] - 2018-01-04
### Fixed
- Rename `osx.iterm` and `osx.macvim` to `macos.iterm` and `macos.macvim` respectively. Legacy values still work.
- Downplay annoying warning regarding vim cwd to just a status bar message so user doesn't have to click to close.

## [0.2.1] - 2017-12-28
### Added
- Icon

## [0.2.0] - 2017-12-28
### Added
- Introduce gVim support

### Fixed
- Fix error caused by having 0 workspaces open

## [0.1.0]
### Added
- Introduce MacVim support

## [0.0.3]
### Fixed
- Always focus integrated terminal

## [0.0.1]
### Added
- Add configuration option to use integrated terminal or iterm

## [0.0.0]
- Initial release
