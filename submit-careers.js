export async function onRequestPost(context) {
  const data = await context.request.formData();
  const name = (data.get('name') || '').toString();
  const email = (data.get('email') || '').toString();
  const role = (data.get('role') || '').toString();
  const location = (data.get('location') || '').toString();
  const msg = (data.get('message') || '').toString();
  const file = data.get('cv'); // File object (optional)

  const attachments = [];
  if (file && typeof file === 'object' && file.size > 0) {
    const buf = await file.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    attachments.push({
      filename: file.name || 'cv.pdf',
      content: b64,
      // contentType is optional, Resend detects; you can add: type: file.type
    });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'DMAR Careers <notifications@dmarinternational.com>',
      to: ['careers@dmarinternational.com'],
      reply_to: email,
      subject: `New CV — ${name} (${role || 'Role N/A'})`,
      html: `
        <h2>New careers submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
           <strong>Email:</strong> ${escapeHtml(email)}<br/>
           <strong>Role:</strong> ${escapeHtml(role)}<br/>
           <strong>Location:</strong> ${escapeHtml(location)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(msg)}</p>
        <p>${attachments.length ? 'Attachment included.' : 'No attachment.'}</p>
      `,
      attachments
    })
  });

  if (!res.ok) return new Response('Email failed', { status: 500 });
  return new Response('OK', { status: 200 });
}

function escapeHtml(s){return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
