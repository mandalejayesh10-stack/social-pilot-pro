import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Ollama local LLM service.
 * Zero cost — runs entirely on your machine.
 * Falls back to OpenAI if OPENAI_API_KEY is set and Ollama is unavailable.
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private readonly model = process.env.OLLAMA_MODEL || 'llama3.2';

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      return await this.generateWithOllama(prompt, systemPrompt);
    } catch (err) {
      this.logger.warn(`Ollama unavailable: ${err.message}. Trying fallback...`);
      if (process.env.OPENAI_API_KEY) {
        return await this.generateWithOpenAI(prompt, systemPrompt);
      }
      throw new Error('AI service unavailable. Please ensure Ollama is running.');
    }
  }

  private async generateWithOllama(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await axios.post(
      `${this.baseUrl}/api/chat`,
      {
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1024,
        },
      },
      { timeout: 60000 },
    );

    return res.data.message?.content || '';
  }

  private async generateWithOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: any[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 30000,
      },
    );

    return res.data.choices[0]?.message?.content || '';
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
