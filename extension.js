// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "open-in-vim" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', function () {
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

function openInVim() {
    let activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
        vscode.window.showErrorMessage('No active editor.');
        return;
    }
    if (activeTextEditor.document.isUntitled) {
        vscode.window.showErrorMessage('Please save the file first.');
        return;
    }
    const position = activeTextEditor.selection.active;
    let fileName = activeTextEditor.document.fileName;
    let line = position.line+1
    let column = position.character+1
    // let extensionPath = vscode.extensions.all.find(e => e.id.includes("open-in-vim")).extensionPath;
    let osascriptcode = `
        tell application "iTerm2"
          set myNewWin to create window with default profile
          tell current session of myNewWin
            write text "cd '${vscode.workspace.rootPath}'"
            write text "vim ${fileName} '+call cursor(${line}, ${column})'; exit"
          end tell
        end tell
    `;
    let result = require('child_process').spawnSync("/usr/bin/osascript", {encoding: "utf8", input: osascriptcode})
    // check for errors here?
}
