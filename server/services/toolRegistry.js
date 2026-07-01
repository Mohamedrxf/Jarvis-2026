// Tool Registry - Phase 7.0 Step 1
// Basic skeleton for tool management

const tools = {};

/**
 * Safe math expression parser and evaluator
 * Supports: +, -, *, /, (, ), and numbers
 * @param {string} expression - Mathematical expression to evaluate
 * @returns {Object} Result object with result or error
 */
function safeMathEvaluate(expression) {
    try {
        const sanitized = expression.replace(/\s/g, '');

        if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
            return {
                result: null,
                error: 'Invalid characters. Only numbers and +, -, *, /, ( ) are allowed.'
            };
        }

        const tokens = tokenize(sanitized);
        if (tokens.error) {
            return { result: null, error: tokens.error };
        }

        const result = parseExpression(tokens);

        if (result.error) {
            return { result: null, error: result.error };
        }

        return { result: result.value };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to evaluate expression: ' + error.message
        };
    }
}

function tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
        const char = expr[i];

        if (/[0-9]/.test(char) || (char === '.' && i + 1 < expr.length && /[0-9]/.test(expr[i + 1]))) {
            let numStr = '';
            while (i < expr.length && /[0-9.]/.test(expr[i])) {
                numStr += expr[i];
                i++;
            }
            if ((numStr.match(/\./g) || []).length > 1) {
                return { error: 'Invalid number format: ' + numStr };
            }
            tokens.push({ type: 'number', value: parseFloat(numStr) });
            continue;
        }

        if (['+', '-', '*', '/', '(', ')'].includes(char)) {
            tokens.push({ type: 'operator', value: char });
            i++;
            continue;
        }

        return { error: 'Unexpected character: ' + char };
    }

    return tokens;
}

function parseExpression(tokens) {
    let pos = 0;

    function parse() {
        let left = parseTerm();

        while (pos < tokens.length && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
            const op = tokens[pos].value;
            pos++;
            const right = parseTerm();

            if (right.error) return right;

            left = {
                value: op === '+' ? left.value + right.value : left.value - right.value
            };
        }

        return left;
    }

    function parseTerm() {
        let left = parseFactor();

        while (pos < tokens.length && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
            const op = tokens[pos].value;
            pos++;
            const right = parseFactor();

            if (right.error) return right;

            if (op === '/') {
                if (right.value === 0) {
                    return { error: 'Division by zero' };
                }
                left = { value: left.value / right.value };
            } else {
                left = { value: left.value * right.value };
            }
        }

        return left;
    }

    function parseFactor() {
        if (pos < tokens.length && tokens[pos].value === '-') {
            pos++;
            const factor = parseFactor();
            if (factor.error) return factor;
            return { value: -factor.value };
        }

        if (pos < tokens.length && tokens[pos].value === '(') {
            pos++;
            const expr = parse();

            if (pos >= tokens.length || tokens[pos].value !== ')') {
                return { error: 'Mismatched parentheses' };
            }
            pos++;
            return expr;
        }

        if (pos < tokens.length && tokens[pos].type === 'number') {
            const value = tokens[pos].value;
            pos++;
            return { value: value };
        }

        return { error: 'Unexpected token at position ' + pos };
    }

    const result = parse();

    if (pos < tokens.length) {
        return { error: 'Unexpected token: ' + tokens[pos].value };
    }

    return result;
}

function calculatorHandler(params) {
    if (!params || !params.expression) {
        return {
            result: null,
            error: 'Missing required parameter: expression'
        };
    }

    const expression = String(params.expression).trim();

    if (expression.length === 0) {
        return {
            result: null,
            error: 'Expression cannot be empty'
        };
    }

    return safeMathEvaluate(expression);
}

registerTool('calculator', calculatorHandler);

/**
 * UUID Generator Tool
 * Generates RFC4122 UUID v4 using Node.js crypto module
 * @param {Object} params - Parameters (none required)
 * @returns {Object} Result object with UUID or error
 */
function uuidHandler(params) {
    try {
        const crypto = require('crypto');
        const uuid = crypto.randomUUID();
        return { result: uuid };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to generate UUID: ' + error.message
        };
    }
}

registerTool('uuid', uuidHandler);

/**
 * Password Generator Tool
 * Generates secure random password with uppercase, lowercase, and numbers
 * @param {Object} params - Parameters (optional length, default 12)
 * @returns {Object} Result object with password or error
 */
function passwordHandler(params) {
    try {
        const crypto = require('crypto');

        // Get length from params or use default
        let length = 12;
        if (params && params.length !== undefined) {
            length = parseInt(params.length, 10);
            if (isNaN(length) || length < 1) {
                return {
                    result: null,
                    error: 'Invalid length. Must be a positive number.'
                };
            }
        }

        // Character sets
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const allChars = uppercase + lowercase + numbers;

        // Generate password ensuring at least one of each required type
        const randomBytes = crypto.randomBytes(length);
        let password = '';

        // Ensure at least one uppercase, one lowercase, and one number
        password += uppercase[randomBytes[0] % uppercase.length];
        password += lowercase[randomBytes[1] % lowercase.length];
        password += numbers[randomBytes[2] % numbers.length];

        // Fill the rest with random characters from all sets
        for (let i = 3; i < length; i++) {
            password += allChars[randomBytes[i] % allChars.length];
        }

        // Shuffle the password to randomize positions
        const passwordArray = password.split('');
        const shuffleBytes = crypto.randomBytes(length);
        for (let i = passwordArray.length - 1; i > 0; i--) {
            const j = shuffleBytes[i] % (i + 1);
            [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
        }

        return { result: passwordArray.join('') };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to generate password: ' + error.message
        };
    }
}

registerTool('password', passwordHandler);

/**
 * DateTime Tool
 * Returns current date and time information
 * @param {Object} params - Parameters (none required)
 * @returns {Object} Result object with date/time info or error
 */
function datetimeHandler(params) {
    try {
        const now = new Date();
        return {
            result: {
                date: now.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                }),
                iso: now.toISOString()
            }
        };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to get date/time: ' + error.message
        };
    }
}

registerTool('datetime', datetimeHandler);

function registerTool(name, handler) {
    tools[name] = handler;
}

function getTool(name) {
    return tools[name];
}

function listTools() {
    return Object.keys(tools);
}

module.exports = {
    registerTool,
    getTool,
    listTools
};