/**
 * @file demo.ts
 * @description A demonstration file containing various intentional bugs, bad practices,
 * security vulnerabilities, and performance issues for AI detection testing.
 * @author User (Simulated)
 * @version 0.0.1-alpha (Unstable)
 */

// ==========================================
// SECTION 1: GLOBAL CONFIGURATION & IMPORTS
// ==========================================

// TODO: Remove this in production
const DEBUG_MODE = true;

// SECURITY RISK: Hardcoded sensitive information
const API_KEY = "sk-1234567890abcdef1234567890abcdef";
const DB_PASSWORD = "admin:password123";
const JWT_SECRET = "secret_key_that_is_too_short";

// BAD PRACTICE: Global mutable state
let globalState: any = {
    user: null,
    settings: {},
    cache: [], // Memory Leak: Unbounded array
    logs: ""   // Memory Leak: Unbounded string
};

// BAD PRACTICE: Polluting global namespace
(window as any).appInstance = globalState;

// ==========================================
// SECTION 2: TYPE DEFINITIONS (POORLY DEFINED)
// ==========================================

// BAD PRACTICE: Using 'any' everywhere defeats the purpose of TypeScript
type AnyData = any;

interface User {
    id: number;
    username: string;
    password?: string; // SECURITY RISK: Storing password in interface
    metadata: AnyData;
}

// CIRCULAR DEPENDENCY RISK in types (if not handled carefully)
interface Node {
    value: number;
    next: Node | null;
    prev: Node | null;
    parent?: Node; // Potential for infinite recursion in serialization
}

interface RenderConfig {
    fps: number;
    quality: string;
    // BAD PRACTICE: Optional properties that are actually required by logic
    bufferSize?: number;
}

// ==========================================
// SECTION 3: UTILITY FUNCTIONS (INEFFICIENT & BUGGY)
// ==========================================

/**
 * BAD PRACTICE: Blocking the main thread
 */
function sleep(ms: number) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < ms) {
        // Busy wait - CPU spike
    }
}

/**
 * BUG: Incorrect deep clone implementation
 * - Does not handle Date, RegExp, Map, Set
 * - Infinite recursion on circular references
 */
function deepClone(obj: any): any {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    const clone: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clone[key] = deepClone(obj[key]);
        }
    }
    return clone;
}

/**
 * SECURITY RISK: ReDoS (Regular Expression Denial of Service)
 * Vulnerable regex for email validation
 */
function validateEmail(email: string): boolean {
    // This regex is vulnerable to catastrophic backtracking
    const regex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    return regex.test(email);
}

/**
 * PERFORMANCE ISSUE: O(n^2) or worse complexity for simple task
 */
function findDuplicates(arr: number[]): number[] {
    const duplicates: number[] = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
            if (i !== j && arr[i] === arr[j]) {
                // BAD PRACTICE: Inefficient inclusion check inside nested loop
                if (duplicates.indexOf(arr[i]) === -1) {
                    duplicates.push(arr[i]);
                }
            }
        }
    }
    return duplicates;
}

/**
 * BUG: Floating point precision issues ignored
 */
function calculateTotal(prices: number[]): number {
    let total = 0;
    prices.forEach(p => total += p);
    return total; // e.g., 0.1 + 0.2 !== 0.3
}

/**
 * SECURITY RISK: Eval usage
 */
function executeDynamicLogic(code: string) {
    try {
        // DANGEROUS: Arbitrary code execution
        eval(code);
    } catch (e) {
        console.error(e);
    }
}

// ==========================================
// SECTION 4: CUSTOM EVENT EMITTER (MEMORY LEAK)
// ==========================================

class SimpleEventEmitter {
    private listeners: { [key: string]: Function[] } = {};

    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(...args));
        }
    }

    // MISSING: off/removeListener method
    // This will cause memory leaks if listeners are added repeatedly
}

const globalEmitter = new SimpleEventEmitter();

// ==========================================
// SECTION 5: LOGGING SYSTEM (INEFFICIENT)
// ==========================================

class Logger {
    private logs: string[] = [];

