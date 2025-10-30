export async function onRequestPost(context) {
  const data = await context.request.formData();
  const name = (data.get('name') || '').toString();
  const email = (data.get('email') || '').toString();
  const message = (data.get('message') || '').toString();

  if (!name || !email || !message) {
    return new Response('Missing fields', { status: 400 });
  }

  // Send via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'DMAR Website <notifications@dmarinternational.com>', // any address ON your verified domain
      to: ['info@dmarinternational.com'],
      reply_to: email,
      subject: `New contact — ${name}`,
      html: `
        <h2>New contact</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
           <strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `
    })
  });

  if (!res.ok) return new Response('Email failed', { status: 500 });
  return new Response('OK', { status: 200 });
}

function escapeHtml(s){return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
