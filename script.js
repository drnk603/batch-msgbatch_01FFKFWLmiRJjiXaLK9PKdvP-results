(function() {
  'use strict';

  const AppState = {
    burgerOpen: false,
    formSubmitting: false,
    scrolled: false
  };

  const Config = {
    throttleDelay: 200,
    debounceDelay: 150,
    scrollOffset: 80,
    mobileBreakpoint: 1024
  };

  const Selectors = {
    header: '.l-header',
    burger: '.navbar-toggler, .c-nav__toggle',
    navCollapse: '.navbar-collapse',
    navLinks: '.nav-link, .c-nav__item',
    forms: 'form',
    submitBtn: 'button[type="submit"]',
    anchorLinks: 'a[href^="#"], a[href^="/#"]',
    images: 'img',
    filterBtns: '.c-filter-btn',
    projectLinks: '.c-project-details',
    modal: '#projectModal',
    socialLinks: '.c-social-links a'
  };

  const Patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\+\-\(\)]{10,20}$/,
    name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/
  };

  function throttle(fn, wait) {
    let time = Date.now();
    return function() {
      if (time + wait - Date.now() < 0) {
        time = Date.now();
        fn.apply(this, arguments);
      }
    };
  }

  function debounce(fn, delay) {
    let timer;
    return function() {
      const args = arguments;
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(context, args), delay);
    };
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initBurgerMenu() {
    const burger = document.querySelector(Selectors.burger);
    const navCollapse = document.querySelector(Selectors.navCollapse);
    const navLinks = document.querySelectorAll(Selectors.navLinks);
    const body = document.body;

    if (!burger || !navCollapse) return;

    function openMenu() {
      AppState.burgerOpen = true;
      navCollapse.classList.add('show', 'is-open');
      burger.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
    }

    function closeMenu() {
      AppState.burgerOpen = false;
      navCollapse.classList.remove('show', 'is-open');
      burger.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.burgerOpen ? closeMenu() : openMenu();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (AppState.burgerOpen) closeMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (AppState.burgerOpen && !navCollapse.contains(e.target) && !burger.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && AppState.burgerOpen) {
        closeMenu();
        burger.focus();
      }
    });

    window.addEventListener('resize', throttle(() => {
      if (window.innerWidth >= Config.mobileBreakpoint && AppState.burgerOpen) {
        closeMenu();
      }
    }, Config.throttleDelay));
  }

  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      const isHomePage = location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '';

      if (href.indexOf('#') === 0) {
        e.preventDefault();
        const id = href.substring(1);
        scrollToElement(id);
      } else if (href.indexOf('/#') === 0 && isHomePage) {
        e.preventDefault();
        const id = href.substring(2);
        scrollToElement(id);
      }
    });
  }

  function scrollToElement(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const header = document.querySelector(Selectors.header);
    const offset = header ? header.offsetHeight : Config.scrollOffset;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top, behavior: 'smooth' });
  }

  function initActiveMenu() {
    const path = location.pathname;
    const links = document.querySelectorAll(Selectors.navLinks);

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '/' && href === 'index.html') || (path === '/index.html' && href === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll(Selectors.navLinks);

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${entry.target.id}` || href === `/#${entry.target.id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-100px 0px -66%'
    });

    sections.forEach(section => observer.observe(section));
  }

  function initHeaderScroll() {
    const header = document.querySelector(Selectors.header);
    if (!header) return;

    const handleScroll = throttle(() => {
      const scrolled = window.pageYOffset > 50;
      if (scrolled !== AppState.scrolled) {
        AppState.scrolled = scrolled;
        header.classList.toggle('is-scrolled', scrolled);
      }
    }, Config.throttleDelay);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  function initImageFallback() {
    const images = document.querySelectorAll(Selectors.images);

    images.forEach(img => {
      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img')) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        if (this.dataset.fallback) return;
        this.dataset.fallback = '1';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#e9ecef" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#6c757d" font-size="18" font-family="sans-serif">Image unavailable</text></svg>`;
        this.src = 'data:image/svg+xml;base64,' + btoa(svg);
      }, { once: true });
    });
  }

  function createNotification(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" aria-label="Close"></button>`;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    setTimeout(() => removeToast(toast), 5000);
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 150);
  }

  function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const id = field.id;
    const name = field.name;
    const required = field.hasAttribute('required');

    if (required && !value) {
      return { valid: false, message: 'This field is required' };
    }

    if (type === 'email' && value) {
      if (!Patterns.email.test(value)) {
        return { valid: false, message: 'Please enter a valid email address' };
      }
    }

    if (type === 'tel' && value && required) {
      if (!Patterns.phone.test(value)) {
        return { valid: false, message: 'Please enter a valid phone number' };
      }
    }

    if ((id.includes('name') || name.includes('name') || id.includes('Name') || name.includes('Name')) && value && value.length > 0) {
      if (!Patterns.name.test(value)) {
        return { valid: false, message: 'Please enter a valid name' };
      }
    }

    if (field.tagName === 'TEXTAREA' && required && value.length < 10) {
      return { valid: false, message: 'Message must be at least 10 characters' };
    }

    if (type === 'checkbox' && required && !field.checked) {
      return { valid: false, message: 'You must accept this to continue' };
    }

    return { valid: true, message: '' };
  }

  function showFieldError(field, message) {
    field.classList.add('is-invalid');
    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  }

  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  function initForms() {
    const forms = document.querySelectorAll(Selectors.forms);

    forms.forEach(form => {
      const fields = form.querySelectorAll('input, textarea, select');

      fields.forEach(field => {
        field.addEventListener('blur', () => {
          const validation = validateField(field);
          if (!validation.valid) {
            showFieldError(field, validation.message);
          } else {
            clearFieldError(field);
          }
        });

        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            clearFieldError(field);
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (AppState.formSubmitting) return;

        let isValid = true;
        const invalidFields = [];

        fields.forEach(field => {
          const validation = validateField(field);
          if (!validation.valid) {
            isValid = false;
            showFieldError(field, validation.message);
            invalidFields.push(field);
          } else {
            clearFieldError(field);
          }
        });

        if (!isValid) {
          if (invalidFields.length > 0) {
            invalidFields[0].focus();
          }
          createNotification('Please correct the errors in the form', 'danger');
          return;
        }

        const submitBtn = form.querySelector(Selectors.submitBtn);
        if (!submitBtn) return;

        AppState.formSubmitting = true;
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

        setTimeout(() => {
          AppState.formSubmitting = false;
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          createNotification('Form submitted successfully!', 'success');
          form.reset();
          fields.forEach(field => clearFieldError(field));

          setTimeout(() => {
            window.location.href = 'thank_you.html';
          }, 1000);
        }, 1500);
      });
    });
  }

  function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll(Selectors.filterBtns);
    const projects = document.querySelectorAll('[data-category]');

    if (filterBtns.length === 0) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const filter = this.dataset.filter;

        filterBtns.forEach(b => b.classList.remove('is-active', 'active'));
        this.classList.add('is-active', 'active');

        projects.forEach(project => {
          if (filter === 'all' || project.dataset.category === filter) {
            project.style.display = '';
            project.parentElement.style.display = '';
          } else {
            project.style.display = 'none';
            project.parentElement.style.display = 'none';
          }
        });
      });
    });
  }

  function initProjectModal() {
    const projectLinks = document.querySelectorAll(Selectors.projectLinks);
    const modal = document.querySelector(Selectors.modal);

    if (!modal || projectLinks.length === 0) return;

    const projectData = {
      techvision: {
        title: 'TechVision Platform',
        description: 'Digital transformation project'
      },
      retailpro: {
        title: 'RetailPro System',
        description: 'E-commerce solution'
      },
      brandboost: {
        title: 'BrandBoost Campaign',
        description: 'Marketing strategy'
      },
      finserve: {
        title: 'FinServe Platform',
        description: 'Financial consulting'
      },
      healthcare: {
        title: 'Healthcare Innovation',
        description: 'Digital health solution'
      },
      cloudsoft: {
        title: 'CloudSoft Migration',
        description: 'Cloud infrastructure'
      }
    };

    projectLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const projectId = this.dataset.project;
        const data = projectData[projectId];

        if (data) {
          const modalTitle = modal.querySelector('#projectModalLabel');
          const modalBody = modal.querySelector('#projectModalBody');

          if (modalTitle) modalTitle.textContent = data.title;
          if (modalBody) modalBody.innerHTML = `<p>${data.description}</p>`;
        }
      });
    });
  }

  function init() {
    initBurgerMenu();
    initSmoothScroll();
    initActiveMenu();
    initScrollSpy();
    initHeaderScroll();
    initImageFallback();
    initForms();
    initPortfolioFilter();
    initProjectModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();