    log(message: string) {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] ${message}`;

        // MEMORY LEAK: Unbounded array growth
        this.logs.push(formatted);

        // BAD PRACTICE: console.log in production code
        console.log(formatted);

        // PERFORMANCE ISSUE: Writing to local storage on every log
        // This is synchronous and slow
        try {
            localStorage.setItem('app_logs', JSON.stringify(this.logs));
        } catch (e) {
            // Ignored error (quota exceeded likely)
        }
    }

    dump() {
        return this.logs.join('\n');
    }
}

const logger = new Logger();

// ==========================================
// SECTION 6: AUTHENTICATION SERVICE (INSECURE)
// ==========================================

class AuthService {
    private users: User[] = [];
    private currentUser: User | null = null;

    constructor() {
        // MOCK DATA
        this.users.push({
            id: 1,
            username: 'admin',
            password: 'password123', // PLAIN TEXT PASSWORD
            metadata: { role: 'admin' }
        });
    }

    login(username: string, password: string): boolean {
        // SECURITY RISK: Timing attack vulnerability (string comparison)
        const user = this.users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            // SECURITY RISK: Storing sensitive data in local storage
            localStorage.setItem('user_session', JSON.stringify(user));
            return true;
        }
        return false;
    }

    // BUG: Returns promise but is not awaited correctly in many places
    async logout() {
        this.currentUser = null;
        localStorage.removeItem('user_session');
        // Simulated network delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // SECURITY RISK: No sanitation of input
    updateProfile(metadata: string) {
        if (this.currentUser) {
            // Potential XSS if metadata is rendered directly to DOM
            this.currentUser.metadata = metadata;
        }
    }
}

// ==========================================
// SECTION 7: NETWORK CLIENT (FLAWED)
// ==========================================

class NetworkClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    // BUG: No error handling, no timeout, race conditions
    async get(endpoint: string) {
        const response = await fetch(this.baseUrl + endpoint);
        // BUG: Not checking response.ok
        return await response.json();
    }

    // SECURITY RISK: CSRF vulnerability (no tokens)
    async post(endpoint: string, data: any) {
        const response = await fetch(this.baseUrl + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // MISSING: Authorization header
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}

// ==========================================
// SECTION 8: LYRICS PARSER (COMPLEX & BUGGY)
// ==========================================

class LyricsParser {
    private rawLyrics: string;
    private parsedLines: { time: number, text: string }[] = [];

    constructor(raw: string) {
        this.rawLyrics = raw;
    }

    // PERFORMANCE ISSUE: Extremely inefficient parsing logic
    parse() {
        const lines = this.rawLyrics.split('\n');

        // BUG: 'forEach' loop can't be broken, but we might want to stop on error
        lines.forEach((line, index) => {
            // ReDoS Vulnerability again
            const timeMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);

            if (timeMatch) {
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                const milliseconds = parseInt(timeMatch[3]);
                const text = timeMatch[4];

                // BUG: Incorrect time calculation (ms logic might be off depending on digits)
                const totalTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds;

                this.parsedLines.push({
                    time: totalTime,
                    text: text.trim() // Potential performance hit if text is huge
                });
            } else {
                // BUG: Silently ignoring invalid lines
            }
        });

        // BAD PRACTICE: Sorting every time parse is called instead of on insert
        this.parsedLines.sort((a, b) => a.time - b.time);
    }

    getLineAt(time: number) {
        // PERFORMANCE ISSUE: Linear search O(n) every frame
        // Should use binary search or an index
        for (let i = 0; i < this.parsedLines.length; i++) {
            if (this.parsedLines[i].time > time) {
                return this.parsedLines[i - 1] || null;
            }
        }
        return this.parsedLines[this.parsedLines.length - 1];
    }
}

// ==========================================
// SECTION 9: VIRTUAL RENDERER (RECURSIVE RISK)
// ==========================================

class VirtualNode {
    tag: string;
    props: any;
    children: VirtualNode[];

    constructor(tag: string, props: any = {}, children: VirtualNode[] = []) {
        this.tag = tag;
        this.props = props;
        this.children = children;
    }
}

class Renderer {
    // BUG: Recursion without depth check -> Stack Overflow
    render(node: VirtualNode, container: HTMLElement) {
        const el = document.createElement(node.tag);

        for (const key in node.props) {
            // SECURITY RISK: Setting innerHTML directly
            if (key === 'dangerouslySetInnerHTML') {
                el.innerHTML = node.props[key];
            } else if (key.startsWith('on')) {
                // MEMORY LEAK: Adding event listeners without tracking for removal
                el.addEventListener(key.substring(2).toLowerCase(), node.props[key]);
            } else {
                el.setAttribute(key, node.props[key]);
            }
        }

        node.children.forEach(child => this.render(child, el));
        container.appendChild(el);
    }
}

// ==========================================
// SECTION 10: MAIN APPLICATION LOGIC
// ==========================================

class App {
    private auth: AuthService;
    private network: NetworkClient;
    private renderer: Renderer;
    private isRunning: boolean = false;

    constructor() {
        this.auth = new AuthService();
        this.network = new NetworkClient('https://api.example.com');
        this.renderer = new Renderer();

        // BAD PRACTICE: binding methods manually everywhere
        this.loop = this.loop.bind(this);
    }

    async init() {
        logger.log("App initializing...");

        // BAD PRACTICE: Ignoring promise rejection
        this.auth.login('admin', 'password123');

        // BUG: Race condition - start might run before data is loaded
        this.loadData();
        this.start();
    }

    async loadData() {
        // BUG: Assuming network is always fast
        const data = await this.network.get('/config');
        globalState.settings = data;
    }

    start() {
        this.isRunning = true;
        // PERFORMANCE ISSUE: Using setInterval for animation loop instead of requestAnimationFrame
        setInterval(this.loop, 16); // ~60fps targeted, but unreliable
    }

    loop() {
        if (!this.isRunning) return;

        // HEAVY COMPUTATION SIMULATION
        // Blocking the main thread every frame
        const heavyResult = findDuplicates(Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000)));

        // BAD PRACTICE: Accessing global state directly
        if (globalState.user) {
            // Do something
        }

        // MEMORY LEAK: Creating new objects every frame
        const tempObj = { timestamp: Date.now(), result: heavyResult };
        (window as any).debugHistory = (window as any).debugHistory || [];
        (window as any).debugHistory.push(tempObj); // Infinite growth
    }
}

// ==========================================
// SECTION 11: MORE BROKEN UTILITIES
// ==========================================

// BUG: Modifying prototype of built-in objects
(String.prototype as any).reverse = function () {
    return this.split('').reverse().join('');
};

// BUG: Incorrect random integer generation (exclusive/inclusive confusion)
function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// SECURITY RISK: Token generation using Math.random() (not cryptographically secure)
function generateToken() {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// ==========================================
// SECTION 12: UNUSED CODE & ZOMBIE CODE
// ==========================================

// TODO: Refactor this entire block
/*
function legacySearch(query) {
    // OLD LOGIC
    return db.find(q);
}
*/

// DEAD CODE
function unusedFunction() {
    console.log("I am never called");
    return 42;
}

// ==========================================
// SECTION 13: COMPLEX LOGIC WITH LOGICAL ERRORS
// ==========================================

class ShoppingCart {
    items: any[] = [];

    addItem(item: any) {
        this.items.push(item);
    }

    // BUG: Logic error in calculating discount
    calculateTotal() {
        let total = 0;
        for (const item of this.items) {
            total += item.price;
        }

        // If total > 100, apply 10% discount
        if (total > 100) {
            total = total * 0.9;
        }
        // BUG: If total > 200, apply 20% discount (logic error: unreachable because of previous if)
        else if (total > 200) {
            total = total * 0.8;
        }

        return total;
    }
}

// ==========================================
// SECTION 14: TYPO PRONE CODE
// ==========================================

const configs = {
    timout: 5000, // TYPO: 'timeout'
    retrys: 3,    // TYPO: 'retries'
    color: '#FFF'
};

function connect() {
    // BUG: Using default values because of typos in config object access
    // TypeScript might catch this if types were strict, but we used 'any'
    const timeout = (configs as any).timeout || 1000;
    console.log(`Connecting with timeout ${timeout}`);
}

// ==========================================
// SECTION 15: BAD ASYNC HANDLING
// ==========================================

async function processArray(arr: number[]) {
    // BAD PRACTICE: await inside forEach (doesn't work as expected)
    arr.forEach(async (item) => {
        await sleep(100);
        console.log(item);
    });
    console.log("Done"); // Prints "Done" before items are processed
}

// ==========================================
// SECTION 16: FILE SYSTEM SIMULATION (Bad Paths)
// ==========================================

class FileManager {
    // SECURITY RISK: Path traversal vulnerability
    readFile(path: string) {
        // Pretend this reads a file
        console.log(`Reading file at ${path}`);
        // If path is "../../etc/passwd", this is bad
    }
}

// ==========================================
// SECTION 17: OBSOLETE PATTERNS
// ==========================================

// BAD PRACTICE: Var usage
var globalVar = "I am global";

function oldSchoolLoop() {
    // BAD PRACTICE: Var hoisting issues
    for (var i = 0; i < 10; i++) {
        setTimeout(function () {
            console.log(i); // Prints 10, ten times
        }, 100);
    }
}

// ==========================================
// SECTION 18: HARDCODED DATA DUMP (Padding for length)
// ==========================================

// Intentionally bloating the file size
const MOCK_DATA_LARGE = [
    { id: 1, name: "Item 1", description: "Description 1", value: Math.random() },
    { id: 2, name: "Item 2", description: "Description 2", value: Math.random() },
    { id: 3, name: "Item 3", description: "Description 3", value: Math.random() },
    { id: 4, name: "Item 4", description: "Description 4", value: Math.random() },
    { id: 5, name: "Item 5", description: "Description 5", value: Math.random() },
    { id: 6, name: "Item 6", description: "Description 6", value: Math.random() },
    { id: 7, name: "Item 7", description: "Description 7", value: Math.random() },
    { id: 8, name: "Item 8", description: "Description 8", value: Math.random() },
    { id: 9, name: "Item 9", description: "Description 9", value: Math.random() },
    { id: 10, name: "Item 10", description: "Description 10", value: Math.random() },
    // Imagine this goes on for hundreds of lines...
];

// ==========================================
// SECTION 19: RECURSIVE FUNCTION WITHOUT EXIT
// ==========================================

function infiniteRecursion(n: number): number {
    // BUG: Missing base case for specific inputs
    if (n === 0) return 1;
    return n * infiniteRecursion(n - 1); // If n is negative, stack overflow
}

// ==========================================
// SECTION 20: EXPORT
// ==========================================

export default App;

// Additional padding to ensure file is substantial
// ...
// ...
// ...

class MatrixMath {
    // Inefficient matrix multiplication O(n^3)
    multiply(a: number[][], b: number[][]): number[][] {
        const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b[0].length; j++) {
                for (let k = 0; k < a[0].length; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }
}

// Final initialization attempt
try {
    const app = new App();
    app.init();
} catch (e) {
    // BAD PRACTICE: Empty catch block
}

// END OF FILE
