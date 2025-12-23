import * as vscode from 'vscode';

let snowDecorations: vscode.TextEditorDecorationType[] = [];
let snowInterval: ReturnType<typeof setInterval> | undefined;
let isSnowEnabled = false;
let snowPositions: { col: number; row: number; flake: string; speed: number; swayOffset: number }[] = [];

// Get snow configuration from settings
function getSnowConfig() {
    const config = vscode.workspace.getConfiguration('christmas.snow');
    
    const shapesStr = config.get<string>('shapes', '❄❅❆✻✼·°');
    const shapes = [...shapesStr];
    
    // User configurable interval (default 900ms)
    const interval = config.get<number>('interval', 900);
    
    // User configurable density (number of snowflakes)
    const density = config.get<number>('density', 25);
    
    // Overlay mode: true = over text, false = after line end
    const overlay = config.get<boolean>('overlay', true);
    
    const colorLight = config.get<string>('colorLight', '#FFD700');
    const colorDark = config.get<string>('colorDark', '#FFFFFF');
    
    return { shapes, interval, density, overlay, colorLight, colorDark };
}

function isDarkTheme(): boolean {
    const colorTheme = vscode.window.activeColorTheme;
    return colorTheme.kind === vscode.ColorThemeKind.Dark || 
           colorTheme.kind === vscode.ColorThemeKind.HighContrast;
}

function hexToRgba(hex: string, opacity: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return hex;
}

function getSnowflakeColor(): { color: string; shadow: string } {
    const config = getSnowConfig();
    if (isDarkTheme()) {
        return { 
            color: hexToRgba(config.colorDark, 0.8), 
            shadow: hexToRgba(config.colorDark, 0.6) 
        };
    } else {
        return { 
            color: hexToRgba(config.colorLight, 0.9),
            shadow: hexToRgba(config.colorLight, 0.6)
        };
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('🎄 Christmas Extension is now active! 🎅');

    // Register the Christmas Tree webview provider
    const treeProvider = new ChristmasTreeViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('christmas.tree', treeProvider)
    );

    // Command: Toggle Snow Effect (Editor Overlay)
    const toggleSnowCommand = vscode.commands.registerCommand('christmas.toggleSnow', () => {
        if (isSnowEnabled) {
            stopEditorSnow();
            vscode.window.showInformationMessage('❄️ Snow effect stopped!');
        } else {
            startEditorSnow();
            vscode.window.showInformationMessage('❄️ Let it snow! ❄️');
        }
        isSnowEnabled = !isSnowEnabled;
    });

    // Command: Show Merry Christmas Message
    const merryChristmasCommand = vscode.commands.registerCommand('christmas.merryChristmas', () => {
        vscode.window.showInformationMessage('🎄 Merry Christmas and Happy New Year! 🎅🎁❄️');
    });

    context.subscriptions.push(toggleSnowCommand, merryChristmasCommand);
}

