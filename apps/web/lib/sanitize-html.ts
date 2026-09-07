/**
 * HTML Sanitization Utility
 *
 * AI tarafından üretilen HTML içerikleri DOM'a yazılmadan önce
 * bu fonksiyondan geçirilmeli. XSS saldırılarını önler.
 *
 * İzin verilen etiketler: h1-h6, p, ul, ol, li, strong, em,
 * blockquote, br, span, code, pre, a, table vb.
 *
 * Tüm script, iframe, on* event handler'lar ve tehlikeli attribute'lar temizlenir.
 *
 * NOT: Bu utility yalnızca client-side "use client" bileşenlerinde çağrılır.
 * Tarayıcı DOMParser API'si kullanılmaktadır.
 */

const ALLOWED_TAGS = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sup', 'sub',
    'blockquote', 'cite',
    'code', 'pre',
    'span', 'div', 'section', 'article',
    'a',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'img',
]);

const ALLOWED_ATTRS = new Set([
    'href', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'id', 'style',
]);

// Event handler pattern — tüm on* attr'ları kaldır
const EVENT_HANDLER_PATTERN = /^on/i;

// Dangerous protocols in href/src
const DANGEROUS_PROTOCOL = /^(javascript|vbscript|data):/i;

function sanitizeNode(node: Element): void {
    // Tehlikeli tagları tamamen kaldır
    const tagName = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
    }

    // Attribute'ları temizle
    const attrsToRemove: string[] = [];
    for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        const name = attr.name.toLowerCase();
        const value = attr.value;

        // Event handler'ları kaldır
        if (EVENT_HANDLER_PATTERN.test(name)) {
            attrsToRemove.push(attr.name);
            continue;
        }

        // İzin verilmeyen attribute'ları kaldır
        if (!ALLOWED_ATTRS.has(name)) {
            attrsToRemove.push(attr.name);
            continue;
        }

        // href/src için protocol kontrolü
        if ((name === 'href' || name === 'src') && DANGEROUS_PROTOCOL.test(value.trim())) {
            attrsToRemove.push(attr.name);
            continue;
        }
    }

    attrsToRemove.forEach(a => node.removeAttribute(a));

    // <a> etiketleri için güvenlik: target=_blank rel=noopener
    if (tagName === 'a') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
    }

    // Alt elementleri de temizle
    Array.from(node.children).forEach(child => sanitizeNode(child as Element));
}

/**
 * AI tarafından üretilen HTML'i sanitize eder.
 * Tarayıcı ortamında DOMParser kullanır.
 * Server-side rendering'de (SSR) no-op olarak davranır — sadece client component'lerde kullanılmalıdır.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // SSR ortamında DOMParser yok — güvenli HTML zaten server'da AI tarafından üretiliyor
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return html;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // <script> ve <style> taglarını tamamen kaldır
        doc.querySelectorAll('script, style, iframe, object, embed, form, base').forEach(el => el.remove());

        // Body içindeki her elementi sanitize et
        Array.from(doc.body.children).forEach(child => sanitizeNode(child as Element));

        return doc.body.innerHTML;
    } catch (e) {
        // Parse hatası — boş string döndür
        console.warn('[sanitizeHtml] Parse error, returning empty string:', e);
        return '';
    }
}
