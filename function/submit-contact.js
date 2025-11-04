(() => {
  'use strict';

  const FORM_ID = 'contactForm';
  const MSG_ID = 'form-msg';
  const ENDPOINT = 'https://contact-sender.piazenko-n.workers.dev';

  const setMessage = (text) => {
    const el = document.getElementById(MSG_ID);
    if (el) el.textContent = text;
  };

  const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value).trim());

  const toggleSubmitting = (form, isSubmitting) => {
    const btn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!btn) return;
    if (isSubmitting) {
      btn.setAttribute('disabled', 'true');
      btn.setAttribute('aria-busy', 'true');
    } else {
      btn.removeAttribute('disabled');
      btn.removeAttribute('aria-busy');
    }
  };

  const validate = (form) => {
    const name = form.elements.namedItem('name');
    const email = form.elements.namedItem('email');
    const message = form.elements.namedItem('message');
    const consent = form.elements.namedItem('privacyConsent');

    const errors = [];
    let firstInvalid = null;

    const nameVal = name?.value?.trim() ?? '';
    if (nameVal.length < 2) {
      errors.push('Please enter your name (at least 2 characters).');
      firstInvalid = firstInvalid || name;
    }

    const emailVal = email?.value?.trim() ?? '';
    if (!emailVal) {
      errors.push('Please enter your email.');
      firstInvalid = firstInvalid || email;
    } else if (!isValidEmail(emailVal)) {
      errors.push('Please enter a valid email address.');
      firstInvalid = firstInvalid || email;
    }

    const messageVal = message?.value?.trim() ?? '';
    if (messageVal.length < 2) {
      errors.push('Please enter a message (at least 2 characters).');
      firstInvalid = firstInvalid || message;
    }

    if (consent instanceof HTMLInputElement && !consent.checked) {
      errors.push('Please confirm you have read and agree to the Privacy Policy.');
      firstInvalid = firstInvalid || consent;
    }

    return { ok: errors.length === 0, errors, firstInvalid };
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;

    const { ok, errors, firstInvalid } = validate(form);
    if (!ok) {
      setMessage(errors.join(' '));
      if (firstInvalid && 'focus' in firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    setMessage('Sending…');
    toggleSubmitting(form, true);

    try {
      const response = await fetch(ENDPOINT, { method: 'POST', body: new FormData(form) });
      if (response.ok) {
        setMessage('Message sent!');
        form.reset();
      } else {
        setMessage('Error sending message. Please try again.');
      }
    } catch (error) {
      console.error('Contact form submit error', error);
      setMessage('Error sending message. Please try again.');
    } finally {
      toggleSubmitting(form, false);
    }
  };

  const init = () => {
    const form = document.getElementById(FORM_ID);
    if (!(form instanceof HTMLFormElement)) return;
    form.addEventListener('submit', submit);
    form.addEventListener('input', () => setMessage(''));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
