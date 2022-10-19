/**
 * mathe:buddy - eine gamifizierte Lern-App für die Hoehere Mathematik
 * (c) 2022 by TH Koeln
 * Author: Andreas Schwenk contact@compiler-construction.com
 * Funded by: FREIRAUM 2022, Stiftung Innovation in der Hochschullehre
 * License: GPL-3.0-or-later
 */

// TODO: remove all "cat" stuff (... from the original webview example)

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.start', () => {
			CatCodingPanel.createOrShow(context.extensionUri);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.doRefactor', () => {
			if (CatCodingPanel.currentPanel) {
				CatCodingPanel.currentPanel.doRefactor();
			}
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				CatCodingPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		// TODO: extend to node_modules
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: CatCodingPanel | undefined;

	public static readonly viewType = 'catCoding';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (CatCodingPanel.currentPanel) {
			CatCodingPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			CatCodingPanel.viewType,
			'Cat Coding',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'getText': {
						const text = vscode.window.activeTextEditor?.document.getText();
						this._panel.webview.postMessage({ 
							command: 'compile', 
							text: text
						});
						return;
					}
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		CatCodingPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._updateForCat(webview);
	}

	private _updateForCat(webview: vscode.Webview) {
		this._panel.title = 'mathe:buddy simulator';
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview/*, catGifPath: string*/) {
		// TODO: main.js is yet unused!
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		const appBG_Img = vscode.Uri.joinPath(this._extensionUri, 'media', 'app-bg.png');
		const appBG_ImgUri = webview.asWebviewUri(appBG_Img);		

		const compilerScript = vscode.Uri.joinPath(this._extensionUri, 'media', 'mathebuddy-compiler.min.js');
		const compilerScriptUri = webview.asWebviewUri(compilerScript);
		const simScript = vscode.Uri.joinPath(this._extensionUri, 'media', 'mathebuddy-simulator.min.js');
		const simScriptUri = webview.asWebviewUri(simScript);

		const fontawesomePath = vscode.Uri.joinPath(this._extensionUri, 'media/fontawesome-free/css', 'all.min.css');
		const fontawesomeUri = webview.asWebviewUri(fontawesomePath);
		const bootstrapPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'bootstrap.min.css');
		const bootstrapUri = webview.asWebviewUri(bootstrapPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		/*const docData = JSON.stringify({
			"id": "",
			"author": "",
			"modifiedDate": "",
			"documents": [
				{
					"title": "Introduction",
					"alias": "intro",
					"items": [
						{
							"type": "paragraph",
							"items": [
								{
									"type": "text",
									"value": "Some text here "
								},
								{
									"type": "inline-math",
									"items": [
										{
											"type": "text",
											"value": "x ^ 2 = - 1"
										}
									]
								},
							]
						}
					]
				}
			]
		});*/

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<!-- TODO: reactivate the following
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				-->

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${fontawesomeUri}" rel="stylesheet">
				<link href="${bootstrapUri}" rel="stylesheet">

				<script nonce="${nonce}" src="${compilerScriptUri}"></script>
				<script nonce="${nonce}" src="${simScriptUri}"></script>

				<title>mathe:buddy</title>
			</head>
			<body>
				
				<div class="container">

					<div class="row">
						<div class="col my-2">
							<button onclick="compile();" type="button" class="btn btn-sm btn-success">
								<i class="fa-solid fa-play"></i>
							</button>
						</div>
					</div>

					<!-- DEVICE AND LOG AREA -->
					<div class="row text-start">
						<div id="device" class="col shadow m-0 p-0 bg-white" style="width:320px;min-width:320px;max-width:320px;height:640px;min-height:640px;max-height:640px;">
							<img src="${appBG_ImgUri}" class="p-0" style="width:100%" />
							<div id="device-content" class="py-0 px-2" style="height: 500px; overflow-x:hidden; overflow-y: scroll; font-size: 85%; transform: translate(0,-5px);">
							</div>
						</div>
						<div id="log" class="col bg-dark mx-3 small" style="max-height: 640px; overflow: scroll;">
							<div id="log-content" class="p-2">
							</div>
						</div>
					</div>

				</div>

				<script nonce="${nonce}">
					var deviceContent = document.getElementById('device-content');
					var logContent = document.getElementById('log-content');

					//var documentData = JSON.parse('$ {docData}');

					console.log('!!!!!!!!!!!');
					
					function compile() {
						const vscode = acquireVsCodeApi();

						vscode.postMessage({
							command: 'getText'
						});

						window.addEventListener('message', event => {
							const message = event.data;
							switch (message.command) {
							case 'compile':
								/*vscode.postMessage({
									command: 'alert',
									text: 'received text: ' + message.text
								});*/

								var compiler = new mathebuddyCOMPILER.Compiler();
								compiler.run(message.text);
								var compiledJson = compiler.getCourse().toJSON();
								
								//var compiledString = JSON.stringify(compiledJson, null, 2);
								//console.log(compiledString);

								var sim = mathebuddySIM.createSim(compiledJson, deviceContent);
								if (mathebuddySIM.generateDOM(sim, 'intro') == false) { // TODO: 'intro' is static
									console.log("ERROR: there is no document 'intro'"); // TODO
								}
								logContent.innerHTML = '<div class="text-white">' + mathebuddySIM.getJSON(sim) + '</div>';
								// TODO: getHTML

								break;
							}
						});
					}

				</script>

				<!--<script nonce="${nonce}" src="${scriptUri}"></script>-->
				
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
