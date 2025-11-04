(() => {
  'use strict';

  const FORM_SELECTOR = '[data-careers]';
  const MSG_ID = 'careers-msg';
  const ENDPOINT = 'https://career-sender.piazenko-n.workers.dev';
  const MAX_FILE_BYTES = 5 * 1024 * 1024; 
  const ALLOWED_EXT = ['pdf', 'doc', 'docx'];

  const setMessage = (el, text) => {
    if (!el) return;
    el.textContent = text;
  };

  const disableSubmit = (form, disabled = true) => {
    const btn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!btn) return;
    btn.disabled = disabled;
    if (disabled) btn.setAttribute('aria-busy', 'true');
    else btn.removeAttribute('aria-busy');
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

  const getFileExt = (name) => {
    const idx = String(name || '').lastIndexOf('.');
    return idx === -1 ? '' : String(name).slice(idx + 1).toLowerCase();
  };

  const validateForm = (form) => {
    const name = form.elements['name'];
    const email = form.elements['email'];
    const cv = form.elements['cv'];
    const message = form.elements['message'];

    const valName = name?.value?.trim() ?? '';
    const valEmail = email?.value?.trim() ?? '';
    const files = cv && cv.files ? cv.files : [];
    const valMessage = message?.value?.trim() ?? '';

    const errors = [];
    let firstInvalid = null;

    if (!valName || valName.length < 2) {
      errors.push('Please enter your name (at least 2 characters).');
      if (!firstInvalid) firstInvalid = name;
    }

    if (!valEmail) {
      errors.push('Please enter your email.');
      if (!firstInvalid) firstInvalid = email;
    } else if (!isValidEmail(valEmail)) {
      errors.push('Please enter a valid email address.');
      if (!firstInvalid) firstInvalid = email;
    }

    if (!files || files.length === 0) {
      errors.push('Please attach your CV (pdf/doc/docx).');
      if (!firstInvalid) firstInvalid = cv;
    } else {
      const file = files[0];
      const ext = getFileExt(file.name);
      if (!ALLOWED_EXT.includes(ext)) {
        errors.push('CV must be a PDF or Word document (.pdf, .doc, .docx).');
        if (!firstInvalid) firstInvalid = cv;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push('CV is too large — max 5 MB.');
        if (!firstInvalid) firstInvalid = cv;
      }
    }

    if (valMessage && valMessage.length > 0 && valMessage.length < 2) {
      errors.push('Please provide more details in the message (at least 2 characters) or leave it empty.');
      if (!firstInvalid) firstInvalid = message;
    }

    return { ok: errors.length === 0, errors, firstInvalid };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const msgEl = document.getElementById(MSG_ID);
    if (!msgEl) {
      console.warn(`#${MSG_ID} not found — aborting submit handler`);
      return;
    }

    const { ok, errors, firstInvalid } = validateForm(form);
    if (!ok) {
      setMessage(msgEl, errors.join(' '));
      if (firstInvalid?.focus) firstInvalid.focus();
      return;
    }

    setMessage(msgEl, 'Uploading…');
    disableSubmit(form, true);

    const data = new FormData(form);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        body: data
      });

      if (res.ok) {
        setMessage(msgEl, 'Thanks — received. We’ll review your CV.');
        form.reset();
      } else {
        const text = await res.text().catch(() => 'Error');
        console.error('Upload failed response:', res.status, text);
        setMessage(msgEl, 'Upload failed — email info@dmarinternational.com');
      }
    } catch (err) {
      setMessage(msgEl, 'Upload failed — email info@dmarinternational.com');
      console.error('Network/upload error:', err);
    } finally {
      disableSubmit(form, false);
    }
  };

  const init = () => {
    const form = document.querySelector(FORM_SELECTOR);
    if (!form) {
      console.warn(`No element matches selector "${FORM_SELECTOR}" — careers form not initialized.`);
      return;
    }
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('input', () => {
      const msgEl = document.getElementById(MSG_ID);
      if (msgEl) msgEl.textContent = '';
    });
    console.debug('careers.js initialized for', FORM_SELECTOR);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
