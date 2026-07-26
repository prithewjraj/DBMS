/* ==========================================================================
   Athenaeum — shared application script
   Handles: password visibility, login form validation + simulated auth,
   and small reusable UI helpers used across pages.
   ========================================================================== */

(function () {
  'use strict';

  /**
   * Toggle a password field between hidden and visible text,
   * swapping the icon and updating the accessible label.
   */
  function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordField = document.getElementById('loginPassword');
    if (!toggleBtn || !passwordField) return;

    toggleBtn.addEventListener('click', function () {
      const isHidden = passwordField.getAttribute('type') === 'password';
      passwordField.setAttribute('type', isHidden ? 'text' : 'password');

      const icon = toggleBtn.querySelector('i');
      icon.classList.toggle('bi-eye', !isHidden);
      icon.classList.toggle('bi-eye-slash', isHidden);
      toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  }

  /**
   * Lightweight field validation: marks a field invalid/valid and
   * shows/hides its paired error message without a full page framework.
   */
  function setFieldValidity(fieldEl, isValid) {
    const wrapper = fieldEl.closest('.mb-3, .mb-2') || fieldEl.parentElement;
    fieldEl.classList.toggle('is-invalid', !isValid);
    if (wrapper) wrapper.classList.toggle('is-invalid', !isValid);
  }

  function isValidEmailOrId(value) {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Accept either an email address or a member ID of 4+ characters
    return emailPattern.test(trimmed) || trimmed.length >= 4;
  }

  /**
   * Wires up the login form: validates on submit, shows a brief
   * loading state on the submit button, then simulates a successful
   * sign-in (no backend is connected in this UI-only build).
   */
  function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmit');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const emailOk = isValidEmailOrId(emailField.value);
      const passwordOk = passwordField.value.length >= 6;

      setFieldValidity(emailField, emailOk);
      setFieldValidity(passwordField, passwordOk);

      if (!emailOk) {
        emailField.focus();
        return;
      }
      if (!passwordOk) {
        passwordField.focus();
        return;
      }

      // Simulate an authentication request with a brief loading state.
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      window.setTimeout(function () {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        showToast('Signed in successfully. Redirecting to your dashboard…', 'success');
        // In the full build this would navigate to dashboard.html
        window.setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 900);
      }, 900);
    });

    // Clear the invalid state as soon as the person starts correcting a field.
    [emailField, passwordField].forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) {
          setFieldValidity(field, true);
        }
      });
    });
  }

  /**
   * "Forgot password" is a placeholder in this UI-only build —
   * acknowledge the click with feedback rather than a dead link.
   */
  function initForgotPassword() {
    const link = document.getElementById('forgotPasswordLink');
    if (!link) return;
    link.addEventListener('click', function (event) {
      event.preventDefault();
      showToast('Password reset instructions would be sent to your email.', 'info');
    });
  }

  /**
   * Minimal toast helper so pages can surface feedback without
   * wiring up Bootstrap's full toast markup each time.
   */
  function showToast(message, variant) {
    variant = variant || 'primary';
    let container = document.getElementById('appToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'appToastContainer';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1080';
      document.body.appendChild(container);
    }

    const iconMap = {
      success: 'bi-check-circle-fill',
      danger: 'bi-x-circle-fill',
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      primary: 'bi-bell-fill'
    };
    const colorMap = {
      success: 'var(--color-success)',
      danger: 'var(--color-danger)',
      info: 'var(--color-primary)',
      warning: 'var(--color-warning)',
      primary: 'var(--color-primary)'
    };

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center border-0 shadow-sm mb-2';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.style.borderRadius = '12px';
    toastEl.style.overflow = 'hidden';
    toastEl.innerHTML =
      '<div class="d-flex">' +
        '<div class="toast-body d-flex align-items-center gap-2">' +
          '<i class="bi ' + iconMap[variant] + '" style="color:' + colorMap[variant] + '"></i>' +
          '<span style="font-size:14px">' + message + '</span>' +
        '</div>' +
        '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
      '</div>';

    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3200 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', function () {
      toastEl.remove();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggle();
    initLoginForm();
    initForgotPassword();
  });

  // Expose showToast for reuse by other page scripts.
  window.AppUI = window.AppUI || {};
  window.AppUI.showToast = showToast;
})();
