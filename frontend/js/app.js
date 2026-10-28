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
   * Demo credential store for this UI-only build (no backend is connected).
   * In the full DBMS-backed version this check would be a server call.
   */
  /**
   * Determine role-based dashboard destination
   */
  function getDashboardForRole(role) {
    switch ((role || '').toLowerCase()) {
      case 'student':
        return 'student-dashboard.html';
      case 'admin':
        return 'admin-dashboard.html';
      case 'librarian':
      default:
        return 'dashboard.html';
    }
  }

  /**
   * Demo credential accounts for testing without a running PostgreSQL / Tomcat backend.
   */
  var DEMO_ACCOUNT = {
    email: 'amrita@gmail.com',
    password: 'Amrita'
  };

  var DEMO_ACCOUNTS = {
    admin: {
      name: 'Admin User',
      email: 'admin@library.com',
      role: 'admin'
    },
    librarian: {
      name: 'Amrita Nair',
      email: 'staff@library.com',
      role: 'librarian'
    },
    student: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'student',
      member_id: 101
    }
  };

  /**
   * Wires up the login form: validates on submit, checks backend or demo
   * credentials, shows a brief loading state on the submit button,
   * then routes to the role-specific dashboard (Student, Librarian, or Admin).
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

      // Authenticate with Tomcat backend, or fallback to demo account
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      const roleSelected = (document.querySelector('input[name="role"]:checked') || {}).value || 'admin';
      const payload = {
        username: emailField.value.trim(),
        email: emailField.value.trim(),
        password: passwordField.value,
        role: roleSelected
      };

      const API_URL = 'http://localhost:8081/backend/api/auth/login';

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          submitBtn.classList.remove('is-loading');
          submitBtn.disabled = false;

          if (data && data.success && data.user) {
            if (window.AppUI && window.AppUI.rememberSession) {
              window.AppUI.rememberSession(document.getElementById('rememberMe').checked, data.user);
            }
            const targetRole = (data.user && data.user.role) || roleSelected;
            const targetDashboard = getDashboardForRole(targetRole);
            showToast('Signed in successfully as ' + data.user.name + ' (' + targetRole + '). Redirecting…', 'success');
            window.setTimeout(function () {
              window.location.href = targetDashboard;
            }, 600);
          } else {
            setFieldValidity(emailField, false);
            setFieldValidity(passwordField, false);
            showToast(data.message || 'Invalid credentials', 'danger');
            passwordField.value = '';
            passwordField.focus();
          }
        })
        .catch(function () {
          // Fallback to local demo accounts if Tomcat server is not running
          submitBtn.classList.remove('is-loading');
          submitBtn.disabled = false;

          const emailVal = emailField.value.trim().toLowerCase();
          const passVal = passwordField.value;

          // Support default demo (amrita@gmail.com / Amrita)
          const isDefaultDemo = (emailVal === DEMO_ACCOUNT.email && passVal === DEMO_ACCOUNT.password);

          // Support role-based credentials from README / database seed
          const isAdminCreds = (emailVal === 'admin' || emailVal === 'admin@library.com') && (passVal === 'admin123' || isDefaultDemo);
          const isLibCreds = (emailVal === 'librarian1' || emailVal === 'staff@library.com') && (passVal === 'staff123' || isDefaultDemo);
          const isStudentCreds = (emailVal === 'alice@example.com' || emailVal === 'alice' || emailVal === 'student') && (passVal === 'student123' || passVal === 'alice123' || isDefaultDemo || passVal.length >= 6);

          // Allow demo login if credentials match demo accounts, or if entering valid demo inputs
          const isValidDemo = isDefaultDemo || isAdminCreds || isLibCreds || isStudentCreds || (emailOk && passwordOk);

          if (isValidDemo) {
            let userRole = roleSelected;
            let userName = 'Amrita Nair';
            let userEmail = emailField.value.trim();

            if (isAdminCreds || (isDefaultDemo && roleSelected === 'admin')) {
              userRole = 'admin';
              userName = isDefaultDemo ? 'Amrita Nair (Admin)' : 'Admin User';
              userEmail = isDefaultDemo ? 'amrita@gmail.com' : 'admin@library.com';
            } else if (isStudentCreds || (isDefaultDemo && roleSelected === 'student')) {
              userRole = 'student';
              userName = isDefaultDemo ? 'Amrita Nair (Student)' : 'Alice Smith';
              userEmail = isDefaultDemo ? 'amrita@gmail.com' : 'alice@example.com';
            } else if (isLibCreds || (isDefaultDemo && roleSelected === 'librarian')) {
              userRole = 'librarian';
              userName = 'Amrita Nair';
              userEmail = isDefaultDemo ? 'amrita@gmail.com' : 'staff@library.com';
            } else {
              const demoInfo = DEMO_ACCOUNTS[roleSelected] || DEMO_ACCOUNTS.librarian;
              userRole = roleSelected;
              userName = demoInfo.name;
              userEmail = demoInfo.email;
            }

            const demoUser = {
              name: userName,
              email: userEmail,
              role: userRole,
              member_id: userRole === 'student' ? 101 : undefined
            };

            if (window.AppUI && window.AppUI.rememberSession) {
              window.AppUI.rememberSession(document.getElementById('rememberMe').checked, demoUser);
            }

            const targetDashboard = getDashboardForRole(userRole);
            showToast('Signed in as ' + userRole.charAt(0).toUpperCase() + userRole.slice(1) + ' (Demo Mode). Redirecting…', 'success');
            window.setTimeout(function () {
              window.location.href = targetDashboard;
            }, 600);
          } else {
            setFieldValidity(emailField, false);
            setFieldValidity(passwordField, false);
            showToast('Credentials did not match local demo or database records.', 'danger');
            passwordField.value = '';
            passwordField.focus();
          }
        });
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

  /**
   * Minimal session helper for this front-end-only build. Stores a flag
   * and the signed-in user's display info so other pages (dashboard, etc.)
   * can greet the person and guard against being viewed pre-login.
   */
  function rememberSession(persist, user) {
    const store = persist ? window.localStorage : window.sessionStorage;
    const roleChecked = (document.querySelector('input[name="role"]:checked') || {}).value || 'admin';
    const effectiveRole = (user && user.role) || roleChecked;
    const fallbackProfile = DEMO_ACCOUNTS[effectiveRole] || DEMO_ACCOUNTS.librarian;

    store.setItem('athenaeum_session', JSON.stringify({
      name: (user && user.name) || fallbackProfile.name,
      email: (user && user.email) || fallbackProfile.email,
      role: effectiveRole,
      member_id: (user && user.member_id) || (effectiveRole === 'student' ? 101 : undefined),
      signedInAt: new Date().toISOString()
    }));
  }

  function getSession() {
    const raw = window.localStorage.getItem('athenaeum_session') || window.sessionStorage.getItem('athenaeum_session');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearSession() {
    window.localStorage.removeItem('athenaeum_session');
    window.sessionStorage.removeItem('athenaeum_session');
  }

  /**
   * Helper to autofill demo credentials on login page for quick role testing
   */
  function initDemoAutofill() {
    document.querySelectorAll('[data-demo-role]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const role = this.getAttribute('data-demo-role');
        const email = this.getAttribute('data-demo-email');
        const pass = this.getAttribute('data-demo-pass');

        const roleRadio = document.querySelector('input[name="role"][value="' + role + '"]');
        if (roleRadio) {
          roleRadio.checked = true;
          // Trigger change event if listeners attached
          roleRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const emailField = document.getElementById('loginEmail');
        const passField = document.getElementById('loginPassword');
        if (emailField && email) {
          emailField.value = email;
          setFieldValidity(emailField, true);
        }
        if (passField && pass) {
          passField.value = pass;
          setFieldValidity(passField, true);
        }
        showToast('Selected ' + role.toUpperCase() + ' demo credentials', 'info');
      });
    });
  }

  /**
   * Rewrites sidebar "Dashboard" links dynamically to match active role
   */
  function updateDashboardLinks() {
    const session = getSession();
    if (!session || !session.role) return;
    const targetDashboard = getDashboardForRole(session.role);
    document.querySelectorAll('a[href="dashboard.html"]').forEach(function (link) {
      link.setAttribute('href', targetDashboard);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggle();
    initLoginForm();
    initForgotPassword();
    initDemoAutofill();
    updateDashboardLinks();
  });

  // Expose shared helpers for reuse by other page scripts.
  window.AppUI = window.AppUI || {};
  window.AppUI.showToast = showToast;
  window.AppUI.rememberSession = rememberSession;
  window.AppUI.getSession = getSession;
  window.AppUI.clearSession = clearSession;
  window.AppUI.getDashboardForRole = getDashboardForRole;
})();
