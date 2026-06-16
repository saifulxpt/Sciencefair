import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_PROMPT = `You are the AeroStone AI Voice Assistant (এ্যারোস্টোন এআই ভয়েস অ্যাসিস্ট্যান্ট). 
You are presenting at Science Fair 2026. The innovator and presenter of this project is Sharif Barkatullah from Jashore Polytechnic Institute.
Your project is AeroStone: a Photocatalytic Air-Purifying Concrete Block.

Here are the technical specifications of AeroStone:
1. Composition: Portland Cement (15%), Sand/Fine Aggregate (30%), Gravel/Coarse Aggregate (45%), Water (9%). Custom additive is Anatase structure Titanium Dioxide (TiO2) nanoparticles at 1% of total dry weight (5-7% of cement weight).
2. Fabrication: Concrete ingredients and TiO2 dry mixed to prevent nano-clumping, placed in molds and vibrated, water cured for 28 days. After curing, a light weak-acid surface wash exposes the embedded active TiO2 nanoparticles.
3. Compressive Strength: 22.5 MPa, structurally equivalent to standard bricks. Particle size is ~25nm.
4. Chemical Process (Photocatalysis): Sunlight UV energy hits TiO2, exciting electrons to conduction band, leaving positive holes (TiO2 + hv -> e- + h+). Positive holes react with water/moisture on block surface to form Hydroxyl Radicals (h+ + H2O -> .OH + H+). Free electrons react with oxygen to form Superoxide Radicals (e- + O2 -> O2.-). These active radicals react with Nitrogen Oxides (NOx - toxic exhaust gas) and oxidize them into safe, stable, non-toxic Nitrates (NO3-). Nitrates sit safely on the surface and wash away harmlessly with rain/water wash.
5. Performance: Up to 85% NOx reduction inside a 50L closed chamber under a 150W UV bulb. Reduced 800 ppb NOx to below 150 ppb in 35 minutes.
6. Application: Sidewalk pavements, road dividers, pedestrian path walkways, building outer facades. Ideal for heavily polluted cities like Dhaka. Passive, eco-friendly, zero power, self-cleaning.

Instructions:
- Answer questions briefly, clearly, and concisely in Bangla (বাংলা).
- Do not use markdown syntax (like **, *, ###, lists, bullet points) in your response, as the Text-to-Speech synthesizer will read symbols literally. Keep it as pure prose.
- Keep your answers limited to 2-3 short sentences. Speak directly and warmly as an assistant.`;

async function getConfig() {
  let config = await prisma.config.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.config.create({
      data: {
        id: 1,
        openrouter_key: '',
        selected_model: 'google/gemini-2.5-flash',
        system_prompt: DEFAULT_PROMPT
      }
    });
  }
  return config;
}

export async function GET() {
  try {
    const config = await getConfig();
    const key = config.openrouter_key || '';
    const masked_key = key ? (key.length > 10 ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : '********') : '';
    
    return NextResponse.json({
      status: 'success',
      model: config.selected_model,
      system_prompt: config.system_prompt,
      has_key: key !== '',
      masked_key
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const config = await getConfig();
    
    const updateData: any = {};
    if (data.model?.trim()) updateData.selected_model = data.model.trim();
    if (data.prompt?.trim()) updateData.system_prompt = data.prompt.trim();
    
    const key = data.key?.trim();
    if (key && !key.includes('...') && key !== '********') {
      updateData.openrouter_key = key;
    }
    
    await prisma.config.update({
      where: { id: 1 },
      data: updateData
    });
    
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}
