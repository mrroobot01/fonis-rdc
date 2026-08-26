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

  // 6. Fonction: show sub-fields based on choice
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
      form.reportValidity();
      return;
    }

    const endpoint = form.getAttribute('action') || '';
    const isPlaceholder = endpoint.includes('YOUR_FORM_ID');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    if (isPlaceholder) {
      // No real endpoint configured yet — show a clear message instead of failing silently.
      setTimeout(() => {
        showStatus('error', "Le formulaire n'est pas encore connecté à une adresse de réception. Configurez votre identifiant Formspree dans inscription.html avant la mise en ligne.");
        submitBtn.disabled = false;
        submitBtn.textContent = "S'inscrire";
      }, 400);
      return;
    }

    try {
      const formData = new FormData(form);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.reset();
        secGeneralBlock && secGeneralBlock.classList.remove('is-visible');
        showStatus('success', 'Merci ! Votre inscription a bien été envoyée. Notre équipe reviendra vers vous prochainement.');
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
