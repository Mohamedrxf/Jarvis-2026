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

/**
 * Weather Tool
 * Returns current weather information for a given city (mock data)
 * @param {Object} params - Parameters (required: city)
 * @returns {Object} Result object with weather data or error
 */
function weatherHandler(params) {
    try {
        if (!params || !params.city) {
            return {
                result: null,
                error: 'Missing required parameter: city'
            };
        }

        const city = String(params.city).trim();

        if (city.length === 0) {
            return {
                result: null,
                error: 'City name cannot be empty'
            };
        }

        // Mock weather database with deterministic data
        const weatherDatabase = {
            'chennai': {
                temperature: '32°C',
                condition: 'Hot and Humid',
                humidity: '78%'
            },
            'mumbai': {
                temperature: '29°C',
                condition: 'Partly Cloudy',
                humidity: '82%'
            },
            'delhi': {
                temperature: '35°C',
                condition: 'Sunny',
                humidity: '45%'
            },
            'bangalore': {
                temperature: '25°C',
                condition: 'Pleasant',
                humidity: '65%'
            }
        };

        // Normalize city name for lookup
        const normalizedCity = city.toLowerCase();

        // Get weather data or use fallback
        const weatherData = weatherDatabase[normalizedCity] || {
            temperature: '28°C',
            condition: 'Clear',
            humidity: '60%'
        };

        return {
            result: {
                city: city,
                temperature: weatherData.temperature,
                condition: weatherData.condition,
                humidity: weatherData.humidity,
                source: 'mock'
            }
        };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to get weather data: ' + error.message
        };
    }
}

registerTool('weather', weatherHandler);

/**
 * Currency Converter Tool
 * Converts between USD, INR, and EUR using mock exchange rates
 * @param {Object} params - Parameters (required: amount, from, to)
 * @returns {Object} Result object with converted amount or error
 */
function currencyHandler(params) {
    try {
        // Validate parameters
        if (!params) {
            return {
                result: null,
                error: 'Missing required parameters: amount, from, to'
            };
        }

        if (params.amount === undefined || params.amount === null) {
            return {
                result: null,
                error: 'Missing required parameter: amount'
            };
        }

        if (!params.from) {
            return {
                result: null,
                error: 'Missing required parameter: from'
            };
        }

        if (!params.to) {
            return {
                result: null,
                error: 'Missing required parameter: to'
            };
        }

        const amount = parseFloat(params.amount);
        const fromCurrency = String(params.from).toUpperCase().trim();
        const toCurrency = String(params.to).toUpperCase().trim();

        // Validate amount
        if (isNaN(amount) || amount < 0) {
            return {
                result: null,
                error: 'Invalid amount. Must be a non-negative number.'
            };
        }

        // Validate currencies
        const supportedCurrencies = ['USD', 'INR', 'EUR'];
        if (!supportedCurrencies.includes(fromCurrency)) {
            return {
                result: null,
                error: `Unsupported currency: ${fromCurrency}. Supported currencies: ${supportedCurrencies.join(', ')}`
            };
        }

        if (!supportedCurrencies.includes(toCurrency)) {
            return {
                result: null,
                error: `Unsupported currency: ${toCurrency}. Supported currencies: ${supportedCurrencies.join(', ')}`
            };
        }

        // If same currency, return original amount
        if (fromCurrency === toCurrency) {
            return {
                result: {
                    from: fromCurrency,
                    to: toCurrency,
                    inputAmount: amount,
                    convertedAmount: amount,
                    rateUsed: 1.0
                }
            };
        }

        // Mock exchange rates (all relative to INR as base)
        // 1 USD = 83 INR
        // 1 EUR = 90 INR
        // 1 USD = 0.92 EUR
        const ratesToINR = {
            'USD': 83,
            'EUR': 90,
            'INR': 1
        };

        // Convert via INR as base currency
        // Step 1: Convert from source currency to INR
        const amountInINR = amount * ratesToINR[fromCurrency];

        // Step 2: Convert from INR to target currency
        const convertedAmount = amountInINR / ratesToINR[toCurrency];

        // Calculate the rate used (how many target units per 1 source unit)
        const rateUsed = ratesToINR[fromCurrency] / ratesToINR[toCurrency];

        return {
            result: {
                from: fromCurrency,
                to: toCurrency,
                inputAmount: amount,
                convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
                rateUsed: Math.round(rateUsed * 10000) / 10000 // Round rate to 4 decimals
            }
        };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to convert currency: ' + error.message
        };
    }
}

