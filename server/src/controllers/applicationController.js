import mongoose from 'mongoose';
import Application from '../models/Application.js';

// Constantes de Dominio y Enums
const VALID_STATUSES = ['ENVIADA', 'CONTACTO', 'ENTREVISTA', 'RECHAZADA', 'OFERTA'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_WORK_MODES = ['REMOTE', 'HYBRID', 'ON_SITE'];
const MAX_ALL_QUERY_LIMIT = 1000; // Tope defensivo para evitar OOM

/**
 * Sanitiza y valida una fecha asegurando no generar Invalid Date / NaN
 */
const parseSafeDate = (inputDate) => {
  if (!inputDate) return new Date();
  const d = new Date(inputDate);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Calcula diferencia positiva en días enteros sin producir NaN
 */
const calculateResponseDays = (fromDate, toDate) => {
  const start = parseSafeDate(fromDate).getTime();
  const end = parseSafeDate(toDate).getTime();
  const diffMs = Math.max(0, end - start);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * @desc    Crear una nueva postulación
 * @route   POST /api/applications
 * @access  Public
 */
export const createApplication = async (req, res) => {
  try {
    const {
      company,
      role,
      status,
      priority,
      workMode,
      salary,
      experienceLevel,
      recruiter,
      jobUrl,
      requirementsRaw,
      extractedSkills,
      appliedAt,
      notes,
      suggestedPitch,
      companySummary,
      matchScore,
    } = req.body;

    // Validación de campos requeridos
    if (!company || !company.name || typeof company.name !== 'string' || !company.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la empresa es obligatorio',
      });
    }

    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El puesto o rol es obligatorio',
      });
    }

    const safeAppliedAt = parseSafeDate(appliedAt);

    // Interacción inicial automática
    const initialInteraction = {
      type: 'POSTULACION_ENVIADA',
      date: safeAppliedAt,
      notes: notes && typeof notes === 'string' && notes.trim()
        ? notes.trim()
        : 'Postulación inicial registrada',
    };

    const applicationData = {
      company: {
        name: company.name.trim(),
        website: company.website ? company.website.trim() : undefined,
        industry: company.industry ? company.industry.trim() : undefined,
      },
      role: role.trim(),
      status: typeof status === 'string' && VALID_STATUSES.includes(status.trim().toUpperCase())
        ? status.trim().toUpperCase()
        : 'ENVIADA',
      priority: typeof priority === 'string' && VALID_PRIORITIES.includes(priority.trim().toUpperCase())
        ? priority.trim().toUpperCase()
        : 'MEDIUM',
      workMode: typeof workMode === 'string' && VALID_WORK_MODES.includes(workMode.trim().toUpperCase())
        ? workMode.trim().toUpperCase()
        : 'REMOTE',
      salary: salary != null ? String(salary).trim() : undefined,
      experienceLevel: experienceLevel != null ? String(experienceLevel).trim() : undefined,
      recruiter: recruiter
        ? {
            name: recruiter.name ? recruiter.name.trim() : undefined,
            email: recruiter.email ? recruiter.email.trim() : undefined,
          }
        : undefined,
      jobUrl: jobUrl ? jobUrl.trim() : undefined,
      requirementsRaw: requirementsRaw || undefined,
      extractedSkills: Array.isArray(extractedSkills)
        ? extractedSkills.map((s) => (typeof s === 'string' ? s.trim() : s)).filter(Boolean)
        : [],
      suggestedPitch: typeof suggestedPitch === 'string' && suggestedPitch.trim()
        ? suggestedPitch.trim()
        : undefined,
      companySummary: typeof companySummary === 'string' && companySummary.trim()
        ? companySummary.trim()
        : undefined,
      matchScore: typeof matchScore === 'number' && !Number.isNaN(matchScore)
        ? matchScore
        : undefined,
      appliedAt: safeAppliedAt,
      interactions: [initialInteraction],
      user: req.user ? req.user._id : undefined,
    };

    const newApplication = await Application.create(applicationData);

    return res.status(201).json({
      success: true,
      data: newApplication,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación al crear la postulación',
        errors: messages,
      });
    }

    console.error('Error al crear postulación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la postulación',
    });
  }
};

// Helper de escape para prevenir ReDoS y errores de sintaxis en regex de MongoDB
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Lista blanca de campos permitidos para ordenamiento dinámico
 */
const ALLOWED_SORT_FIELDS = {
  appliedAt: 'appliedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  role: 'role',
  status: 'status',
  priority: 'priority',
  workMode: 'workMode',
  salary: 'salary',
  responseTimeDays: 'responseTimeDays',
  company: 'company.name',
  'company.name': 'company.name',
};

/**
 * @desc    Listar postulaciones con filtros combinados, ordenamiento dinámico y paginación
 * @route   GET /api/applications
 * @access  Private (requiere protect)
 */
