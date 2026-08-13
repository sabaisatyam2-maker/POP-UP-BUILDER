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
      // Check if dismissed recently (24 hours)
      const lastDismissed = localStorage.getItem(`pb_dismissed_${popup.id}`);
      if (lastDismissed) {
        const hoursSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
        if (hoursSince < 24) return;
      }

      let pConfig;
      try {
        pConfig = typeof popup.config === 'string' ? JSON.parse(popup.config) : popup.config;
      } catch(e) { return; }

      const triggers = pConfig.triggers || { type: "page_load" };
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

    const canvas = document.createElement('div');
    canvas.className = 'pb-canvas';
    
    // Apply Styles
    const styles = pConfig.styles || {};
    const colors = pConfig.colors || {};
    const content = pConfig.content || {};

    canvas.style.backgroundColor = colors.background || '#ffffff';
    canvas.style.color = colors.text || '#000000';
    canvas.style.borderRadius = styles.borderRadius || '8px';
    canvas.style.padding = styles.padding || '24px';
    canvas.style.boxShadow = styles.boxShadow || '0 4px 12px rgba(0,0,0,0.15)';
    canvas.style.width = pConfig.layout === 'split' ? '600px' : '400px';
    canvas.style.display = 'flex';
    canvas.style.flexDirection = pConfig.layout === 'split' ? 'row' : 'column';

    // App Store Rule: Close Button must be prominent
    const closeBtn = document.createElement('button');
    closeBtn.className = 'pb-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close popup');
    closeBtn.onclick = () => closePopup(popup.id);
    canvas.appendChild(closeBtn);

    // Build Content
    const innerContainer = document.createElement('div');
    innerContainer.style.flex = '1';
    innerContainer.style.textAlign = 'center';
    innerContainer.style.display = 'flex';
    innerContainer.style.flexDirection = 'column';
    innerContainer.style.gap = '16px';

    const popupBgColor = colors.background || '#ffffff';
    const popupTextColor = popupBgColor === '#ffffff' ? '#000000' : '#ffffff';

    if (content.headline) {
      const h2 = document.createElement('h2');
      h2.className = 'pb-headline';
      h2.innerText = content.headline;
      h2.style.color = popupTextColor;
      h2.style.wordBreak = 'break-word';
      innerContainer.appendChild(h2);
    }

    if (content.description) {
      const p = document.createElement('p');
      p.className = 'pb-description';
      p.innerText = content.description;
      p.style.color = popupTextColor;
      p.style.wordBreak = 'break-word';
      innerContainer.appendChild(p);
    }

    if (content.buttonText) {
      const btn = document.createElement('button');
      btn.className = 'pb-cta';
      btn.innerText = content.buttonText;
      const primaryColor = colors.primary || '#000000';
      btn.style.backgroundColor = primaryColor;
      btn.style.color = primaryColor === '#ffffff' ? '#000000' : '#ffffff';
      btn.style.border = 'none';
      btn.style.padding = '12px 24px';
      btn.style.borderRadius = '4px';
      btn.style.fontWeight = 'bold';
      btn.style.wordBreak = 'break-word';
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
    localStorage.setItem(`pb_dismissed_${popupId}`, Date.now().toString());
    setTimeout(() => {
      container.innerHTML = '';
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
