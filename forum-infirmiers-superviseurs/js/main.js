// ============================================================
// Forum National des Infirmiers Superviseurs — RDC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* Mobile nav toggle -------------------------------------------------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  /* Scroll reveal -------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------
     Inscription form: conditional fields
     ------------------------------------------------------------------ */
  const form = document.getElementById('inscription-form');
  if (!form) return;

  /* ------------------------------------------------------------------
     Empêche une double soumission depuis le même appareil/navigateur.
     ------------------------------------------------------------------ */
  const SUBMISSION_LOCK_KEY = 'fonis_inscription_submitted';
  const alreadySubmittedBanner = document.getElementById('already-submitted-banner');

  function lockSubmission() {
    localStorage.setItem(SUBMISSION_LOCK_KEY, 'true');
  }

  function checkSubmissionLock() {
    if (localStorage.getItem(SUBMISSION_LOCK_KEY) === 'true') {
      if (alreadySubmittedBanner) alreadySubmittedBanner.style.display = 'block';
      const btn = document.getElementById('submit-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Déjà soumis depuis cet appareil'; }
    }
  }
  checkSubmissionLock();
  const resetLink = document.getElementById('reset-submission-lock');
  if (resetLink) {
    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(SUBMISSION_LOCK_KEY);
      window.location.reload();
    });
  }

  // 5. Lieu d'affectation
  const lieuSelect = document.getElementById('lieu_affectation');
  const secGeneralBlock = document.getElementById('bloc-secretariat-general');
  if (lieuSelect && secGeneralBlock) {
    lieuSelect.addEventListener('change', () => {
      const showSecGen = lieuSelect.value === 'Secrétariat général';
      secGeneralBlock.classList.toggle('is-visible', showSecGen);
      secGeneralBlock.querySelectorAll('input, select').forEach(el => {
        el.required = showSecGen && el.dataset.requiredWhenVisible === 'true';
      });
    });
  }

  // Secrétariat général: Programme spécialisé vs Direction
  const secGenType = document.getElementById('secgen_type');
  const programmeField = document.getElementById('field-programme');
  const directionField = document.getElementById('field-direction');
  if (secGenType) {
    secGenType.addEventListener('change', () => {
      const val = secGenType.value;
      if (programmeField) {
        programmeField.style.display = val === 'Programme spécialisé' ? '' : 'none';
        const input = programmeField.querySelector('input');
        if (input) input.required = val === 'Programme spécialisé';
      }
      if (directionField) {
        directionField.style.display = val === 'Direction' ? '' : 'none';
        const input = directionField.querySelector('input');
        if (input) input.required = val === 'Direction';
      }
    });
  }

    // Numéro d'ordre: show text field only if "Oui"
  const numeroOrdreOui = document.getElementById('numero_ordre_oui');
  const numeroOrdreAll = document.querySelectorAll('input[name="Numéro d\'ordre"]');
  const numeroOrdreField = document.getElementById('field-numero-ordre');
  if (numeroOrdreAll.length && numeroOrdreField) {
    numeroOrdreAll.forEach(radio => {
      radio.addEventListener('change', () => {
        const showField = numeroOrdreOui.checked;
        numeroOrdreField.style.display = showField ? '' : 'none';
        const input = numeroOrdreField.querySelector('input');
        if (input) input.required = showField;
      });
    });
  }
 const fonctionSelect = document.getElementById('fonction');
  const fonctionSubFields = {
    'Infirmier superviseur': document.getElementById('field-activite-supervision'),
    'Autre': document.getElementById('field-autre-fonction')
  };
  if (fonctionSelect) {
    fonctionSelect.addEventListener('change', () => {
      Object.entries(fonctionSubFields).forEach(([key, el]) => {
        if (!el) return;
        const show = fonctionSelect.value === key;
        el.style.display = show ? '' : 'none';
        const input = el.querySelector('input');
        if (input) input.required = show;
      });
    });
  }

    /* ------------------------------------------------------------------
     Custom validation highlighting — replaces the generic browser
     tooltip with a red-bordered field + inline message, and scrolls
     to the first problem field.
     ------------------------------------------------------------------ */
  function clearFieldErrors() {
    form.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
  }

  function highlightInvalidFields() {
    clearFieldErrors();
    const invalids = Array.from(form.querySelectorAll(':invalid')).filter(el => el.offsetParent !== null);
    invalids.forEach(el => {
      const field = el.closest('.field');
      if (field) field.classList.add('has-error');
    });
    if (invalids.length) {
      const firstField = invalids[0].closest('.field') || invalids[0];
      firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      invalids[0].focus({ preventScroll: true });
    }
    return invalids.length === 0;
  }

  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      const field = el.closest('.field');
      if (field && field.classList.contains('has-error') && el.checkValidity()) {
        field.classList.remove('has-error');
      }
    });
  });

  /* ------------------------------------------------------------------
     Submission — sends to Formspree so submissions arrive by email.
     Replace YOUR_FORM_ID in the form's action attribute (see HTML)
     with your own Formspree endpoint before going live.
     ------------------------------------------------------------------ */
  const statusBox = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // simple honeypot spam check
    const honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    if (!form.checkValidity()) {
      highlightInvalidFields();
      showStatus('error', 'Merci de corriger le(s) champ(s) surligné(s) en rouge ci-dessus.');
      return;
    }
    clearFieldErrors();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    function encodeForNetlify(data) {
      return Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
    }

    try {
      const formData = new FormData(form);
      const dataObj = {};
      formData.forEach((value, key) => { dataObj[key] = value; });

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeForNetlify(dataObj)
      });

            if (response.ok) {
        lockSubmission();
        const redirectTo = form.querySelector('input[name="_next"]');
        window.location.href = redirectTo ? redirectTo.value : 'merci.html';
      } else {
        showStatus('error', "Une erreur est survenue lors de l'envoi. Merci de réessayer dans un instant.");
      }
    } catch (err) {
      showStatus('error', "Impossible d'envoyer le formulaire. Vérifiez votre connexion et réessayez.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "S'inscrire";
    }
  });

  function showStatus(type, message) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.className = 'form-status show ' + type;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