export const getApplications = async (req, res) => {
  try {
    const { status, priority, workMode, search, sortBy, order } = req.query;

    // 1. Sanitización y parseo robusto de paginación
    const parsedPage = parseInt(req.query.page, 10);
    const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1
      ? Math.min(parsedLimit, 100)
      : 10;

    // 2. Configuración segura de ordenamiento dinámico
    const sortField = ALLOWED_SORT_FIELDS[typeof sortBy === 'string' ? sortBy : ''] || 'appliedAt';
    const sortDirection = typeof order === 'string' && order.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    const filter = {};

    // Filtrar por el usuario autenticado
    if (req.user?._id) {
      filter.user = req.user._id;
    }

    // 3. Filtro por estado con Whitelist estricta
    if (typeof status === 'string' && status.trim()) {
      const statuses = status
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => VALID_STATUSES.includes(s));

      if (statuses.length > 1) {
        filter.status = { $in: statuses };
      } else if (statuses.length === 1) {
        filter.status = statuses[0];
      }
    }

    // 4. Filtro por prioridad con Whitelist estricta
    if (typeof priority === 'string' && priority.trim()) {
      const priorities = priority
        .split(',')
        .map((p) => p.trim().toUpperCase())
        .filter((p) => VALID_PRIORITIES.includes(p));

      if (priorities.length > 1) {
        filter.priority = { $in: priorities };
      } else if (priorities.length === 1) {
        filter.priority = priorities[0];
      }
    }

    // 5. Filtro opcional por modalidad con Whitelist
    if (typeof workMode === 'string' && workMode.trim()) {
      const mode = workMode.trim().toUpperCase();
      if (VALID_WORK_MODES.includes(mode)) {
        filter.workMode = mode;
      }
    }

    // 6. Búsqueda textual segura por empresa o rol (Sanitizada contra ReDoS)
    if (typeof search === 'string' && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { 'company.name': { $regex: safeSearch, $options: 'i' } },
        { role: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const isAll = req.query.all === 'true';
    const skip = isAll ? 0 : (page - 1) * limit;

    // Ejecución concurrente del conteo y la consulta segmentada
    const countPromise = Application.countDocuments(filter);
    const query = Application.find(filter).sort(sortOptions);
    if (isAll) {
      // Blindaje de seguridad: evita saturar memoria en colecciones masivas
      query.limit(MAX_ALL_QUERY_LIMIT);
    } else {
      query.skip(skip).limit(limit);
    }
    const [totalDocs, applications] = await Promise.all([countPromise, query]);

    // Cálculo de metadatos de paginación
    const effectiveLimit = isAll ? Math.min(totalDocs, MAX_ALL_QUERY_LIMIT) : limit;
    const totalPages = isAll ? (totalDocs > 0 ? 1 : 0) : (totalDocs === 0 ? 0 : Math.ceil(totalDocs / limit));
    const hasNextPage = isAll ? false : page < totalPages;
    const hasPrevPage = isAll ? false : page > 1 && totalDocs > 0;

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        totalDocs,
        totalPages,
        currentPage: isAll ? 1 : page,
        limit: effectiveLimit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error al listar postulaciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener las postulaciones',
    });
  }
};

