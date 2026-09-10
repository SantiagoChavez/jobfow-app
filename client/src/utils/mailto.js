/**
 * Genera un enlace mailto: seguro codificando caracteres especiales y saltos de línea
 * @param {Object} options
 * @param {string} options.email
 * @param {string} [options.subject]
 * @param {string} [options.body]
 * @returns {string}
 */
export const createSafeMailto = ({ email, subject = '', body = '' }) => {
  if (!email || typeof email !== 'string') return '#';
  const cleanEmail = email.trim();
  const params = [];

  if (subject && typeof subject === 'string' && subject.trim()) {
    params.push(`subject=${encodeURIComponent(subject.trim())}`);
  }

  if (body && typeof body === 'string' && body.trim()) {
    params.push(`body=${encodeURIComponent(body.trim())}`);
  }

  return `mailto:${cleanEmail}${params.length ? `?${params.join('&')}` : ''}`;
};

export default createSafeMailto;