// Christmas Tree Webview Provider for sidebar
class ChristmasTreeViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Christmas Tree</title>
    <style>
        body {
            margin: 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
            background: transparent;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        #tree {
            font-size: 11px;
            line-height: 1.2;
            white-space: pre;
            text-align: center;
        }
        .star { color: #FFD700; text-shadow: 0 0 8px #FFD700; }
        .tree { color: #228B22; }
        .light-red { color: #FF6B6B; text-shadow: 0 0 3px #FF6B6B; }
        .light-gold { color: #FFD93D; text-shadow: 0 0 3px #FFD93D; }
        .light-blue { color: #6BCBFF; text-shadow: 0 0 3px #6BCBFF; }
        .light-pink { color: #FF9FF3; text-shadow: 0 0 3px #FF9FF3; }
        .trunk { color: #8B4513; }
        .message {
            margin-top: 6px;
            font-size: 10px;
            color: var(--vscode-foreground);
        }
        .light-dim { opacity: 0.2; }
        .light-bright { opacity: 1; }
        .light {
            transition: opacity 0.8s ease-in-out;
        }
        @keyframes starGlow {
            0%, 100% { opacity: 1; text-shadow: 0 0 8px #FFD700; }
            50% { opacity: 0.7; text-shadow: 0 0 12px #FFD700; }
        }
        .star-glow { animation: starGlow 2s ease-in-out infinite; }
    </style>
</head>
<body>
    <div id="tree"></div>
    <div class="message">✨ Merry Christmas ✨</div>
    <script>
        const lights = ['light-red', 'light-gold', 'light-blue', 'light-pink'];
        // Brightness phases: 0=dim, 1=fading in, 2=bright, 3=fading out
        let phase = 0;
        let brightness = 0.2;
        const BRIGHT_HOLD_FRAMES = 8;  // frames to stay bright
        const DIM_HOLD_FRAMES = 4;     // frames to stay dim
        let holdCounter = 0;
        
        function renderTree() {
            // Tree with proper alignment using consistent spacing
            const template = [
                '       ☆       ',
                '      /@\\\\      ',
                '     /@@\\\\     ',
                '    /@@@\\\\    ',
                '   /@@@@\\\\   ',
                '  /@@@@@\\\\  ',
                ' /@@@@@@\\\\ ',
                '/@@@@@@@\\\\',
                '     [||]     '
            ];
            
            // Smooth brightness transition
            if (phase === 0) {
                // Dim - hold
                holdCounter++;
                if (holdCounter >= DIM_HOLD_FRAMES) {
                    phase = 1;
                    holdCounter = 0;
                }
            } else if (phase === 1) {
                // Fading in
                brightness += 0.1;
                if (brightness >= 1) {
                    brightness = 1;
                    phase = 2;
                }
            } else if (phase === 2) {
                // Bright - hold
                holdCounter++;
                if (holdCounter >= BRIGHT_HOLD_FRAMES) {
                    phase = 3;
                    holdCounter = 0;
                }
            } else if (phase === 3) {
                // Fading out
                brightness -= 0.1;
                if (brightness <= 0.2) {
                    brightness = 0.2;
                    phase = 0;
                }
            }
            
            let html = '';
            let colorIdx = 0;
            template.forEach((line, y) => {
                for (let x = 0; x < line.length; x++) {
                    const c = line[x];
                    if (c === '☆') {
                        html += '<span class="star star-glow">★</span>';
                    } else if (c === '@') {
                        const color = lights[colorIdx % lights.length];
                        colorIdx++;
                        html += '<span class="light ' + color + '" style="opacity: ' + brightness.toFixed(2) + '">✦</span>';
                    } else if (c === '/' || c === '\\\\') {
                        html += '<span class="tree">' + c + '</span>';
                    } else if (c === '[' || c === ']' || c === '|') {
                        html += '<span class="trunk">' + c + '</span>';
                    } else {
                        html += c;
                    }
                }
                html += '\\n';
            });
            
            document.getElementById('tree').innerHTML = html;
        }
        
        renderTree();
        setInterval(renderTree, 150);
    </script>
</body>
</html>`;
    }
}

function startEditorSnow() {
    // Clear any existing decorations
    snowDecorations.forEach(d => d.dispose());
    snowDecorations = [];
    snowPositions = [];

    // Get configuration
    const config = getSnowConfig();
    const { shapes, interval, density } = config;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {return;}

    // Calculate max column from entire document (not just visible)
    let maxCol = 40;
    for (let i = 0; i < editor.document.lineCount; i++) {
        const lineLen = editor.document.lineAt(i).text.length;
        if (lineLen > maxCol) {maxCol = lineLen;}
    }
    maxCol = Math.min(maxCol, 120);
    
    const totalLines = editor.document.lineCount;

    // Initialize snowflakes with absolute positions
    for (let i = 0; i < density; i++) {
        snowPositions.push({
            col: Math.floor(Math.random() * maxCol),
            row: Math.floor(Math.random() * totalLines), // spread across entire document
            flake: shapes[Math.floor(Math.random() * shapes.length)],
            speed: 1,
            swayOffset: 0
        });
    }

    // Animation loop
    snowInterval = setInterval(() => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        const totalLines = editor.document.lineCount;

        // Move each snowflake down, col changes slightly based on previous position
        snowPositions.forEach((snow) => {
            snow.row += snow.speed;
            
            // Slight random sway: -2 to +1 range from current position
            const sway = Math.floor(Math.random() * 4) - 2; // -2, -1, 0, +1
            snow.col = Math.max(0, Math.min(maxCol - 1, snow.col + sway));
            
            // Wrap around when reaching bottom
            if (snow.row >= totalLines) {
                snow.row = 0;
                snow.col = Math.floor(Math.random() * maxCol); // new random col at top
                snow.flake = shapes[Math.floor(Math.random() * shapes.length)];
            }
        });

        // Clear old decorations
        snowDecorations.forEach(d => d.dispose());
        snowDecorations = [];

        // Get snowflake colors based on theme
        const colors = getSnowflakeColor();

        // Get visible range for rendering only visible snowflakes
        const visibleRanges = editor.visibleRanges;
        if (visibleRanges.length === 0) {return;}
        const startLine = visibleRanges[0].start.line;
        const endLine = visibleRanges[0].end.line;

        // Create decorations for visible snowflakes only
        snowPositions.forEach(snow => {
            const lineNum = Math.floor(snow.row);
            
            // Only render if in visible range
            if (lineNum < startLine || lineNum > endLine || lineNum >= editor.document.lineCount) {
                return;
            }
            
            const lineText = editor.document.lineAt(lineNum).text;
            const colPosition = Math.floor(snow.col);
            
            // Use absolute positioning with margin-left based on col
            const decoration = vscode.window.createTextEditorDecorationType({
                after: {
                    contentText: snow.flake,
                    color: colors.color,
                    textDecoration: `none; position: absolute; left: ${colPosition}ch; z-index: 1; pointer-events: none; text-shadow: 0 0 3px ${colors.shadow};`
                }
            });
            
            snowDecorations.push(decoration);
            // Attach to beginning of line, position is absolute via CSS
            const range = new vscode.Range(lineNum, 0, lineNum, 0);
            editor.setDecorations(decoration, [{ range }]);
        });

    }, interval);
}

function stopEditorSnow() {
    if (snowInterval) {
        clearInterval(snowInterval);
        snowInterval = undefined;
    }
    snowDecorations.forEach(d => d.dispose());
    snowDecorations = [];
    snowPositions = [];
}

export function deactivate() {
    if (snowInterval) {
        clearInterval(snowInterval);
    }
    snowDecorations.forEach(d => d.dispose());
}
