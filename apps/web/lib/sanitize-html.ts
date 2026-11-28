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
    'class', 'id',
    // 'style' kasıtlı olarak çıkarıldı — XSS vektörü (background: url(javascript:...))
]);

// Event handler pattern — tüm on* attr'ları kaldır
const EVENT_HANDLER_PATTERN = /^on/i;

// Dangerous protocols in href/src
const DANGEROUS_PROTOCOL = /^(javascript|vbscript|data):/i;

function sanitizeNode(node: Element): void {
    // Tehlikeli veya izin verilmeyen tagları unwrap etmeden önce alt elementleri temizle
    const tagName = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
        Array.from(node.children).forEach(child => sanitizeNode(child as Element));
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

        // href/src için kontrol karakterlerinden arındırılmış protocol kontrolü
        const normalizedProtocol = value.replace(/[\u0000-\u0020]+/g, '');
        if ((name === 'href' || name === 'src') && DANGEROUS_PROTOCOL.test(normalizedProtocol)) {
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

function sanitizeSsrFallback(html: string): string {
    return html
        .replace(/<(script|style|iframe|object|embed|svg|form|base)\b[\s\S]*?<\/\1>/gi, '')
        .replace(/<(script|style|iframe|object|embed|svg|form|base)\b[^>]*\/?>/gi, '')
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript|data):[^"']*\2/gi, '');
}

/**
 * AI tarafından üretilen HTML'i sanitize eder.
 * Tarayıcı ortamında DOMParser kullanır.
 * SSR ortamında tehlikeli etiket ve event handler'ları temizleyen güvenli fallback uygular.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return sanitizeSsrFallback(html);
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // <script> ve <style> taglarını tamamen kaldır
        doc.querySelectorAll('script, style, iframe, object, embed, svg, form, base').forEach(el => el.remove());

        // Body içindeki her elementi sanitize et
        Array.from(doc.body.children).forEach(child => sanitizeNode(child as Element));

        return doc.body.innerHTML;
    } catch (e) {
        // Parse hatası — boş string döndür
        console.warn('[sanitizeHtml] Parse error, returning empty string:', e);
        return '';
    }
}