registerTool('currency', currencyHandler);

/**
 * Web Search Tool
 * Returns mock search results based on keyword matching
 * @param {Object} params - Parameters (required: query)
 * @returns {Object} Result object with search results or error
 */
function webSearchHandler(params) {
    try {
        if (!params || !params.query) {
            return {
                result: null,
                error: 'Missing required parameter: query'
            };
        }

        const query = String(params.query).trim().toLowerCase();

        if (query.length === 0) {
            return {
                result: null,
                error: 'Query cannot be empty'
            };
        }

        // Mock search database with keyword-based results
        const mockResults = {
            weather: [
                {
                    title: "Weather Forecast - Today's Weather",
                    snippet: "Get accurate weather forecasts for your location. Real-time updates on temperature, humidity, and conditions.",
                    url: "https://example.com/weather-forecast"
                },
                {
                    title: "Weather Patterns and Climate Change",
                    snippet: "Understanding how weather patterns are changing due to global climate shifts and what it means for the future.",
                    url: "https://example.com/weather-climate"
                },
                {
                    title: "Local Weather Radar",
                    snippet: "Interactive weather radar showing real-time precipitation, storm tracking, and severe weather alerts.",
                    url: "https://example.com/weather-radar"
                }
            ],
            javascript: [
                {
                    title: "JavaScript Tutorial - W3Schools",
                    snippet: "Learn JavaScript with easy-to-follow tutorials and examples. From basics to advanced concepts.",
                    url: "https://example.com/js-tutorial"
                },
                {
                    title: "Modern JavaScript (ES6+) Features",
                    snippet: "Comprehensive guide to modern JavaScript features including arrow functions, destructuring, and async/await.",
                    url: "https://example.com/js-modern"
                },
                {
                    title: "JavaScript Best Practices",
                    snippet: "Writing clean, maintainable JavaScript code with industry-standard best practices and patterns.",
                    url: "https://example.com/js-best-practices"
                }
            ],
            ai: [
                {
                    title: "Best AI Tools in 2026",
                    snippet: "List of popular AI tools and platforms revolutionizing productivity and creativity in 2026.",
                    url: "https://example.com/ai-tools"
                },
                {
                    title: "Artificial Intelligence Fundamentals",
                    snippet: "Understanding the basics of AI, machine learning, and neural networks for beginners.",
                    url: "https://example.com/ai-fundamentals"
                },
                {
                    title: "AI Applications in Daily Life",
                    snippet: "How artificial intelligence is transforming everyday tasks from personal assistants to smart homes.",
                    url: "https://example.com/ai-applications"
                }
            ],
            news: [
                {
                    title: "Breaking News - Latest Updates",
                    snippet: "Stay informed with the latest breaking news from around the world. Real-time updates and analysis.",
                    url: "https://example.com/breaking-news"
                },
                {
                    title: "Technology News Today",
                    snippet: "Latest technology news covering gadgets, software updates, and tech industry developments.",
                    url: "https://example.com/tech-news"
                },
                {
                    title: "Global News Headlines",
                    snippet: "Top headlines from around the globe covering politics, business, and international affairs.",
                    url: "https://example.com/global-news"
                }
            ]
        };

        // Determine which results to return based on query keywords
        let results;
        if (query.includes('weather')) {
            results = mockResults.weather;
        } else if (query.includes('javascript') || query.includes('js')) {
            results = mockResults.javascript;
        } else if (query.includes('ai') || query.includes('artificial intelligence')) {
            results = mockResults.ai;
        } else if (query.includes('news')) {
            results = mockResults.news;
        } else {
            // Default general search results
            results = [
                {
                    title: `Search Results for "${params.query.trim()}"`,
                    snippet: `General search results matching your query about "${params.query.trim()}". Find relevant information and resources.`,
                    url: "https://example.com/search"
                },
                {
                    title: "Top Results - Web Search",
                    snippet: "Curated results from across the web matching your search criteria and interests.",
                    url: "https://example.com/top-results"
                },
                {
                    title: "Related Information",
                    snippet: "Additional resources and information related to your search query.",
                    url: "https://example.com/related"
                }
            ];
        }

        return {
            result: {
                query: params.query.trim(),
                results: results
            }
        };
    } catch (error) {
        return {
            result: null,
            error: 'Failed to perform web search: ' + error.message
        };
    }
}

registerTool('web_search', webSearchHandler);

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