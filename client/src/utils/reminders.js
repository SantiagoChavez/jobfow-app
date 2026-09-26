/**
 * Utilidades para cálculo de recordatorios, tiempo de inactividad y cuenta regresiva
 */

export const ALARM_THRESHOLD_DAYS = 5;

/**
 * Obtiene la fecha más reciente de contacto o postulación
 */
export const getLastContactDate = (app) => {
  if (!app) return new Date();

  let latestTime = app.appliedAt ? new Date(app.appliedAt).getTime() : 0;
  if (Number.isNaN(latestTime)) latestTime = 0;

  if (Array.isArray(app.interactions) && app.interactions.length > 0) {
    for (const inter of app.interactions) {
      if (inter && inter.date) {
        const time = new Date(inter.date).getTime();
        if (!Number.isNaN(time) && time > latestTime) {
          latestTime = time;
        }
      }
    }
  }

  return latestTime > 0 ? new Date(latestTime) : new Date();
};

/**
 * Calcula días transcurridos desde el último contacto/interacción
 */
export const getDaysSinceLastContact = (app) => {
  const lastDate = getLastContactDate(app);
  return Math.max(0, Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
};

/**
 * Calcula todas las métricas de recordatorio y cuenta regresiva para una postulación
 */
export const getReminderMetrics = (app) => {
  if (!app) {
    return {
      daysSinceLastContact: 0,
      daysUntilNextAlert: ALARM_THRESHOLD_DAYS,
      isUrgent: false,
      urgencyLevel: 'LOW',
      urgencyLabel: 'Al día',
      message: 'Sin novedad',
      countdownText: `Próxima alerta en ${ALARM_THRESHOLD_DAYS} días`,
      lastContactDate: new Date(),
      hasFollowUpSent: false,
    };
  }

  const lastContactDate = getLastContactDate(app);
  const daysSince = Math.max(0, Math.floor((new Date().getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysUntilNextAlert = Math.max(0, ALARM_THRESHOLD_DAYS - daysSince);
  const hasFollowUpSent = Array.isArray(app.interactions) && app.interactions.some((i) => i.type === 'MENSAJE_ENVIADO');

  let urgencyLevel = 'LOW';
  let urgencyLabel = 'En curso';
  let message = 'En espera de respuesta';
  let isUrgent = false;

  if (app.status === 'ENTREVISTA') {
    urgencyLevel = 'HIGH';
    urgencyLabel = 'Entrevista';
    message = 'Proceso activo: preparar preguntas técnicas y objetivos';
    isUrgent = true;
  } else if (app.status === 'OFERTA') {
    urgencyLevel = 'HIGH';
    urgencyLabel = 'Oferta activa';
    message = 'Oferta sobre la mesa: evaluar compensación y responder';
    isUrgent = true;
  } else if (app.status === 'CONTACTO') {
    urgencyLevel = 'MEDIUM';
    urgencyLabel = 'Contacto';
    message = 'Hubo respuesta: verificar siguientes pasos con el reclutador';
  } else if (daysSince >= ALARM_THRESHOLD_DAYS) {
    urgencyLevel = 'URGENT';
    urgencyLabel = `Crítico (${daysSince}d)`;
    message = `Hace ${daysSince} días sin novedad: enviar mensaje de seguimiento`;
    isUrgent = true;
  } else {
    urgencyLevel = 'LOW';
    if (hasFollowUpSent) {
      urgencyLabel = daysSince === 0 ? 'Seguimiento enviado hoy' : `Seguimiento hace ${daysSince}d`;
      message = daysUntilNextAlert === 1
        ? 'Al día: próxima alerta mañana'
        : (daysUntilNextAlert === 0
          ? 'Alerta activa hoy'
          : `Al día: próxima alerta en ${daysUntilNextAlert} días`);
    } else {
      urgencyLabel = daysSince === 0 ? 'Enviada hoy' : `${daysSince}d enviado`;
      message = daysUntilNextAlert === 1
        ? 'En espera: próxima alerta mañana'
        : `En espera: próxima alerta en ${daysUntilNextAlert} días`;
    }
  }

  const countdownText = daysSince >= ALARM_THRESHOLD_DAYS
    ? `⚠️ Superó el umbral (${daysSince}d)`
    : (daysUntilNextAlert === 1
      ? '⏳ Próxima alerta mañana'
      : (daysUntilNextAlert === 0 ? '🚨 Alerta activa hoy' : `⏳ Próxima alerta en ${daysUntilNextAlert} días`));

  return {
    daysSinceLastContact: daysSince,
    daysUntilNextAlert,
    isUrgent,
    urgencyLevel,
    urgencyLabel,
    message,
    countdownText,
    lastContactDate,
    hasFollowUpSent,
  };
};
