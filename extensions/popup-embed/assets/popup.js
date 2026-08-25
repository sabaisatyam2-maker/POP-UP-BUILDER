(function() {
  const config = window.PopupBuilderConfig;
  if (!config) return;
  const container = document.getElementById("popup-builder-container");
  if (!container) return;
  let activePopups = [];

  async function init() {
    try {
      const response = await fetch(`${config.apiUrl}/popups?shop=${config.shopDomain}`);
      const data = await response.json();
      
      if (data.appUrl) {
        config.appUrl = data.appUrl;
      }
      
      if (data.popups && data.popups.length > 0) {
        activePopups = data.popups;
      } else if (config.designMode) {
        // Dummy popup for Theme Editor preview if no active popup exists!
        activePopups = [{
          id: "preview",
          name: "Preview Popup",
          config: JSON.stringify({
            layout: "modal",
            hasEmailInput: true,
            colors: { background: "#ffffff", text: "#000000", primary: "#000000", buttonText: "#ffffff" },
            styles: { borderRadius: "12px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
            content: { headline: "Popup Preview", description: "This is a preview of your popup block. Create an active popup in the app to see it live.", buttonText: "Subscribe" }
          })
        }];
      }

      if (activePopups.length > 0) {
        activePopups.forEach(popup => {
          let pConfig;
          try {
            pConfig = typeof popup.config === "string" ? JSON.parse(popup.config) : popup.config;
          } catch (e) {
            return;
          }

          const targeting = pConfig.targeting || {};
          if (targeting.page && targeting.page !== "all") {
            if (targeting.page === "home" && config.template !== "index") return;
            if (targeting.page === "product" && config.template !== "product") return;
            if (targeting.page === "collection" && config.template !== "collection" && config.template !== "list-collections") return;
            if (targeting.page === "cart" && config.template !== "cart") return;
          }

          if (targeting.device && targeting.device !== "all") {
            const isMobile = window.innerWidth <= 480;
            if (targeting.device === "mobile" && !isMobile) return;
            if (targeting.device === "desktop" && isMobile) return;
          }

          if (pConfig.schedule && pConfig.schedule.endDate) {
            const end = new Date(pConfig.schedule.endDate).getTime();
            if (Date.now() > end) return;
          }



          const triggers = pConfig.triggers || { type: "page_load", frequency: "once_24h" };
          const displayFrequency = pConfig.displayFrequency || "once_per_day";

          if (displayFrequency === "once_per_day") {
            const dismissed = localStorage.getItem(`pb_dismissed_${popup.id}`);
            if (dismissed && (Date.now() - parseInt(dismissed)) / 3600000 < 24) return;
          } else if (displayFrequency === "once_per_session") {
            if (sessionStorage.getItem(`pb_dismissed_session_${popup.id}`)) return;
          }

          const triggerType = triggers.type || "page_load";

          if (triggerType === "scroll") {
            const onScroll = () => {
              const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
              if (scrollPercent >= (triggers.scrollPercent || 50)) {
                showPopup(popup, pConfig);
                window.removeEventListener("scroll", onScroll);
              }
            };
            window.addEventListener("scroll", onScroll);
          } else if (triggerType === "delay") {
            setTimeout(() => {
              showPopup(popup, pConfig);
            }, (triggers.delaySeconds || 5) * 1000);
          } else {
            showPopup(popup, pConfig);
          }
        });
      }
    } catch (e) {
      console.error("Popup Builder: Failed to fetch popups", e);
    }
  }

  function showPopup(popup, pConfig) {
    if (container.classList.contains("is-visible")) return;
    
    if (!config.designMode && popup.id !== "preview") {
      trackEvent(popup.id, "view");
    }

    if (pConfig.position === "bottom" && window.innerWidth > 480) {
      container.style.alignItems = "flex-end";
      container.style.justifyContent = "center";
    } else if (pConfig.position === "top" && window.innerWidth > 480) {
      container.style.alignItems = "flex-start";
      container.style.justifyContent = "center";
    } else if (pConfig.position === "bottom-right" && window.innerWidth > 480) {
      container.style.alignItems = "flex-end";
      container.style.justifyContent = "flex-end";
    } else {
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
    }

    const isMobile = window.innerWidth <= 480;
    const canvas = document.createElement("div");
    canvas.className = "pb-canvas";
    if (pConfig.layout === "split") canvas.classList.add("pb-layout-split");

    const styles = pConfig.styles || {};
    const colors = pConfig.colors || {};
    const content = pConfig.content || {};

    const getImageUrl = (url) => {
      if (!url) return url;
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('data:')) return url;
      const baseUrl = config.appUrl || config.apiUrl;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/${url}`;
    };

    const imageUrl = getImageUrl(pConfig.imageUrl);

    if (pConfig.layout === "background" && imageUrl) {
      canvas.style.background = `${colors.background || "#ffffff"} url('${imageUrl}') center/100% 100% no-repeat`;
      canvas.style.alignItems = "center";
    } else {
      canvas.style.background = colors.background || "#ffffff";
    }
    
    canvas.style.color = colors.text || "#000000";
    canvas.style.borderRadius = styles.borderRadius || "8px";
    canvas.style.boxSizing = "border-box";
    canvas.style.padding = (popup.name && popup.name.includes("CYBER MONDAY")) ? (isMobile ? "16px" : "24px") : (styles.padding || "24px");
    canvas.style.boxShadow = styles.boxShadow || "0 4px 12px rgba(0,0,0,0.15)";
    canvas.style.width = "90%";
    canvas.style.maxWidth = pConfig.layout === "split" ? "600px" : "400px";
    if (pConfig.position === "bottom" && window.innerWidth > 480) {
      canvas.style.marginBottom = "24px";
    } else if (pConfig.position === "bottom-right" && window.innerWidth > 480) {
      canvas.style.margin = "24px";
    }
    canvas.style.minHeight = pConfig.layout === "background" ? (isMobile ? "auto" : "360px") : "auto";
    canvas.style.display = "flex";
    canvas.style.flexDirection = pConfig.layout === "split" ? (isMobile ? "column" : "row") : "column";
    canvas.style.alignItems = pConfig.layout === "background" ? "flex-end" : "stretch";
    canvas.style.overflowX = "hidden";
    canvas.style.overflowY = "auto";
    canvas.style.position = "relative";
    canvas.style.height = "fit-content";
    canvas.style.maxHeight = "90%";
    if (styles.border) canvas.style.border = styles.border;

    const closeBtn = document.createElement("button");
    closeBtn.className = "pb-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close popup");
    closeBtn.onclick = () => closePopup(popup.id);
    canvas.appendChild(closeBtn);

    if (pConfig.layout === "split" && imageUrl) {
      const imgContainer = document.createElement("div");
      imgContainer.className = "pb-img-container";
      imgContainer.style.flex = isMobile ? "none" : "1";
      imgContainer.style.width = isMobile ? "100%" : "auto";
      imgContainer.style.height = isMobile ? "220px" : "auto";
      imgContainer.style.backgroundColor = "#f4f6f8";
      imgContainer.style.display = "flex";
      imgContainer.style.alignItems = "center";
      imgContainer.style.justifyContent = "center";
      imgContainer.style.overflow = "hidden";
      
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      imgContainer.appendChild(img);
      canvas.appendChild(imgContainer);
    }

    const contentDiv = document.createElement("div");
    contentDiv.style.flex = pConfig.layout === "split" ? (isMobile ? "none" : "1") : "";
    contentDiv.style.width = pConfig.layout === "background" ? "100%" : "auto";
    contentDiv.style.padding = pConfig.layout === "split" ? (isMobile ? "16px" : "24px") : (pConfig.layout === "image-bottom-right" ? (isMobile ? "16px 16px 16px 0px" : "24px 24px 24px 0px") : (isMobile ? "16px" : "32px"));
    contentDiv.style.textAlign = pConfig.layout === "image-bottom-right" ? "left" : "center";
    contentDiv.style.display = "flex";
    contentDiv.style.flexDirection = "column";
    contentDiv.style.gap = "16px";
    contentDiv.style.justifyContent = "center";
    contentDiv.style.alignItems = pConfig.layout === "image-bottom-right" ? "flex-start" : "center";
    contentDiv.style.position = "relative";
    contentDiv.style.zIndex = "2";

    if (pConfig.layout === "image-bottom-right" && imageUrl) {
      const img = document.createElement("img");
      img.className = "pb-mobile-img";
      img.src = imageUrl;
      if (imageUrl && imageUrl.includes("clover")) {
        img.style.position = "absolute"; img.style.top = "0px"; img.style.bottom = "0px"; img.style.right = "-5px"; img.style.width = "65%"; img.style.maxWidth = "300px"; img.style.height = "100%"; img.style.objectFit = "cover"; img.style.objectPosition = "right center";
      } else {
        img.style.position = "absolute"; img.style.bottom = "40px"; img.style.right = "0px"; img.style.width = "55%"; img.style.maxWidth = "240px"; img.style.height = "auto"; img.style.objectFit = "contain";
      }
      img.style.zIndex = "1";
      canvas.appendChild(img);
    }

    if (pConfig.layout !== "split" && pConfig.layout !== "image-bottom-right" && pConfig.layout !== "background" && imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.width = "100%";
      img.style.maxHeight = "150px";
      img.style.objectFit = "contain";
      img.style.marginBottom = "16px";
      contentDiv.appendChild(img);
    }

    const defaultTextColor = colors.text || "#000000";
    const popupName = popup.name || "";

    if (content.headline) {
      const el = document.createElement("h2");
      el.className = "pb-headline pb-mobile-text";
      el.innerText = content.headline;
      el.style.color = /new year sale/i.test(popupName) ? defaultTextColor : (colors.headlineText || defaultTextColor);
      el.style.fontSize = "32px";
      el.style.margin = "0";
      el.style.lineHeight = "1.3";
      el.style.wordBreak = "break-word";
      el.style.textAlign = pConfig.layout === "image-bottom-right" ? "left" : "center";
      if (pConfig.layout === "image-bottom-right") el.style.maxWidth = "55%";
      contentDiv.appendChild(el);
    }

    if (content.subheadline) {
      const el = document.createElement("h3");
      el.className = "pb-subheadline pb-mobile-text";
      el.innerText = content.subheadline;
      el.style.color = /new year sale/i.test(popupName) ? defaultTextColor : (colors.primary || "#000000");
      el.style.fontSize = "24px";
      el.style.fontWeight = "bold";
      el.style.margin = "0 0 8px 0";
      el.style.wordBreak = "break-word";
      el.style.textAlign = pConfig.layout === "image-bottom-right" ? "left" : "center";
      if (pConfig.layout === "image-bottom-right") el.style.maxWidth = "55%";
      contentDiv.appendChild(el);
    }

    if (pConfig.hasCountdown) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "center";
      wrapper.style.gap = "12px";
      wrapper.style.margin = "8px 0";
      const els = {};
      ["Days", "Hours", "Mins", "Secs"].forEach(l => {
        const d = document.createElement("div");
        d.style.backgroundColor = "#1a1a1f"; d.style.borderRadius = "8px"; d.style.padding = "12px 16px"; d.style.display = "flex"; d.style.flexDirection = "column"; d.style.alignItems = "center"; d.style.border = "1px solid rgba(255,255,255,0.05)"; d.style.minWidth = "48px";
        const v = document.createElement("span");
        v.style.fontSize = "20px"; v.style.fontWeight = "bold"; v.style.color = "#ffffff"; v.style.lineHeight = "1"; v.innerText = "00";
        d.appendChild(v);
        const lbl = document.createElement("span");
        lbl.style.fontSize = "10px"; lbl.style.color = "#a1a1aa"; lbl.style.marginTop = "4px"; lbl.style.textTransform = "uppercase"; lbl.innerText = l;
        d.appendChild(lbl);
        els[l] = v;
        wrapper.appendChild(d);
      });
      contentDiv.appendChild(wrapper);
      
      const targetTime = content.countdownTarget ? new Date(content.countdownTarget).getTime() : new Date().getTime() + 172800000;
      const updateTime = () => {
        const now = new Date().getTime();
        const diff = targetTime - now;
        if (diff < 0) {
          els.Days.innerText = "00"; els.Hours.innerText = "00"; els.Mins.innerText = "00"; els.Secs.innerText = "00";
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        els.Days.innerText = d.toString().padStart(2, "0");
        els.Hours.innerText = h.toString().padStart(2, "0");
        els.Mins.innerText = m.toString().padStart(2, "0");
        els.Secs.innerText = s.toString().padStart(2, "0");
      };
      updateTime();
      const intId = setInterval(updateTime, 1000);
      container.setAttribute("data-timer-interval", intId);
    }

    if (content.description) {
      const el = document.createElement("p");
      el.className = "pb-description pb-mobile-text";
      el.innerText = content.description;
      
      let descColor = defaultTextColor;
      if (/new year sale/i.test(popupName)) {
        let bgHex = colors.background || "#050505";
        bgHex = bgHex.replace("#", "");
        if (bgHex.length === 3) bgHex = bgHex.split("").map(c=>c+c).join("");
        if (bgHex.length === 6) {
          const r = parseInt(bgHex.substring(0,2), 16);
          const g = parseInt(bgHex.substring(2,4), 16);
          const b = parseInt(bgHex.substring(4,6), 16);
          descColor = ((r*299 + g*587 + b*114)/1000 >= 128) ? "#000000" : "#FFFFFF";
        }
      }
      
      el.style.color = descColor;
      el.style.margin = "0";
      el.style.wordBreak = "break-word";
      if (pConfig.layout === "image-bottom-right") el.style.maxWidth = "55%";
      el.style.textAlign = pConfig.layout === "image-bottom-right" ? "left" : "center";
      contentDiv.appendChild(el);
    }

    if (pConfig.hasEmailInput) {
      const el = document.createElement("input");
      el.type = "email";
      el.placeholder = "Enter your email";
      el.className = "pb-email-input";
      el.style.padding = "10px";
      el.style.width = pConfig.layout === "image-bottom-right" ? "55%" : "100%";
      el.style.borderRadius = "4px";
      el.style.border = "1px solid #ccc";
      el.style.boxSizing = "border-box";
      el.style.marginBottom = "16px";
      el.style.textAlign = pConfig.layout === "image-bottom-right" ? "left" : "center";
      contentDiv.appendChild(el);
    }

    if (content.buttonText) {
      const el = document.createElement("button");
      el.className = "pb-cta pb-mobile-btn";
      el.innerText = content.buttonText;
      el.style.background = colors.primary || "#000000";
      el.style.color = colors.buttonText || "#ffffff";
      el.style.border = "none";
      el.style.padding = "12px 24px";
      el.style.borderRadius = "4px";
      el.style.fontWeight = "bold";
      el.style.whiteSpace = "normal";
      el.style.wordWrap = "break-word";
      el.style.alignSelf = pConfig.layout === "image-bottom-right" ? "flex-start" : "center";
      if (pConfig.layout === "modal" || pConfig.layout === "split") el.style.width = "100%";
      if (pConfig.layout === "image-bottom-right") el.style.maxWidth = "55%";
      el.onclick = () => {
        if (!config.designMode && popup.id !== "preview") trackEvent(popup.id, "click");
        if (content.buttonUrl && content.buttonUrl.trim() !== "") {
          if (config.designMode) {
            alert("Button Clicked!\n\nRedirect URL: " + content.buttonUrl + "\n\n(Note: Redirects are disabled inside the Shopify Theme Editor for security reasons. To test the actual redirect, please view your live storefront.)");
            return;
          }
          window.location.href = content.buttonUrl;
        } else {
          closePopup(popup.id);
        }
      };
      contentDiv.appendChild(el);
    }

    canvas.appendChild(contentDiv);
    container.innerHTML = "";
    
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.onclick = () => closePopup(popup.id);
    container.appendChild(overlay);
    
    container.appendChild(canvas);
    
    requestAnimationFrame(() => {
      container.classList.add("is-visible");
    });
  }

  function closePopup(id) {
    container.classList.remove("is-visible");
    if (id !== "preview") {
      localStorage.setItem(`pb_dismissed_${id}`, Date.now().toString());
      sessionStorage.setItem(`pb_dismissed_session_${id}`, "true");
    }
    setTimeout(() => {
      container.innerHTML = "";
      const t = container.getAttribute("data-timer-interval");
      if (t) {
        clearInterval(parseInt(t));
        container.removeAttribute("data-timer-interval");
      }
    }, 300);
  }

  function trackEvent(id, type) {
    fetch(`${config.apiUrl}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: config.shopDomain, popupId: id, type: type })
    }).catch(()=>{});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();