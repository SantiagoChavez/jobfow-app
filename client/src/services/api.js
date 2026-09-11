/**
 * Capa de Servicios HTTP para Jobflow Client
 * Conexión centralizada con el backend (/api)
 */

const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : '';
const API_BASE = rawApiUrl
  ? (rawApiUrl.replace(/\/+$/, '').endsWith('/api')
      ? rawApiUrl.replace(/\/+$/, '')
      : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

/**
 * Helper para peticiones JSON con manejo de errores uniforme
 */
async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || data.error || `Error HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Listar postulaciones con filtros, ordenamiento y paginación opcionales
 * @param {Object} [filters] - { status, priority, workMode, search, page, limit, sortBy, order, all }
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
export async function getApplications(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.workMode) params.append('workMode', filters.workMode);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);
  if (filters.all) params.append('all', 'true');

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await request(`/applications${query}`);
  const data = Array.isArray(res.data) ? res.data : [];
  const pagination = res.pagination || {
    totalDocs: data.length,
    totalPages: 1,
    currentPage: 1,
    limit: data.length || 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  return { data, pagination };
}

/**
 * Obtener detalle de una postulación por ID
 */
export async function getApplicationById(id) {
  const res = await request(`/applications/${id}`);
  return res.data;
}

/**
 * Crear nueva postulación
 */
export async function createApplication(applicationData) {
  const res = await request('/applications', {
    method: 'POST',
    body: JSON.stringify(applicationData),
  });
  return res.data;
}

/**
 * Actualizar estado de una postulación con soporte para confirmación forzada (force), notas y fecha
 * @param {string} id - ID de la postulación
 * @param {string} status - Nuevo estado
 * @param {Object} [options] - Opciones adicionales: { force, notes, date }
 */
export async function updateApplicationStatus(id, status, options = {}) {
  const payload = {
    status,
    ...(options.force ? { force: true } : {}),
    ...(options.notes ? { notes: options.notes } : {}),
    ...(options.date ? { date: options.date } : {}),
  };

  const res = await request(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Registrar una interacción manual (entrevista, mensaje, respuesta, etc.)
 */
export async function addInteraction(id, interactionData) {
  const res = await request(`/applications/${id}/interactions`, {
    method: 'POST',
    body: JSON.stringify(interactionData),
  });
  return res.data || res;
}

/**
 * Eliminar una postulación
 */
export async function deleteApplication(id) {
  const res = await request(`/applications/${id}`, {
    method: 'DELETE',
  });
  return res.data || res;
}

/**
 * Obtener resumen de analíticas y KPIs consolidados
 */
export async function getAnalyticsSummary() {
  const res = await request('/analytics/summary');
  return res;
}

/**
 * Previsualizar coincidencia y afinidad de habilidades técnicas
 */
export async function previewMatch(text) {
  const res = await request('/applications/match-preview', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return res.data || res;
}

/**
 * Descargar reporte PDF con gestión de blob y trigger nativo de descarga
 * @param {string} [from] - Fecha inicio YYYY-MM-DD
 * @param {string} [to] - Fecha fin YYYY-MM-DD
 */
export async function downloadPdfReport(from, to) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE}/reports/pdf${query}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Error al generar el reporte PDF');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `jobflow-reporte-${from || 'mes'}-a-${to || 'hoy'}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Analizar descripción de empleo con IA y generar pitch de presentación
 * @param {string} text - Texto de la oferta de empleo
 * @param {string} [userProfile] - Perfil opcional del postulante
 */
export async function analyzeJobWithAI(text, userProfile) {
  const res = await request('/ai/analyze-job', {
    method: 'POST',
    body: JSON.stringify({ text, userProfile }),
  });
  return res.data || res;
}

export default {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  addInteraction,
  deleteApplication,
  getAnalyticsSummary,
  previewMatch,
  downloadPdfReport,
  analyzeJobWithAI,
};
