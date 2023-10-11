/**
 * mathe:buddy - eine gamifizierte Lern-App für die Hoehere Mathematik
 * (c) 2022 by TH Koeln
 * Author: Andreas Schwenk contact@compiler-construction.com
 * Funded by: FREIRAUM 2022, Stiftung Innovation in der Hochschullehre
 * License: GPL-3.0-or-later
 */

// TODO: remove all "cat" stuff (... from the original webview example)

import * as vscode from "vscode";

import * as xxx from "./out.js"; // "./jstest.js";

//import * as mathebuddyCompiler from '@mathebuddy/mathebuddy-compiler/lib';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("catCoding.start", () => {
      CatCodingPanel.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("catCoding.doRefactor", () => {
      if (CatCodingPanel.currentPanel) {
        CatCodingPanel.currentPanel.doRefactor();
      }
    })
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        console.log(`Got state: ${state}`);
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        CatCodingPanel.revive(webviewPanel, context.extensionUri);
      },
    });
  }
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    // TODO: extend to node_modules
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
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

  public static readonly viewType = "catCoding";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private courseData = "{}";

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
      "mathe:buddy",
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri)
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
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;

          case "compile": {
            console.log("trying to run js code:");
            console.log(xxx.x);

            const test = (xxx.y as any)["functionName"]; //(xxx.y as any)["functionName"];
            test();
            // TODO: test params + return value

            let text = "";

            //vscode.window.visibleTextEditors

            if (vscode.window.activeTextEditor == undefined) {
              vscode.window.showErrorMessage(
                "Error: You have to select a text editor!"
              );
            } else {
              text = vscode.window.activeTextEditor.document.getText();

              //vscode.window.showErrorMessage('text = ' + text);
              //vscode.window.showInformationMessage('compiling..');

              //const compiler = new mathebuddyCompiler.Compiler();

              //compiler.run(text);
              //const blub = JSON.stringify(compiler.getCourse().toJSON(), null, 2);
              //console.log(blub);
              //this.courseData = JSON.stringify(compiler.getCourse().toJSON());

              console.log("compiler input: " + text);
              //console.log(this.courseData);
              console.log("course-data: TODO");

              this._panel.webview.postMessage({
                command: "refresh",
                data: this.courseData,
              });
            }

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
    this._panel.webview.postMessage({ command: "refactor" });
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
    this._panel.title = "mathe:buddy simulator";
    this._panel.webview.html = this._getHtmlForWebview(webview);

    this._panel.webview.postMessage({
      command: "refresh",
      data: this.courseData,
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview /*, catGifPath: string*/) {
    // TODO: main.js is yet unused!
    // const scriptPathOnDisk = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media",
    //   "main.js"
    // );
    // const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // const appBG_Img = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media",
    //   "app-bg.png"
    // );
    // const appBG_ImgUri = webview.asWebviewUri(appBG_Img);
    // const _testxxx = `${appBG_ImgUri}"`;
    // // https://file%2B.vscode-resource.vscode-cdn.net/Users/andi/git/github-mathebuddy/mathebuddy-vscode-sim-ext/media/app-bg.png\"

    // //const compilerScript = vscode.Uri.joinPath(this._extensionUri, 'media', 'mathebuddy-compiler.min.js');
    // //const compilerScriptUri = webview.asWebviewUri(compilerScript);
    // const simScript = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media",
    //   "mathebuddy-simulator.min.js"
    // );
    // const simScriptUri = webview.asWebviewUri(simScript);

    // const fontawesomePath = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media/fontawesome-free/css",
    //   "all.min.css"
    // );
    // const fontawesomeUri = webview.asWebviewUri(fontawesomePath);
    // const bootstrapPath = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "media",
    //   "bootstrap.min.css"
    // );
    // const bootstrapUri = webview.asWebviewUri(bootstrapPath);

    // // Use a nonce to only allow specific scripts to be run
    // const nonce = getNonce();

    // //const data = this.courseData.replace('/\n/g', ''); // TODO

    // let html = `<!DOCTYPE html>
    // 	<html lang="en">
    // 	<head>
    // 		<meta charset="UTF-8">

    // 		<!--
    // 			Use a content security policy to only allow loading images from https or from our extension directory,
    // 			and only allow scripts that have a specific nonce.
    // 		-->
    // 		<!-- TODO: reactivate the following
    // 			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
    // 		-->

    // 		<meta name="viewport" content="width=device-width, initial-scale=1.0">

    // 		<link href="${fontawesomeUri}" rel="stylesheet">
    // 		<link href="${bootstrapUri}" rel="stylesheet">

    // 		<!--<script nonce="${nonce}" src="$ {compilerScriptUri}"></script>-->
    // 		<script nonce="${nonce}" src="${simScriptUri}"></script>

    // 		<title>mathe:buddy</title>
    // 	</head>

    // 	<body style="background-color: #aaaaaa;">

    // 		<div class="row bg-light rounded mx-0 my-2 small">
    // 			<div class="col my-2">
    // 				<button onclick="compile();" type="button" class="btn btn-sm btn-outline-success">
    // 					<i class="fa-solid fa-play"></i>
    // 				</button>

    // 				<button onclick="compile();" type="button" class="btn btn-sm btn-outline-success">
    // 					<i class="fa-brands fa-html5"></i>
    // 				</button>
    // 				<button onclick="compile();" type="button" class="btn btn-sm btn-outline-success">
    // 					<i class="fa-solid fa-code"></i>
    // 				</button>

    // 			</div>
    // 		</div>

    // 		<div class="container">

    // 			<!-- DEVICE AND LOG AREA -->
    // 			<div class="row text-start">
    // 				<div id="device" class="col shadow m-0 p-0 bg-white" style="width:320px;min-width:320px;max-width:320px;height:640px;min-height:640px;max-height:640px;">
    // 					<img src="${appBG_ImgUri}" class="p-0" style="width:100%" />
    // 					<div id="device-content" class="py-0 px-2" style="height: 500px; overflow-x:hidden; overflow-y: scroll; font-size: 85%; transform: translate(0,-5px);">
    // 					</div>
    // 				</div>
    // 				<div id="log" class="col bg-dark mx-3 small" style="max-height: 640px; overflow: scroll;">
    // 					<div id="log-content" class="p-2">
    // 					</div>
    // 				</div>
    // 			</div>

    // 		</div>

    // 		<script nonce="${nonce}">

    // 			// TODO: move implementation to file "media/main.js"

    // 			var deviceContent = document.getElementById('device-content');
    // 			var logContent = document.getElementById('log-content');
    // 			const vscode = acquireVsCodeApi();

    // 			var compiledJson = null;

    // 			/*console.log('#####1');
    // 			console.log('$ {data}');
    // 			try {
    // 				compiledJson = JSON.parse('$ {data}');
    // 			} catch(e) {
    // 				console.log("JSON.parse(..) failed! " + e);
    // 			}
    // 			console.log(compiledJson);
    // 			console.log('#####2');*/

    // 			function render() {
    // 				if(compiledJson == null || ('documents' in compiledJson) == false) {
    // 					deviceContent.innerHTML = 'empty';
    // 					return;
    // 				}
    // 				var sim = mathebuddySIM.createSim(compiledJson, deviceContent);
    // 				if (mathebuddySIM.generateDOM(sim, 'intro') == false) { // TODO: 'intro' is static
    // 					console.log("ERROR: there is no document 'intro'"); // TODO
    // 				}
    // 				logContent.innerHTML = '<div class="text-white">' + mathebuddySIM.getJSON(sim) + '</div>';
    // 			}
    // 			render();

    // 			function compile() {
    // 				vscode.postMessage({
    // 					command: 'compile'
    // 				});
    // 				//console.log('clicked button');
    // 			}

    // 			window.addEventListener('message', event => {
    // 				const message = event.data;
    // 				switch (message.command) {
    // 					case 'refresh': {
    // 						compiledJson = JSON.parse(message.data);
    // 						render();
    // 						break;
    // 					}
    // 				}
    // 			});

    // 		</script>

    // 		<!--<script nonce="$ {nonce}" src="$ {scriptUri}"></script>-->

    // 	</body>
    // 	</html>`;

    // //console.log(html);

    // ------------------------------------------------------------
    // ------------------------------------------------------------
    // ------------------------------------------------------------

    const yyy = webview.options.localResourceRoots;

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    console.log(">>> NONCE = " + nonce);

    const extUri = this._extensionUri;

    const xxx = webview.cspSource;

    function simUri(path: string): vscode.Uri {
      const tmp = vscode.Uri.joinPath(extUri, "media", "sim", path);
      return webview.asWebviewUri(
        // TODO: split by path "/" and then join...
        tmp
      );
    }

    const baseUri = simUri("/");
    //const baseUriStr = baseUri.toString();

    console.log(">>> baseUriStr = " + simUri("/").toString());

    console.log(">>> path to logo.png = " + simUri("logo.png").toString());

    const bp = 1337;

    // TODO: serviceWorkerVersion must be updated!!

    const html = `
    
    <!DOCTYPE html>
    <html>
      <head>
        <!--
        If you are serving your web app in a path other than the root, change the
        href value below to reflect the base path you are serving from.
    
        The path provided below has to start and end with a slash "/" in order for
        it to work correctly.
    
        For more details:
        * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
    
      -->
        <!--<base href="/" />-->
        <base href="${baseUri}" />
    
        <meta charset="UTF-8" />
        <meta content="IE=Edge" http-equiv="X-UA-Compatible" />
        <meta name="description" content="mathe:buddy" />
    
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <!-- iOS meta tags & icons -->
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="mathebuddy" />
        <link rel="apple-touch-icon" href="${simUri("icons/Icon-192.png")}" />
    
        <!-- Favicon -->
        <link rel="icon" type="image/png" href="${simUri("favicon.png")}" />
    
        <title>mathe:buddy</title>
        <link rel="manifest" href="${simUri("manifest.json")}" />
    
        <script nonce="${nonce}">
          // The value below is injected by flutter build, do not touch.
          var serviceWorkerVersion = '783518420';
        </script>
        <!-- This script adds the flutter initialization JS code -->
        <script nonce="${nonce}" src="${simUri("flutter.js")}" defer></script>
    
        <script nonce="${nonce}" type="text/javascript">
          window.flutterWebRenderer = "canvaskit";
        </script>
      </head>
    
      <body>
        <br /><br /><br /><br /><br />
        <p style="text-align: center; color: gray; font-size: larger">
          loading
          <br /><br /><br />
          <img src="${simUri("logo.png")}" style="width: 25%" />
        </p>
    
        <span id="course-data-span" style="color: white"></span>
    
        <!-- TODO!!! <span id="bundle-id" style="color: white">assets/bundle-test.json</span> -->
    
        <script nonce="${nonce}">
          // TODO: security: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
          window.addEventListener("message", (event) => {
            // TODO: CHECK ORIGIN!!
            //if (event.origin !== "http://example.org:8080")
            //  return;
            //console.log("FLUTTER RECEIVED MESSAGE: " + event.data);
            //_flutter. xx+
            document.getElementById("course-data-span").innerHTML = event.data;
          });
    
          window.addEventListener("load", function (ev) {
            // Download main.dart.js
            _flutter.loader.loadEntrypoint({
              nonce: "${nonce}",
              serviceWorker: {
                serviceWorkerVersion: serviceWorkerVersion,
              },
              onEntrypointLoaded: function (engineInitializer) {
                engineInitializer.initializeEngine({nonce: "${nonce}"}).then(function (appRunner) {
                  appRunner.runApp();
                });
              },
            });
          });
        </script>
      </body>
    </html>        
`;

    return html;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
