import * as vscode from 'vscode';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as os from 'os';
import * as opn from 'opn';
import { execSync, spawnSync } from 'child_process';
import { WorkspaceFolder } from 'vscode';

/*
 * Called when extension is activated. This happens the very first time the
 * command is executed
 */
export function activate(context: vscode.ExtensionContext) {

    // implements command declared in package.json file
    let disposable = vscode.commands.registerCommand('open-in-vim.open', function() {
        try {
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
    integratedShellPath?: string,
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

    function getAlternateWorkspacePath(): string {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length) {
            // default to first available workspace
            const workspace = vscode.workspace.workspaceFolders[0]
            vscode.window.setStatusBarMessage(`OpenInVim defaulted vim working dir to ${workspace.name}`, 5000);
            return workspace.uri.path;
        } else {
            // NO workspaces are open, so just use home
            return os.homedir();
        }
    };

    const workspace = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri);
    let workspacePath = workspace ? workspace.uri.path : getAlternateWorkspacePath();

    if (os.type().startsWith('Windows')) {
        workspacePath = formatAsUnixFilePath(workspacePath);
    }

    let position = activeTextEditor.selection.active;
    let fileName = activeTextEditor.document.fileName;
    let line = position.line+1
    let column = position.character+1
    let autocmdArgToSyncCursor = `'+autocmd VimLeavePre * execute \"!code --goto \" . expand(\"%\") . \":\" . line(\".\") . \":\" . col(\".\")'`

    actualOpenMethod({
        vim: useNeovim ? 'nvim' : 'vim',
        fileName: fileName,
        // cannot contain double quotes
        args: `'+call cursor(${line}, ${column})' ${restoreCursorAfterVim ? autocmdArgToSyncCursor : ''}; exit`,
        workspacePath,
    });
}

type OpenMethodKey = 'gvim' | 'integrated-terminal' | 'linux.gnome-terminal' | 'linux.tilix' | 'macos.iterm' | 'macos.macvim';

interface OpenMethodsArgument {
    vim: string
    fileName: string
    args: string
    workspacePath: string;
}

type OpenMethods = {
    [key in OpenMethodKey]: (a: OpenMethodsArgument) => void;
}

function openArgsToCommand(openArgs: OpenMethodsArgument) {
    return `${openArgs.vim} '${openArgs.fileName}' ${openArgs.args}`
}

function openArgsToScriptFile(openArgs: OpenMethodsArgument) {
    let tmpFile = tmp.fileSync();
    fs.writeFileSync(tmpFile.name, `
            cd ${openArgs.workspacePath}
            ${openArgsToCommand(openArgs)}
        `);
    return tmpFile.name;
}

/** example: converts `\c:\test\file.txt` to `/c/test/file.txt` */
function formatAsUnixFilePath(winPath: string): string {
    return winPath.replace(/^\/?(\w):/, '/$1').replace(/\\/g, '/');
}

const openMethods: OpenMethods = {
    "gvim": function(openArgs: OpenMethodsArgument) {
        openArgs.vim = 'gvim'
        execSync(openArgsToCommand(openArgs), {
            cwd: openArgs.workspacePath,
            encoding: "utf8"
        });
    },
    "integrated-terminal": function (openArgs: OpenMethodsArgument) {
        const shellPath = getConfiguration().integratedShellPath || (os.type().startsWith('Windows') ? 'C:\\Program Files\\Git\\bin\\bash.exe' : '/bin/bash');
        if (!fs.existsSync(shellPath)) {
            if (os.type().startsWith('Windows')) {
                const installGit = 'Install Git';
                vscode.window.showErrorMessage(`Failed to find unix shell. If you install Git, open-in-vim can use "C:\\Program Files\\Git\\bin\\bash.exe".`, installGit).then(choice => {
                    if (choice === installGit) {
                        opn('https://git-scm.com/download/win');
                    }
                });
                return;
            } else {
                throw new Error(`Failed to find shell "${shellPath}"`);
            }
        }
        if (os.type().startsWith('Windows')) {
            openArgs.fileName = formatAsUnixFilePath(openArgs.fileName);
        }
        let terminal = vscode.window.createTerminal({name: "Open in Vim", shellPath, shellArgs: [openArgsToScriptFile(openArgs)]});
        terminal.show(true);
        vscode.commands.executeCommand("workbench.action.terminal.focus");
    },
    "linux.gnome-terminal": function(openArgs: OpenMethodsArgument) {
        let args = getConfiguration().linux!['gnome-terminal']!.args;
        let gnomeTerminalCommand = `gnome-terminal ${args} --command='bash ${openArgsToScriptFile(openArgs)}'`
        execSync(gnomeTerminalCommand);
    },
    "linux.tilix": function(openArgs: OpenMethodsArgument) {
        let args = getConfiguration().linux!.tilix!.args;
        let tilixCommand = `tilix ${args} --command='bash ${openArgsToScriptFile(openArgs)}'`
        execSync(tilixCommand);
    },
    "macos.iterm": function (openArgs: OpenMethodsArgument) {
        let profile = getConfiguration().macos!.iterm!.profile;
        if (profile !== "default profile") {
            profile = `profile "${profile}"`
        }
        let osascriptcode = `
            tell application "iTerm"
              set myNewWin to create window with ${profile} command "bash ${openArgsToScriptFile(openArgs)}"
            end tell
        `;
        let result = spawnSync("/usr/bin/osascript", {encoding: "utf8", input: osascriptcode})
        if (result.error) {
            throw result.error;
        }
        if (result.stderr) {
            throw result.stderr;
        }
    },
    "macos.macvim": function(openArgs: OpenMethodsArgument) {
        openArgs.vim = 'mvim'
        execSync(openArgsToCommand(openArgs), {
            cwd: openArgs.workspacePath,
            encoding: "utf8"
        });
    },
};
