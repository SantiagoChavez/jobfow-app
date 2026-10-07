/**
 * Helper interno para normalizar parámetros (soporta objeto { email, subject, body } o argumentos posicionales)
 */
const parseMailParams = (optionsOrEmail, subjectParam = '', bodyParam = '') => {
  let email = '';
  let subject = '';
  let body = '';

  if (optionsOrEmail && typeof optionsOrEmail === 'object') {
    email = optionsOrEmail.email || '';
    subject = optionsOrEmail.subject || '';
    body = optionsOrEmail.body || '';
  } else if (typeof optionsOrEmail === 'string') {
    email = optionsOrEmail;
    subject = typeof subjectParam === 'string' ? subjectParam : '';
    body = typeof bodyParam === 'string' ? bodyParam : '';
  }

  return {
    email: typeof email === 'string' ? email.trim() : '',
    subject: typeof subject === 'string' ? subject.trim() : '',
    body: typeof body === 'string' ? body.trim() : '',
  };
};

/**
 * Genera un enlace mailto: seguro codificando caracteres especiales y saltos de línea
 * @param {Object|string} optionsOrEmail - Objeto { email, subject, body } o string de email
 * @param {string} [subjectParam] - Asunto (si se usan parámetros posicionales)
 * @param {string} [bodyParam] - Cuerpo (si se usan parámetros posicionales)
 * @returns {string}
 */
export const createSafeMailto = (optionsOrEmail, subjectParam = '', bodyParam = '') => {
  const { email, subject, body } = parseMailParams(optionsOrEmail, subjectParam, bodyParam);

  if (!email) return '#';
  const params = [];

  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }

  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`;
};

/**
 * Genera un enlace directo al redactor web de Gmail (https://mail.google.com) con destinatario, asunto y cuerpo precargados
 * @param {Object|string} optionsOrEmail - Objeto { email, subject, body } o string de email
 * @param {string} [subjectParam] - Asunto (si se usan parámetros posicionales)
 * @param {string} [bodyParam] - Cuerpo (si se usan parámetros posicionales)
 * @returns {string}
 */
export const createGmailWebLink = (optionsOrEmail, subjectParam = '', bodyParam = '') => {
  const { email, subject, body } = parseMailParams(optionsOrEmail, subjectParam, bodyParam);

  const params = ['view=cm', 'fs=1'];

  if (email) {
    params.push(`to=${encodeURIComponent(email)}`);
  }

  if (subject) {
    params.push(`su=${encodeURIComponent(subject)}`);
  }

  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  return `https://mail.google.com/mail/?${params.join('&')}`;
};

export default createSafeMailto;

