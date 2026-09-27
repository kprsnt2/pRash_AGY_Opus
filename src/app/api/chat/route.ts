import { NextRequest } from 'next/server';
import { getAgent } from '@/lib/agents';
import { getModelChain } from '@/lib/models';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { FileAttachment } from '@/lib/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, agentId, privacyMode } = body;

    if (!messages || !agentId) {
      return new Response('Missing required fields', { status: 400 });
    }

    const agent = getAgent(agentId);
    if (!agent) {
      return new Response('Agent not found', { status: 404 });
    }

    const modelChain = getModelChain(privacyMode);

    const formattedMessages = messages.map((msg: any) => {
      if (msg.attachments && msg.attachments.length > 0) {
        const content: any[] = [{ type: 'text', text: msg.content }];
        
        for (const attachment of msg.attachments as FileAttachment[]) {
          if (attachment.type.startsWith('image/')) {
            content.push({ type: 'image', image: attachment.dataUrl });
          } else {
            content[0].text += `\n\n[Attached file: ${attachment.name}]`;
          }
        }
        return { role: msg.role, content };
      }
      return { role: msg.role, content: msg.content };
    });

    for (const modelConfig of modelChain) {
      try {
        let provider;
        if (modelConfig.provider === 'openai' && process.env.OPENAI_API_KEY) {
          provider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
        } else if (modelConfig.provider === 'google' && process.env.GOOGLE_API_KEY) {
          provider = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });
        } else if (modelConfig.provider === 'groq' && process.env.GROQ_API_KEY) {
          provider = createOpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
        } else if (modelConfig.provider === 'nvidia' && process.env.NVIDIA_API_KEY) {
          provider = createOpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });
        } else {
          console.warn(`Skipping ${modelConfig.provider} due to missing API key`);
          continue;
        }

        const result = await streamText({
          model: provider(modelConfig.modelId),
          system: agent.systemPrompt,
          messages: formattedMessages,
        });

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of result.textStream) {
                controller.enqueue(encoder.encode(chunk));
              }
            } catch (err) {
              console.error('Error during streaming:', err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Model-Used': modelConfig.name,
            'X-Content-Type': 'text/event-stream',
          },
        });
      } catch (error) {
        console.error(`Error with model ${modelConfig.name}:`, error);
        // Continue to the next model in the chain
      }
    }

    return new Response('All models in chain failed or are unavailable', { status: 503 });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
