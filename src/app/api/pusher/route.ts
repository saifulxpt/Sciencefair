import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.pin) {
      return NextResponse.json({ error: "No PIN" }, { status: 400 });
    }

    const app_id = "2142548";
    const key = "e9724bd6db7ccd51f076";
    const secret = "d9314ff61394d94785c6";
    const cluster = "ap2";

    const payload = JSON.stringify({
      name: "slide-update",
      channels: [`ecoblock-${data.pin}`],
      data: JSON.stringify(data)
    });

    const path = `/apps/${app_id}/events`;
    const body_md5 = crypto.createHash('md5').update(payload).digest('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const query = `auth_key=${key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${body_md5}`;
    
    const signature_string = `POST\n${path}\n${query}`;
    const auth_signature = crypto.createHmac('sha256', secret).update(signature_string).digest('hex');

    const url = `https://api-${cluster}.pusher.com${path}?${query}&auth_signature=${auth_signature}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    });

    if (response.ok) {
      return NextResponse.json({ status: "success" });
    } else {
      const errorText = await response.text();
      console.error("Pusher Error:", errorText);
      return NextResponse.json({ error: "Failed to trigger pusher" }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
