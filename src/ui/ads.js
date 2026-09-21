import { AD_CONFIG } from "../config/ads.js";
export function mountAd(placement, container) {
  const slot = AD_CONFIG.slots[placement];
  if (
    !container ||
    !AD_CONFIG.enabled ||
    !/^\d{10}$/.test(slot) ||
    !/^ca-pub-\d{16}$/.test(AD_CONFIG.client)
  )
    return;
  const section = document.createElement("aside");
  section.className = "ad-slot";
  section.setAttribute("aria-label", "Publicidad");
  const label = document.createElement("small");
  label.textContent = "Publicidad";
  section.append(label);
  const ad = document.createElement("ins");
  ad.className = "adsbygoogle";
  ad.style.display = "block";
  Object.assign(ad.dataset, {
    adClient: AD_CONFIG.client,
    adSlot: slot,
    adFormat: "auto",
    fullWidthResponsive: "true",
  });
  section.append(ad);
  container.append(section);
  if (!document.querySelector("#ad-provider")) {
    const script = document.createElement("script");
    script.id = "ad-provider";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.client}`;
    document.head.append(script);
  }
  try {
    (window.adsbygoogle ||= []).push({});
  } catch {
    /* Ad blocking never interrupts a life. */
  }
}
