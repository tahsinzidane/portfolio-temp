// ============================================
// TERMINAL DATA MANAGEMENT
// ============================================

// Global variable to store terminal data
let terminalData = {};

// Function to load terminal data
async function loadTerminalData() {
    try {
        const response = await fetch('./src/data.json');
        if (!response.ok) {
            throw new Error('Failed to fetch terminal data');
        }
        terminalData = await response.json();
        console.log('Terminal data loaded successfully:', terminalData);
    } catch (error) {
        console.error('Error loading terminal data:', error);
        // Fallback data
        terminalData = {
            "help": "Terminal data failed to load. Please check terminalData.json file."
        };
    }
}

// Format output for objects and arrays
function formatOutput(data) {
    if (Array.isArray(data)) {
        return data.map((item, index) => `  ${index + 1}. ${item}`).join('\n');
    }

    if (typeof data === 'object' && data !== null) {
        let output = '';
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                output += `${key}:\n${value.map(item => `  - ${item}`).join('\n')}\n`;
            } else if (typeof value === 'object') {
                output += `${key}: ${JSON.stringify(value)}\n`;
            } else {
                output += `${key}: ${value}\n`;
            }
        }
        return output.trim();
    }

    return String(data);
}

// Process commands dynamically
function processCommand(command) {
    const originalCmd = command.trim();
    const cmd = command.toLowerCase().trim();

    // Special commands that need custom logic
    if (cmd === 'cls' || cmd === 'clear') {
        clearTerminal();
        return '';
    }

    if (cmd === 'date') {
        return new Date().toLocaleDateString();
    }

    if (cmd === 'time') {
        return new Date().toLocaleTimeString();
    }
    if (cmd === 'help') {
        return `
                Available commands:

                help                show this help
                cls | clear         clear the terminal
                date                show current date
                time                show current time
                echo <text>         print text
                echo $GOAL          my goal
                dir | ls            list directory
                pwd                 show current path
                whoami              about this developer
                pwd                 location
                ls                  show all projects
                cat portfolio.txt   socail links
                git status          my current status
                npm list -g          checked global npm packages because something was definitely broken
                history             show my past
                <some extra commands>
                top
                uptime
                exit

                `.trim();
    }



    if (cmd.startsWith('echo ')) {
        const echoText = command.substring(5).trim();
        // Check if it's a special echo command like "echo $GOAL"
        const echoKey = echoText.replace(/['"]/g, '');
        if (terminalData[`echo ${echoKey}`]) {
            const result = terminalData[`echo ${echoKey}`];
            return typeof result === 'object' ? formatOutput(result) : String(result);
        }
        return echoText.replace(/['"]/g, '');
    }

    // Check if exact command exists in terminalData (for commands with spaces)
    if (terminalData[originalCmd]) {
        const result = terminalData[originalCmd];
        return typeof result === 'object' ? formatOutput(result) : String(result);
    }

    // Check lowercase version
    if (terminalData[cmd]) {
        const result = terminalData[cmd];
        return typeof result === 'object' ? formatOutput(result) : String(result);
    }

    // Default error message
    return `'${command}' is not recognized as an internal or external command, operable program or batch file.`;
}

// Clear terminal
function clearTerminal() {
    const promptLine = document.querySelector('.prompt-line');
    terminalContent.innerHTML = '';
    terminalContent.appendChild(promptLine);
    commandInput.value = '';
    updateCursor();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// DOM ELEMENTS
// ============================================

const terminalWindow = document.getElementById('terminalWindow');
const terminalBody = document.getElementById('terminalBody');
const terminalContent = document.getElementById('terminalContent');
const commandInput = document.getElementById('commandInput');
const cursor = document.querySelector('.cursor');
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');
const closeBtn = document.getElementById('closeBtn');

// ============================================
// STATE MANAGEMENT
// ============================================

let isMaximized = false;
let isMinimized = false;
let isHidden = false;

// Command history
let commandHistory = [];
let historyIndex = -1;

// ============================================
// CURSOR MANAGEMENT
// ============================================

function updateCursor() {
    const inputValue = commandInput.value;
    const prompt = document.querySelector('.prompt');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '14px "Cascadia Code", Consolas, monospace';

    const promptWidth = context.measureText(prompt.textContent).width;
    const inputWidth = context.measureText(inputValue).width;

    cursor.style.left = `${promptWidth + inputWidth + 4}px`;
}

// ============================================
// COMMAND INPUT HANDLING
// ============================================

commandInput.addEventListener('input', updateCursor);
commandInput.addEventListener('keyup', updateCursor);
commandInput.addEventListener('click', updateCursor);

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const command = commandInput.value.trim();

        if (command) {
            // Add to history
            commandHistory.unshift(command);
            historyIndex = -1;

            // Create output for the command entered
            const currentPromptLine = document.querySelector('.prompt-line');

            // Clone the current prompt line (with the command)
            const executedLine = document.createElement('div');
            executedLine.className = 'output-line';
            executedLine.innerHTML = `<span style="color: #f0f0f0;">PS C:\\Users\\tahsinzidane\\Documents\\codes\\portfolio-temp&gt;</span> ${escapeHtml(command)}`;

            // Insert before current prompt line
            terminalContent.insertBefore(executedLine, currentPromptLine);

            // Create output/response
            const response = processCommand(command);
            if (response) {
                const outputLine = document.createElement('div');
                outputLine.className = 'output-line';
                outputLine.textContent = response;
                terminalContent.insertBefore(outputLine, currentPromptLine);
            }

            // Clear input
            commandInput.value = '';
            updateCursor();

            // Scroll to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            commandInput.value = commandHistory[historyIndex];
            updateCursor();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            commandInput.value = commandHistory[historyIndex];
            updateCursor();
        } else if (historyIndex === 0) {
            historyIndex = -1;
            commandInput.value = '';
            updateCursor();
        }
    }
});

// ============================================
// WINDOW CONTROLS
// ============================================

// Minimize button
minimizeBtn.addEventListener('click', () => {
    if (isMinimized) {
        terminalWindow.classList.remove('minimized');
        isMinimized = false;
        commandInput.focus();
    } else {
        terminalWindow.classList.add('minimized');
        terminalWindow.classList.remove('maximized');
        isMinimized = true;
        isMaximized = false;
    }
});

// Maximize button
maximizeBtn.addEventListener('click', () => {
    if (isMaximized) {
        terminalWindow.classList.remove('maximized');
        isMaximized = false;
    } else {
        terminalWindow.classList.add('maximized');
        terminalWindow.classList.remove('minimized');
        isMaximized = true;
        isMinimized = false;
    }
    commandInput.focus();
});

// Close button
closeBtn.addEventListener('click', () => {
    terminalWindow.classList.add('hidden');
    isHidden = true;
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

// Alt + T to toggle terminal
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();

        if (isHidden) {
            terminalWindow.classList.remove('hidden');
            isHidden = false;
            setTimeout(() => commandInput.focus(), 100);
        } else {
            terminalWindow.classList.add('hidden');
            isHidden = true;
        }
    }
});

// ============================================
// DRAG FUNCTIONALITY
// ============================================

let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const terminalTab = document.querySelector('.terminal-tab');

terminalTab.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    if (e.target.closest('.tab-buttons')) return;
    if (isMaximized) return;

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === terminalTab || e.target.closest('.tab-left')) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();

        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, terminalWindow);
    }
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

// ============================================
// INITIALIZATION
// ============================================

// Click anywhere in terminal body to focus input
terminalBody.addEventListener('click', (e) => {
    if (e.target !== commandInput) {
        commandInput.focus();
    }
});

// Initialize on page load
window.addEventListener('load', async () => {
    // Load terminal data first
    await loadTerminalData();

    // Then focus input and update cursor
    commandInput.focus();
    updateCursor();

    console.log('Terminal initialized successfully');
});