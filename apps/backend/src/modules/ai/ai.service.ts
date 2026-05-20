import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Platform } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private ollama: OllamaService,
    private analytics: AnalyticsService,
  ) {}

  // ── Caption generation ────────────────────────────────────
  async generateCaption(params: {
    platform: string;
    topic: string;
    tone?: string;
    includeHashtags?: boolean;
    maxLength?: number;
  }): Promise<{ caption: string; hashtags: string[] }> {
    const systemPrompt = `You are a professional social media copywriter. 
Write engaging, authentic captions optimized for ${params.platform}.
Tone: ${params.tone || 'professional and engaging'}.
${params.maxLength ? `Maximum length: ${params.maxLength} characters.` : ''}
Return JSON with fields: caption (string) and hashtags (array of strings without #).`;

    const prompt = `Write a ${params.platform} caption about: ${params.topic}`;

    const response = await this.ollama.generate(prompt, systemPrompt);

    try {
      const parsed = JSON.parse(this.extractJson(response));
      return {
        caption: parsed.caption || response,
        hashtags: parsed.hashtags || [],
      };
    } catch {
      // Fallback: return raw response
      const hashtags = response.match(/#\w+/g)?.map((t) => t.slice(1)) || [];
      return { caption: response.replace(/#\w+/g, '').trim(), hashtags };
    }
  }

  // ── Hashtag suggestions ───────────────────────────────────
  async suggestHashtags(params: {
    platform: string;
    content: string;
    niche?: string;
    count?: number;
  }): Promise<string[]> {
    const systemPrompt = `You are a social media hashtag expert.
Suggest relevant, high-performing hashtags for ${params.platform}.
${params.niche ? `Niche: ${params.niche}.` : ''}
Return a JSON array of hashtag strings (without the # symbol).
Aim for a mix of popular and niche-specific tags.`;

    const prompt = `Suggest ${params.count || 20} hashtags for this content: "${params.content}"`;

    const response = await this.ollama.generate(prompt, systemPrompt);

    try {
      const arr = JSON.parse(this.extractJson(response));
      return Array.isArray(arr) ? arr.slice(0, params.count || 20) : [];
    } catch {
      return response.match(/#?\w+/g)?.slice(0, params.count || 20) || [];
    }
  }

  // ── Analytics insights ────────────────────────────────────
  async generateInsights(
    organizationId: string,
    platform: Platform,
    period: string = '30d',
  ): Promise<string> {
    const analytics = await this.analytics.getPlatformAnalytics(
      organizationId,
      platform,
      period,
    );

    if (!analytics.summary) {
      return 'Not enough data to generate insights yet. Connect your accounts and wait for the analytics pipeline to collect data.';
    }

    const s = analytics.summary;
    const systemPrompt = `You are a social media analytics expert.
Analyze the provided metrics and give actionable, specific insights.
Be concise, data-driven, and focus on what the user can do to improve.
Format your response in clear paragraphs.`;

    const prompt = `Analyze these ${platform} analytics for the past ${period}:
- Followers: ${s.totalFollowers} (${s.growthPercent > 0 ? '+' : ''}${s.growthPercent}% growth)
- Average engagement rate: ${s.avgEngagementRate.toFixed(2)}%
- Total reach: ${s.totalReach.toLocaleString()}
- Total posts: ${s.totalPosts}
- Best posting hour: ${s.bestPostingHour !== null ? `${s.bestPostingHour}:00 UTC` : 'Not enough data'}
- Best posting day: ${s.bestPostingDay !== null ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][s.bestPostingDay] : 'Not enough data'}
- Top content type: ${s.topContentType || 'Mixed'}

Provide 3-5 specific, actionable insights to improve performance.`;

    return this.ollama.generate(prompt, systemPrompt);
  }

  // ── Chatbot (analytics Q&A) ───────────────────────────────
  async chat(params: {
    organizationId: string;
    message: string;
    platform?: Platform;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<string> {
    // Fetch context data
    let contextData = '';
    if (params.platform) {
      const analytics = await this.analytics.getPlatformAnalytics(
        params.organizationId,
        params.platform,
        '30d',
      );
      if (analytics.summary) {
        const s = analytics.summary;
        contextData = `
Current ${params.platform} analytics (last 30 days):
- Followers: ${s.totalFollowers} (${s.growthPercent}% growth)
- Avg engagement rate: ${s.avgEngagementRate.toFixed(2)}%
- Total reach: ${s.totalReach}
- Best posting time: ${s.bestPostingHour !== null ? `${s.bestPostingHour}:00 UTC` : 'Unknown'}
- Top content type: ${s.topContentType || 'Mixed'}`;
      }
    }

    const systemPrompt = `You are an AI assistant for a social media management platform.
You help users understand their analytics, improve their content strategy, and grow their audience.
Be helpful, specific, and data-driven. Keep responses concise (2-3 paragraphs max).
${contextData ? `\nUser's analytics context:\n${contextData}` : ''}`;

    const history = params.conversationHistory || [];
    const messages = [
      ...history.map((h) => `${h.role}: ${h.content}`).join('\n'),
      `User: ${params.message}`,
    ].join('\n');

    return this.ollama.generate(messages, systemPrompt);
  }

  // ── Report summary ────────────────────────────────────────
  async generateReportSummary(reportData: {
    platform: string;
    period: string;
    metrics: Record<string, any>;
    topPosts: any[];
  }): Promise<string> {
    const systemPrompt = `You are a professional social media analyst writing an executive summary.
Be concise, highlight key wins and areas for improvement.
Write in a professional tone suitable for a business report.`;

    const prompt = `Write an executive summary for this ${reportData.platform} report (${reportData.period}):
Metrics: ${JSON.stringify(reportData.metrics, null, 2)}
Top posts: ${reportData.topPosts.length} posts analyzed.
Key performer: ${reportData.topPosts[0]?.content?.slice(0, 100) || 'N/A'}`;

    return this.ollama.generate(prompt, systemPrompt);
  }

  private extractJson(text: string): string {
    const match = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                  text.match(/(\{[\s\S]*\})/) ||
                  text.match(/(\[[\s\S]*\])/);
    return match ? match[1] : text;
  }
}