/**
 * @desc    Obtener el detalle completo de una postulación por ID
 * @route   GET /api/applications/:id
 * @access  Public
 */
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de postulación inválido',
      });
    }

    const application = await Application.findById(id);

    if (
      !application ||
      (req.user && application.user && application.user.toString() !== req.user._id.toString())
    ) {
      return res.status(404).json({
        success: false,
        message: 'Postulación no encontrada',
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(`Error al obtener postulación ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener la postulación',
    });
  }
};

/**
 * @desc    Actualizar el estado de una postulación con protección de degradación
 * @route   PATCH /api/applications/:id/status
 * @access  Private (requiere protect)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, date, force } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de postulación inválido',
      });
    }

    if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status.trim().toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido o no proporcionado. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const normalizedStatus = status.trim().toUpperCase();

    const application = await Application.findById(id);

    if (
      !application ||
      (req.user && application.user && application.user.toString() !== req.user._id.toString())
    ) {
      return res.status(404).json({
        success: false,
        message: 'Postulación no encontrada',
      });
    }

    const oldStatus = application.status;

    // Guard de Idempotencia: si el estado ya es el mismo, responder 200 sin duplicar interacciones
    if (oldStatus === normalizedStatus) {
      return res.status(200).json({
        success: true,
        message: `La postulación ya se encuentra en estado ${normalizedStatus}`,
        data: application,
      });
    }

    // Regla de Dominio: Evitar degradación accidental de OFERTA a estados inferiores
    if (oldStatus === 'OFERTA' && normalizedStatus !== 'RECHAZADA' && !force) {
      return res.status(409).json({
        success: false,
        message: 'No es posible degradar una postulación con OFERTA a un estado previo sin confirmación explícita (force: true).',
      });
    }

    application.status = normalizedStatus;
    const targetDate = parseSafeDate(date);

    // Lógica analítica: si pasa a CONTACTO o ENTREVISTA y no se calculó tiempo de respuesta
    if (
      (normalizedStatus === 'CONTACTO' || normalizedStatus === 'ENTREVISTA') &&
      application.responseTimeDays === null
    ) {
      application.responseTimeDays = calculateResponseDays(application.appliedAt, targetDate);
    }

    // Registrar interacción correspondiente al cambio de estado
    let interactionType = 'MENSAJE_ENVIADO';
    if (normalizedStatus === 'CONTACTO') interactionType = 'RESPUESTA_RECIBIDA';
    else if (normalizedStatus === 'ENTREVISTA') interactionType = 'ENTREVISTA';
    else if (normalizedStatus === 'OFERTA') interactionType = 'OFERTA';
    else if (normalizedStatus === 'RECHAZADA') interactionType = 'RECHAZO';

    application.interactions.push({
      type: interactionType,
      date: targetDate,
      notes: notes && typeof notes === 'string' && notes.trim()
        ? notes.trim()
        : `Estado actualizado de ${oldStatus} a ${normalizedStatus}`,
    });

    await application.save();

    return res.status(200).json({
      success: true,
      message: `Estado actualizado a ${normalizedStatus}`,
      data: application,
    });
  } catch (error) {
    console.error(`Error al actualizar estado de la postulación ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el estado',
    });
  }
};

/**
 * @desc    Eliminar una postulación por ID
 * @route   DELETE /api/applications/:id
 * @access  Private (requiere protect)
 */
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de postulación inválido',
      });
    }

    const application = await Application.findById(id);

    if (
      !application ||
      (req.user && application.user && application.user.toString() !== req.user._id.toString())
    ) {
      return res.status(404).json({
        success: false,
        message: 'Postulación no encontrada',
      });
    }

    await Application.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Postulación eliminada exitosamente',
      id,
      data: { id },
    });
  } catch (error) {
    console.error(`Error al eliminar postulación ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar la postulación',
    });
  }
};

/**
 * @desc    Registrar una interacción en una postulación y calcular tiempos de respuesta
 * @route   POST /api/applications/:id/interactions
 * @access  Private (requiere protect)
 */
export const addInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date, notes } = req.body;

    // Validar que el ID sea un ObjectId válido de Mongoose
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de postulación inválido',
        message: 'ID de postulación inválido',
      });
    }

    // Validar que type esté dentro del enum permitido
    const allowedTypes = [
      'POSTULACION_ENVIADA',
      'MENSAJE_ENVIADO',
      'RESPUESTA_RECIBIDA',
      'ENTREVISTA',
      'RECHAZO',
      'OFERTA',
    ];

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de interacción inválido',
        message: 'Tipo de interacción inválido',
      });
    }

    // Buscar la postulación por ID
    const application = await Application.findById(id);

    if (
      !application ||
      (req.user && application.user && application.user.toString() !== req.user._id.toString())
    ) {
      return res.status(404).json({
        success: false,
        error: 'Postulación no encontrada',
        message: 'Postulación no encontrada',
      });
    }

    // Crear la interacción con fallback de fecha seguro (sin NaN)
    const interactionDate = parseSafeDate(date);
    const interaction = {
      type,
      date: interactionDate,
      notes: notes && typeof notes === 'string' ? notes.trim() : undefined,
    };

    // Empujar la interacción al array
    application.interactions.push(interaction);

    // LÓGICA DE NEGOCIO:
    // 1. Si es RESPUESTA_RECIBIDA y aún no se calculó tiempo de respuesta
    if (type === 'RESPUESTA_RECIBIDA' && application.responseTimeDays === null) {
      application.responseTimeDays = calculateResponseDays(application.appliedAt, interactionDate);

      if (application.status === 'ENVIADA') {
        application.status = 'CONTACTO';
      }
    }

    // 2. Si es ENTREVISTA y no está en estado OFERTA
    if (type === 'ENTREVISTA' && application.status !== 'OFERTA') {
      application.status = 'ENTREVISTA';
    }

    // Guardar cambios en persistencia
    await application.save();

    const appObj = application.toObject ? application.toObject() : application;

    return res.status(201).json({
      success: true,
      data: application,
      ...appObj,
    });
  } catch (error) {
    console.error(`Error al registrar interacción en postulación ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al registrar la interacción',
      message: 'Error interno del servidor al registrar la interacción',
    });
  }
};
