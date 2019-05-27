import * as vscode from 'vscode';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as os from 'os';
import * as opn from 'opn';

/*
 * Called when extension is activated. This happens the very first time the
 * command is executed
 */
export function activate(context: vscode.ExtensionContext) {

    // implements command declared in package.json file
    let disposable = vscode.commands.registerCommand('open-in-vim.open', function() {
        try {
            if (os.type().startsWith('Windows')) {
                const githubButton = 'View GitHub issue';
                const otherPluginButton = 'View alternative plugin';
                return vscode.window.showErrorMessage(`Windows isn't supported yet. ლ(ಠ_ಠლ)`, otherPluginButton, githubButton).then((choice?: string) => {
                    switch(choice) {
                        case githubButton: {
                            opn("https://github.com/jonsmithers/vscode-open-in-vim/issues/2")
                            break;
                        }
                        case otherPluginButton: {
                            opn("https://marketplace.visualstudio.com/items?itemName=mattn.OpenVim")
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                });
            }
            openInVim();
        } catch(e) {
            console.error(e);
            vscode.window.showErrorMessage("Open in Vim failed: " + e);
        }
    });

    context.subscriptions.push(disposable);
}

/*
 * Called when extension is deactivated
 */
export function deactivate() {
}

type Config = {
    openMethod: OpenMethodKey;
    useNeovim: boolean;
    restoreCursorAfterVim: boolean;
    linux?: {
        'gnome-terminal'?: {
            args: string
        };
        tilix?: {
            args: string
        };
    },
    macos?: {
        iterm: {
            profile: string;
        }
    }
}
function getConfiguration(): Config {
    let configuration = vscode.workspace.getConfiguration()["open-in-vim"]

    let openMethodLegacyAliases = [
        ["osx.iterm",  "macos.iterm"],
        ["osx.macvim", "macos.macvim"]
    ];
    for (let [legacyValue, newValue] of openMethodLegacyAliases) {
        if (configuration.openMethod == legacyValue) {
            configuration.openMethod = newValue;
        }
    }

    return configuration
}

function openInVim() {
    const { openMethod, useNeovim, restoreCursorAfterVim } = getConfiguration();

    let activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
        vscode.window.showErrorMessage('No active editor.');
        return;
    }
    if (activeTextEditor.document.isUntitled) {
        vscode.window.showErrorMessage('Please save the file first.');
        return;
    }
    if (activeTextEditor.document.isDirty) {
        activeTextEditor.document.save();
    }

    let actualOpenMethod = openMethods[openMethod];
    if (!actualOpenMethod) {
        let availableMethods = Object.keys(openMethods).map(name => `"${name}"`).join(", ");
        vscode.window.showErrorMessage(`Check your settings. Method "${openMethod}" is not supported. Currently, you can use ${availableMethods}.`);
        return;
    }

    let workspace = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri);
    if (!workspace) {
        // current file doesn't belong to any open workspace
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length) {
            // default to first available workspace
            workspace = vscode.workspace.workspaceFolders[0]
            vscode.window.setStatusBarMessage(`OpenInVim defaulted vim working dir to ${workspace.name}`, 5000);
            var workspacePath = workspace.uri.path;
        } else {
            // NO workspaces are open, so just use home
            vscode.window.setStatusBarMessage(`OpenInVim defaulted vim working dir to HOME`, 5000);
            if (!process.env.HOME) throw new Error('$HOME is not defined');
            var workspacePath = process.env.HOME;
        }
    } else {
        var workspacePath = workspace.uri.path;
    }

    let position = activeTextEditor.selection.active;
    let fileName = activeTextEditor.document.fileName;
    let line = position.line+1
    let column = position.character+1
    let autocmdArgToSyncCursor = `'+autocmd VimLeavePre * execute \"!code --goto \" . expand(\"%\") . \":\" . line(\".\") . \":\" . col(\".\")'`
    let vimCommand = `${useNeovim ? 'nvim' : 'vim'} '${fileName}' '+call cursor(${line}, ${column})' ${restoreCursorAfterVim ? autocmdArgToSyncCursor : ''}; exit` // cannot contain double quotes
    let getScript = () => {
        let tmpFile = tmp.fileSync();
        fs.writeFileSync(tmpFile.name, `
            cd ${workspacePath}
            ${vimCommand}
        `);
        return tmpFile.name;
    }

    actualOpenMethod({ workspacePath, vimCommand, getScript });
}

type OpenMethodKey = 'gvim' | 'integrated-terminal' | 'linux.gnome-terminal' | 'linux.tilix' | 'macos.iterm' | 'macos.macvim';
interface OpenMethodsArgument {
    getScript: () => string;
    vimCommand: string;
    workspacePath: string;
}
type OpenMethods = {
    [key in OpenMethodKey]: (a: OpenMethodsArgument) => void;
}

const openMethods: OpenMethods = {
    "gvim": function({workspacePath, vimCommand}: OpenMethodsArgument) {
        vimCommand = vimCommand.replace(/^vim|^nvim/, 'gvim');
        require('child_process').execSync(vimCommand, {
            cwd: workspacePath,
            encoding: "utf8"
        });
    },
    "integrated-terminal": function({getScript}: OpenMethodsArgument) {
        let terminal = vscode.window.createTerminal({name: "Open in Vim", shellPath: "/bin/bash", shellArgs: [getScript()]});
        terminal.show(true);
        vscode.commands.executeCommand("workbench.action.terminal.focus");
    },
    "linux.gnome-terminal": function({getScript}: OpenMethodsArgument) {
        let args = getConfiguration().linux!['gnome-terminal']!.args;
        let gnomeTerminalCommand = `gnome-terminal ${args} --command='bash ${getScript()}'`
        require('child_process').execSync(gnomeTerminalCommand);
    },
    "linux.tilix": function({getScript}: OpenMethodsArgument) {
        let args = getConfiguration().linux!.tilix!.args;
        let tilixCommand = `tilix ${args} --command='bash ${getScript()}'`
        require('child_process').execSync(tilixCommand);
    },
    "macos.iterm": function({getScript}: OpenMethodsArgument) {
        let profile = getConfiguration().macos!.iterm!.profile;
        if (profile !== "default profile") {
            profile = `profile "${profile}"`
        }
        let osascriptcode = `
            tell application "iTerm"
              set myNewWin to create window with ${profile} command "bash ${getScript()}"
            end tell
        `;
        let result = require('child_process').spawnSync("/usr/bin/osascript", {encoding: "utf8", input: osascriptcode})
        if (result.error) {
            throw result.error;
        }
        if (result.stderr) {
            throw result.stderr;
        }
    },
    "macos.macvim": function({workspacePath, vimCommand}: OpenMethodsArgument) {
        vimCommand = vimCommand.replace(/^vim|^nvim/, 'mvim');
        require('child_process').execSync(vimCommand, {
            cwd: workspacePath,
            encoding: "utf8"
        });
    },
};
