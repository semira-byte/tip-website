/* ==========================================================================
   The Inside Perspective · shared site script
   Loaded with `defer` on every page. No dependencies.
   Sections:
     1. Mobile menu
     2. Click-to-load YouTube player
     3. Email signup (provider agnostic, posts to /api/subscribe)
     4. Unfiltered Perspectives form (Formspree)
     5. Old episode links (episodes.html?ep=N)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Mobile menu ---------- */
  var menuBtn = document.querySelector('.nav-hamburger');
  var menu = document.getElementById('mobile-menu');

  if (menuBtn && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- 2. Click-to-load YouTube player ----------
     Shows the thumbnail first. YouTube's player (and its cookies) only loads
     when someone actually presses play. Uses youtube-nocookie.com. */
  document.querySelectorAll('.video-facade[data-youtube-id]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-youtube-id');
      if (!/^[\w-]{6,20}$/.test(id)) return;
      var wrap = document.createElement('div');
      wrap.className = 'video-frame';
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = btn.getAttribute('data-title') || 'Episode video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      wrap.appendChild(iframe);
      btn.replaceWith(wrap);
      iframe.focus();
    });
  });

  /* ---------- Shared form helpers ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setBusy(button, busy, busyText) {
    if (!button) return;
    var label = button.querySelector('.btn-label');
    if (busy) {
      button.dataset.idleText = label ? label.textContent : '';
      if (label) label.textContent = busyText;
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
    } else {
      if (label && button.dataset.idleText) label.textContent = button.dataset.idleText;
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  }

  /* Private preview only: endpoints starting with "mock:" pretend to send.
     Type an email containing "fail" to see the error state. */
  function send(url, init, fakeOkWhen) {
    if (url.indexOf('mock:') === 0) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var ok = fakeOkWhen();
          resolve({ ok: ok, json: function () { return Promise.resolve(ok ? { ok: true } : { ok: false }); } });
        }, 900);
      });
    }
    return fetch(url, init);
  }

  function showStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('is-error', kind === 'error');
    el.classList.toggle('is-success', kind === 'success');
  }

  /* ---------- 3. Email signup ----------
     Every .signup-form posts JSON to its data-endpoint (default /api/subscribe).
     The server decides which email provider receives it, so swapping providers
     never touches this code. Without JavaScript the form still submits normally. */
  document.querySelectorAll('form.signup-form').forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector('.form-status');
    var started = form.querySelector('input[name="ts"]');
    if (started) started.value = String(Date.now());

    if (input) {
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          input.removeAttribute('aria-invalid');
          showStatus(status, '', null);
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.sending === 'true') return;

      var email = (input.value || '').trim().toLowerCase();
      if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        showStatus(status, email ? 'That email doesn’t look quite right. Mind checking it?' : 'Pop your email in first.', 'error');
        input.focus();
        return;
      }

      var data = {
        email: email,
        company: (form.querySelector('input[name="company"]') || {}).value || '',
        ts: started ? Number(started.value) : 0,
        source: form.getAttribute('data-source') || location.pathname
      };

      form.dataset.sending = 'true';
      setBusy(button, true, 'Joining');
      showStatus(status, '', null);

      send(form.getAttribute('data-endpoint') || '/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }, function () { return email.indexOf('fail') === -1; })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (r) {
          if (!r.ok || !r.body || r.body.ok !== true) {
            throw new Error((r.body && r.body.message) || 'fail');
          }
          var done = document.createElement('div');
          done.className = 'signup-success';
          done.setAttribute('role', 'status');
          done.setAttribute('tabindex', '-1');
          done.innerHTML = '<strong>You’re in, Insider.</strong><p>' +
            (r.body.message || 'Check your inbox to confirm, then you’ll hear from me when new episodes and resources drop.') +
            '</p>';
          form.replaceWith(done);
          done.focus();
        })
        .catch(function (err) {
          var msg = err && err.message && err.message !== 'fail' && err.message !== 'Failed to fetch'
            ? err.message
            : 'Something went wrong on my end. Give it another try in a minute.';
          showStatus(status, msg, 'error');
        })
        .then(function () {
          form.dataset.sending = 'false';
          if (document.body.contains(form)) setBusy(button, false);
        });
    });
  });

  /* ---------- 4. Unfiltered Perspectives (anonymous) ---------- */
  var uf = document.getElementById('unfiltered-form');
  if (uf) {
    var ufMsg = uf.querySelector('textarea');
    var ufBtn = uf.querySelector('button[type="submit"]');
    var ufStatus = uf.querySelector('.form-status');

    ufMsg.addEventListener('input', function () {
      if (ufMsg.getAttribute('aria-invalid') === 'true') {
        ufMsg.removeAttribute('aria-invalid');
        showStatus(ufStatus, '', null);
      }
    });

    uf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (uf.dataset.sending === 'true') return;
      var text = (ufMsg.value || '').trim();
      if (text.length < 3) {
        ufMsg.setAttribute('aria-invalid', 'true');
        showStatus(ufStatus, 'Write a little something first.', 'error');
        ufMsg.focus();
        return;
      }
      if (text.length > 5000) {
        ufMsg.setAttribute('aria-invalid', 'true');
        showStatus(ufStatus, 'That’s a lot (in the best way). Can you keep it under 5,000 characters?', 'error');
        ufMsg.focus();
        return;
      }

      uf.dataset.sending = 'true';
      setBusy(ufBtn, true, 'Sending');
      showStatus(ufStatus, '', null);

      send(uf.getAttribute('action'), { method: 'POST', body: new FormData(uf), headers: { 'Accept': 'application/json' } },
        function () { return text.indexOf('fail') === -1; })
        .then(function (res) {
          if (!res.ok) throw new Error('fail');
          var done = document.createElement('div');
          done.className = 'signup-success';
          done.setAttribute('role', 'status');
          done.setAttribute('tabindex', '-1');
          done.innerHTML = '<strong>Got it. Thank you for trusting me with that.</strong>' +
            '<p>It might shape a future episode. If you’re going through it right now, call or text ' +
            '<a href="https://988lifeline.org" target="_blank" rel="noopener">988</a> (US) or visit ' +
            '<a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>.</p>';
          uf.replaceWith(done);
          done.focus();
        })
        .catch(function () {
          showStatus(ufStatus, 'That didn’t go through. Your words are still here, so you can try again.', 'error');
        })
        .then(function () {
          uf.dataset.sending = 'false';
          if (document.body.contains(uf)) setBusy(ufBtn, false);
        });
    });
  }

  /* ---------- Result of a no-JavaScript signup (?subscribed=1 / ?subscribe_error=1) ---------- */
  var qs = new URLSearchParams(location.search);
  if (qs.has('subscribed') || qs.has('subscribe_error')) {
    var target = document.querySelector('#subscribe .form-status');
    showStatus(target, qs.has('subscribed')
      ? 'You’re in, Insider. Check your inbox to confirm.'
      : 'That signup didn’t go through. Give it another try.', qs.has('subscribed') ? 'success' : 'error');
  }

  /* ---------- 5. Old links like episodes.html?ep=0 ---------- */
  var legacy = document.querySelector('[data-episode-map]');
  if (legacy) {
    var ep = new URLSearchParams(location.search).get('ep');
    if (ep !== null) {
      try {
        var map = JSON.parse(legacy.getAttribute('data-episode-map'));
        if (map[ep]) location.replace(map[ep]);
      } catch (_) { /* ignore */ }
    }
  }
})();
