import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const query = data.query?.trim();
    const history = data.history || [];

    if (!query) {
      return NextResponse.json({ status: 'error', message: 'Empty query' });
    }

    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || !config.openrouter_key) {
      return NextResponse.json({ status: 'error', message: 'OpenRouter API Key is not configured. please set it in the Admin Panel.' });
    }

    const messages = [
      { role: 'system', content: config.system_prompt }
    ];

    for (const msg of history) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    }

    messages.push({ role: 'user', content: query });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openrouter_key}`,
        'HTTP-Referer': 'http://160.25.226.152',
        'X-Title': 'AeroStone Voice Assistant'
      },
      body: JSON.stringify({
        model: config.selected_model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        status: 'error', 
        message: result.error?.message || `OpenRouter connection error (HTTP ${response.status})` 
      });
    }

    const reply = result.choices?.[0]?.message?.content?.trim() || '';

    if (reply) {
      try {
        await prisma.aiLog.create({
          data: {
            query: query,
            response: reply
          }
        });
      } catch (err) {
        console.error("Failed to log to database", err);
      }

      return NextResponse.json({ status: 'success', response: reply });
    } else {
      return NextResponse.json({ status: 'error', message: 'Failed to parse AI response.' });
    }

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}
