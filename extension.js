// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const tmp = require('tmp');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('open-in-vim.open', function() {
        try {
            openInVim();
        } catch(e) {
            console.error(e);
            vscode.window.showErrorMessage("extension experienced internal error" + e); // ?? not sure this works
            throw e;
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

function getConfiguration() {
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
    let {openMethod} = getConfiguration()

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
            var workspacePath = process.env.HOME;
        }
    } else {
        var workspacePath = workspace.uri.path;
    }

    let position = activeTextEditor.selection.active;
    let fileName = activeTextEditor.document.fileName;
    let line = position.line+1
    let column = position.character+1
    let vimCommand = `vim '${fileName}' '+call cursor(${line}, ${column})'; exit` // cannot contain double quotes
    let getScript = () => {
        let tmpFile = tmp.fileSync();
        fs.writeFileSync(tmpFile.name, `
            cd ${workspacePath}
            ${vimCommand}
        `);
        return tmpFile.name;
    }

    actualOpenMethod({workspacePath, vimCommand, getScript});
}

const openMethods = {
    "gvim": function({workspacePath, vimCommand}) {
        vimCommand = "g" + vimCommand; // use "gvim"
        require('child_process').execSync(vimCommand, {
            cwd: workspacePath,
            encoding: "utf8"
        });
    },
    "integrated-terminal": function({getScript}) {
        let terminal = vscode.window.createTerminal({name: "Open in Vim", shellPath: "/bin/bash", shellArgs: [getScript()]});
        terminal.show(true);
        vscode.commands.executeCommand("workbench.action.terminal.focus");
    },
    "linux.gnome-terminal": function({getScript}) {
        let args = getConfiguration().linux['gnome-terminal'].args;
        let gnomeTerminalCommand = `gnome-terminal ${args} --command='bash ${getScript()}'`
        require('child_process').execSync(gnomeTerminalCommand);
    },
    "linux.tilix": function({getScript}) {
        let args = getConfiguration().linux.tilix.args;
        let tilixCommand = `tilix ${args} --command='bash ${getScript()}'`
        require('child_process').execSync(tilixCommand);
    },
    "macos.iterm": function({workspacePath, vimCommand}) {
        // let extensionPath = vscode.extensions.all.find(e => e.id.includes("open-in-vim")).extensionPath;
        let osascriptcode = `
            tell application "iTerm"
              set myNewWin to create window with default profile
              tell current session of myNewWin
                write text "cd '${workspacePath}'"
                write text "${vimCommand}"
              end tell
            end tell
        `;
        let result = require('child_process').spawnSync("/usr/bin/osascript", {encoding: "utf8", input: osascriptcode})
        // check for errors here?
    },
    "macos.macvim": function({workspacePath, vimCommand}) {
        vimCommand = "m" + vimCommand; // use "mvim"
        require('child_process').execSync(vimCommand, {
            cwd: workspacePath,
            encoding: "utf8"
        });
    }
};
