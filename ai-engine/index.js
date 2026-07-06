/**
 * AI Engine to interact with configured LLM Provider.
 * Environment variables are loaded by server/server.js before this module is imported.
 */
class AIEngine {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'mock';
    this.apiKey = this.getApiKey();
    console.log(`[AIEngine] Initialized with provider: ${this.provider}`);
  }

  getApiKey() {
    switch (this.provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'gemini':
        return process.env.GEMINI_API_KEY;
      default:
        return null;
    }
  }

  /**
   * Generates a response based on the conversation history.
   * @param {Array<{role: string, content: string}>} messages - The message history.
   * @returns {Promise<{role: string, content: string}>} - The assistant's response.
   */
  async generateResponse(messages) {
    // Ensure we reload environment variables in case they changed
    this.provider = process.env.LLM_PROVIDER || 'mock';
    this.apiKey = this.getApiKey();

    if (this.provider === 'openai') {
      return this.callOpenAI(messages);
    } else if (this.provider === 'gemini') {
      return this.callGemini(messages);
    } else {
      return this.callMock(messages);
    }
  }

  async callOpenAI(messages) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing. Please configure OPENAI_API_KEY in server/.env.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message;
      if (!assistantMessage) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      return {
        role: 'assistant',
        content: assistantMessage.content
      };
    } catch (error) {
      console.error('[AIEngine] OpenAI Error:', error);
      throw error;
    }
  }

  async callGemini(messages) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is missing. Please configure GEMINI_API_KEY in server/.env.');
    }

    try {
      const contents = messages.map(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        return {
          role,
          parts: [{ text: msg.content }]
        };
      });

      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          // 🔥 IMPORTANT FIX
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
      }

      const data = await response.json();

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Invalid response structure from Gemini API');
      }

      return {
        role: 'assistant',
        content: text
      };

    } catch (error) {
      console.error('[AIEngine] Gemini Error:', error);
      throw error;
    }
  }

  async callMock(messages) {
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    let responseText = `Greetings! I am JARVIS. You asked: "${lastUserMessage}". This is a simulated response because the LLM provider is set to 'mock'. Set LLM_PROVIDER to 'openai' or 'gemini' and configure the API key in server/.env to use a live model.`;

    // Custom responses for verification
    if (lastUserMessage.toLowerCase().includes('hello') || lastUserMessage.toLowerCase().includes('hi')) {
      responseText = "Hello, Sir. I am online and ready. System diagnostics report all modules operating within normal parameters. How may I assist you?";
    } else if (lastUserMessage.toLowerCase().includes('system status')) {
      responseText = "System status: Core online. UI Render Engine operational. API Layer listening. AI Engine using Mock Mode. Plugins ready for initialization.";
    }

    // Wait a brief moment to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      role: 'assistant',
      content: responseText
    };
  }
}

module.exports = new AIEngine();
