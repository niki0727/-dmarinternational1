(() => {
  'use strict';

  const FORM_ID = 'contactForm';
  const MSG_ID = 'form-msg';
  const ENDPOINT = 'https://contact-sender.piazenko-n.workers.dev';

  const setMessage = (el, text) => {
    if (!el) return;
    el.textContent = text;
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());


  const validateForm = (form) => {
    const name = form.elements['name'];
    const email = form.elements['email'];
    const message = form.elements['message'];

    const valName = name?.value?.trim() ?? '';
    const valEmail = email?.value?.trim() ?? '';
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

    if (!valMessage || valMessage.length < 2) {
      errors.push('Please enter a message (at least 2 characters).');
      if (!firstInvalid) firstInvalid = message;
    }

    return { ok: errors.length === 0, errors, firstInvalid };
  };

  const disableSubmit = (form, disabled = true) => {
    const btn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!btn) return;
    btn.disabled = disabled;
    if (disabled) btn.setAttribute('aria-busy', 'true');
    else btn.removeAttribute('aria-busy');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = /** @type {HTMLFormElement} */ (event.target);
    const msgEl = document.getElementById(MSG_ID);
    if (!form || !msgEl) return;


    const { ok, errors, firstInvalid } = validateForm(form);
    if (!ok) {
      setMessage(msgEl, errors.join(' ')); 
      if (firstInvalid?.focus) firstInvalid.focus();
      return;
    }

    setMessage(msgEl, 'Sending…');
    disableSubmit(form, true);

    const formData = new FormData(form);
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body: formData });
      if (res.ok) {
        setMessage(msgEl, 'Message sent!');
        form.reset();
      } else {
        setMessage(msgEl, 'Error sending message. Please try again.');
      }
    } catch (err) {
      setMessage(msgEl, 'Error sending message. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      disableSubmit(form, false);
    }
  };

  const init = () => {
    const formEl = document.getElementById(FORM_ID);
    if (formEl instanceof HTMLFormElement) {
      formEl.addEventListener('submit', handleSubmit);
      formEl.addEventListener('input', () => {
        const msgEl = document.getElementById(MSG_ID);
        if (msgEl) msgEl.textContent = '';
      });
    } else {
      console.warn(`Form with id "${FORM_ID}" not found or is not a form element.`);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
