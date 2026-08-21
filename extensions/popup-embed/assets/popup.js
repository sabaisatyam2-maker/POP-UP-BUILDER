(function() {
  const config = window.PopupBuilderConfig;
  if (!config) return;

  const container = document.getElementById('popup-builder-container');
  if (!container) return;

  // Track state
  let activePopups = [];
  
  async function init() {
    try {
      const response = await fetch(`${config.apiUrl}/popups?shop=${config.shopDomain}`);
      const data = await response.json();
      
      if (data.popups && data.popups.length > 0) {
        activePopups = data.popups;
        evaluatePopups();
      }
    } catch (e) {
      console.error('Popup Builder: Failed to fetch popups', e);
    }
  }

  function evaluatePopups() {
    activePopups.forEach(popup => {
      let pConfig;
      try {
        pConfig = typeof popup.config === 'string' ? JSON.parse(popup.config) : popup.config;
      } catch(e) { return; }

      const triggers = pConfig.triggers || { type: "page_load", frequency: "once_24h" };
      const displayFreq = pConfig.displayFrequency || "once_per_day";

      if (displayFreq === "once_per_day") {
        const lastDismissed = localStorage.getItem(`pb_dismissed_${popup.id}`);
        if (lastDismissed) {
          const hoursSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
          if (hoursSince < 24) return;
        }
      } else if (displayFreq === "once_per_session") {
        if (sessionStorage.getItem(`pb_dismissed_session_${popup.id}`)) {
          return;
        }
      }
      
      const tType = triggers.type || "page_load";

      if (tType === "exit_intent") {
        document.addEventListener('mouseleave', (e) => {
          if (e.clientY <= 0) renderPopup(popup, pConfig);
        }, { once: true });
      } else if (tType === "scroll") {
        const scrollHandler = () => {
          const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPct >= (triggers.scrollPercent || 50)) {
            renderPopup(popup, pConfig);
            window.removeEventListener('scroll', scrollHandler);
          }
        };
        window.addEventListener('scroll', scrollHandler);
      } else if (tType === "delay") {
        setTimeout(() => {
          renderPopup(popup, pConfig);
        }, (triggers.delaySeconds || 5) * 1000);
      } else {
        // page_load (default)
        renderPopup(popup, pConfig);
      }
    });
  }

  function renderPopup(popup, pConfig) {
    // Avoid re-rendering if already showing
    if (container.classList.contains('is-visible')) return;

    // Track View
    trackAnalytics(popup.id, 'view');

    const isMobile = window.innerWidth <= 480;
    const canvas = document.createElement('div');
    canvas.className = 'pb-canvas';
    if (pConfig.layout === 'split') {
      canvas.classList.add('pb-layout-split');
    }
    
    // Apply Styles
    const styles = pConfig.styles || {};
    const colors = pConfig.colors || {};
    const content = pConfig.content || {};
    if (pConfig.layout === 'background' && pConfig.imageUrl) {
      canvas.style.background = `${colors.background || '#ffffff'} url(${pConfig.imageUrl}) center/100% 100% no-repeat`;
      canvas.style.alignItems = 'center';
    } else {
      canvas.style.background = colors.background || '#ffffff';
    }
    canvas.style.color = colors.text || '#000000';
    canvas.style.borderRadius = styles.borderRadius || '8px';
    canvas.style.padding = styles.padding || '24px';
    canvas.style.boxShadow = styles.boxShadow || '0 4px 12px rgba(0,0,0,0.15)';
    canvas.style.width = pConfig.layout === 'split' ? '600px' : '400px';
    canvas.style.maxWidth = '90%';
    canvas.style.display = 'flex';
    canvas.style.flexDirection = pConfig.layout === 'split' ? 'row' : 'column';
    canvas.style.alignItems = pConfig.layout === 'background' ? 'center' : 'stretch';
    canvas.style.overflow = 'hidden';
    canvas.style.position = 'relative';
    if (styles.border) canvas.style.border = styles.border;

    // App Store Rule: Close Button must be prominent
    const closeBtn = document.createElement('button');
    closeBtn.className = 'pb-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close popup');
    closeBtn.onclick = () => closePopup(popup.id);
    canvas.appendChild(closeBtn);

    // Render Image for Split Layout
    if (pConfig.layout === 'split' && pConfig.imageUrl) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'pb-img-container';
      imgContainer.style.flex = '1';
      imgContainer.style.backgroundColor = '#f4f6f8';
      imgContainer.style.display = 'flex';
      imgContainer.style.alignItems = 'center';
      imgContainer.style.justifyContent = 'center';
      imgContainer.style.overflow = 'hidden';

      const img = document.createElement('img');
      img.src = pConfig.imageUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      imgContainer.appendChild(img);
      canvas.appendChild(imgContainer);
    }

    // Build Content
    const innerContainer = document.createElement('div');
    innerContainer.style.flex = '1';
    innerContainer.style.width = pConfig.layout === 'background' ? '100%' : 'auto';
    innerContainer.style.padding = pConfig.layout === 'split' ? (isMobile ? '16px' : '24px') : pConfig.layout === 'image-bottom-right' ? (isMobile ? '16px 16px 16px 0px' : '24px 24px 24px 0px') : (isMobile ? '16px' : '32px');
    innerContainer.style.textAlign = pConfig.layout === 'image-bottom-right' ? 'left' : 'center';
    innerContainer.style.display = 'flex';
    innerContainer.style.flexDirection = 'column';
    innerContainer.style.gap = '16px';
    innerContainer.style.justifyContent = 'center';
    innerContainer.style.alignItems = pConfig.layout === 'image-bottom-right' ? 'flex-start' : 'center';
    innerContainer.style.position = 'relative';
    innerContainer.style.zIndex = '2';

    // Render Image for Bottom Right Layout
    if (pConfig.layout === 'image-bottom-right' && pConfig.imageUrl) {
      const img = document.createElement('img');
      img.className = 'pb-mobile-img';
      img.src = pConfig.imageUrl;
      if (pConfig.imageUrl && pConfig.imageUrl.includes('clover')) {
        img.style.position = 'absolute';
        img.style.top = '0px';
        img.style.bottom = '0px';
        img.style.right = '-5px';
        img.style.width = '65%';
        img.style.maxWidth = '300px';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'right center';
      } else {
        img.style.position = 'absolute';
        img.style.bottom = '40px';
        img.style.right = '0px';
        img.style.width = '55%';
        img.style.maxWidth = '240px';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
      }
      img.style.zIndex = '1';
      canvas.appendChild(img);
    }

    // Render Image for Non-Split, Non-Bottom-Right, Non-Background Layout
    if (pConfig.layout !== 'split' && pConfig.layout !== 'image-bottom-right' && pConfig.layout !== 'background' && pConfig.imageUrl) {
      const img = document.createElement('img');
      img.src = pConfig.imageUrl;
      img.style.width = '100%';
      img.style.maxHeight = '150px';
      img.style.objectFit = 'contain';
      img.style.marginBottom = '16px';
      innerContainer.appendChild(img);
    }

    const popupTextColor = colors.text || '#000000';
    const popupName = popupData.name || '';
    function getContrastColor(hex) {
      if (!hex) return '#000000';
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length !== 6) return '#000000';
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? '#000000' : '#FFFFFF';
    }

    if (content.headline) {
      const h2 = document.createElement('h2');
      h2.className = 'pb-headline pb-mobile-text';
      h2.innerText = content.headline;
      h2.style.color = /new year sale/i.test(popupName) ? popupTextColor : (colors.headlineText || popupTextColor);
      h2.style.fontSize = '32px';
      h2.style.margin = '0';
      h2.style.lineHeight = '1.3';
      h2.style.wordBreak = 'break-word';
      h2.style.textAlign = pConfig.layout === 'image-bottom-right' ? 'left' : 'center';
      if (pConfig.layout === 'image-bottom-right') {
        h2.style.maxWidth = '55%';
      }
      innerContainer.appendChild(h2);
    }

    if (content.subheadline) {
      const h3 = document.createElement('h3');
      h3.className = 'pb-subheadline pb-mobile-text';
      h3.innerText = content.subheadline;
      h3.style.color = /new year sale/i.test(popupName) ? popupTextColor : (colors.primary || '#000000');
      h3.style.fontSize = '24px';
      h3.style.fontWeight = 'bold';
      h3.style.margin = '0 0 8px 0';
      h3.style.wordBreak = 'break-word';
      h3.style.textAlign = pConfig.layout === 'image-bottom-right' ? 'left' : 'center';
      if (pConfig.layout === 'image-bottom-right') {
        h3.style.maxWidth = '55%';
      }
      innerContainer.appendChild(h3);
    }

    if (pConfig.hasCountdown) {
      const timerContainer = document.createElement('div');
      timerContainer.style.display = 'flex';
      timerContainer.style.justifyContent = 'center';
      timerContainer.style.gap = '12px';
      timerContainer.style.margin = '8px 0';

      const timeUnits = ['Days', 'Hours', 'Mins', 'Secs'];
      const unitEls = {};

      timeUnits.forEach(unit => {
        const box = document.createElement('div');
        box.style.backgroundColor = '#1a1a1f';
        box.style.borderRadius = '8px';
        box.style.padding = '12px 16px';
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.alignItems = 'center';
        box.style.border = '1px solid rgba(255,255,255,0.05)';
        box.style.minWidth = '48px';

        const valEl = document.createElement('span');
        valEl.style.fontSize = '20px';
        valEl.style.fontWeight = 'bold';
        valEl.style.color = '#ffffff';
        valEl.style.lineHeight = '1';
        valEl.innerText = '00';
        box.appendChild(valEl);

        const lblEl = document.createElement('span');
        lblEl.style.fontSize = '10px';
        lblEl.style.color = '#a1a1aa';
        lblEl.style.marginTop = '4px';
        lblEl.style.textTransform = 'uppercase';
        lblEl.innerText = unit;
        box.appendChild(lblEl);

        unitEls[unit] = valEl;
        timerContainer.appendChild(box);
      });
      innerContainer.appendChild(timerContainer);

      let targetDate;
      if (content.countdownTarget) {
        targetDate = new Date(content.countdownTarget).getTime();
      } else {
        // Default 48h from load
        targetDate = new Date().getTime() + 48 * 60 * 60 * 1000;
      }

      const updateTimer = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
          unitEls['Days'].innerText = '00';
          unitEls['Hours'].innerText = '00';
          unitEls['Mins'].innerText = '00';
          unitEls['Secs'].innerText = '00';
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);

        unitEls['Days'].innerText = days.toString().padStart(2, '0');
        unitEls['Hours'].innerText = hours.toString().padStart(2, '0');
        unitEls['Mins'].innerText = mins.toString().padStart(2, '0');
        unitEls['Secs'].innerText = secs.toString().padStart(2, '0');
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      container.setAttribute('data-timer-interval', timerInterval);
    }

    if (content.description) {
      const p = document.createElement('p');
      p.className = 'pb-description pb-mobile-text';
      p.innerText = content.description;
      p.style.color = /new year sale/i.test(popupName) ? getContrastColor(colors.background || '#050505') : popupTextColor;
      p.style.margin = '0';
      p.style.wordBreak = 'break-word';
      if (pConfig.layout === 'image-bottom-right') {
        p.style.maxWidth = '55%';
      }
      p.style.textAlign = pConfig.layout === 'image-bottom-right' ? 'left' : 'center';
      innerContainer.appendChild(p);
    }

    if (pConfig.hasEmailInput) {
      const emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.placeholder = 'Enter your email';
      emailInput.className = 'pb-email-input';
      emailInput.style.padding = '10px';
      emailInput.style.width = pConfig.layout === 'image-bottom-right' ? '55%' : '100%';
      emailInput.style.borderRadius = '4px';
      emailInput.style.border = '1px solid #ccc';
      emailInput.style.boxSizing = 'border-box';
      emailInput.style.marginBottom = '16px';
      emailInput.style.textAlign = pConfig.layout === 'image-bottom-right' ? 'left' : 'center';
      
      innerContainer.appendChild(emailInput);
    }

    if (content.buttonText) {
      const btn = document.createElement('button');
      btn.className = 'pb-cta pb-mobile-btn';
      btn.innerText = content.buttonText;
      const primaryColor = colors.primary || '#000000';
      btn.style.background = primaryColor;
      btn.style.color = colors.buttonText || '#ffffff';
      btn.style.border = 'none';
      btn.style.padding = '12px 24px';
      btn.style.borderRadius = '4px';
      btn.style.fontWeight = 'bold';
      btn.style.whiteSpace = 'nowrap';
      btn.style.wordBreak = 'break-word';
      btn.style.alignSelf = pConfig.layout === 'image-bottom-right' ? 'flex-start' : 'center';
      if (pConfig.layout === 'modal' || pConfig.layout === 'split') {
        btn.style.width = '100%';
      }
      if (pConfig.layout === 'image-bottom-right') {
        btn.style.maxWidth = '55%';
      }
      btn.onclick = () => {
        trackAnalytics(popup.id, 'click');
        if (content.buttonUrl && content.buttonUrl.trim() !== '') {
          window.location.href = content.buttonUrl;
        } else {
          closePopup(popup.id);
        }
      };
      innerContainer.appendChild(btn);
    }

    canvas.appendChild(innerContainer);
    
    // Clear and append
    container.innerHTML = '';
    
    // Add overlay click to close
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.onclick = () => closePopup(popup.id);
    container.appendChild(overlay);

    container.appendChild(canvas);

    // Trigger animation
    requestAnimationFrame(() => {
      container.classList.add('is-visible');
    });
  }

  function closePopup(popupId) {
    container.classList.remove('is-visible');
    
    // Set dismissal flags in both storages. 
    // evaluatePopups will check the appropriate one based on the merchant's setting.
    localStorage.setItem(`pb_dismissed_${popupId}`, Date.now().toString());
    sessionStorage.setItem(`pb_dismissed_session_${popupId}`, 'true');
    
    setTimeout(() => {
      container.innerHTML = '';
      const interval = container.getAttribute('data-timer-interval');
      if (interval) {
        clearInterval(parseInt(interval));
        container.removeAttribute('data-timer-interval');
      }
    }, 300);
  }

  function trackAnalytics(popupId, type) {
    fetch(`${config.apiUrl}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop: config.shopDomain,
        popupId: popupId,
        type: type
      })
    }).catch(() => {}); // silent fail for analytics
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
