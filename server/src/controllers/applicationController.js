import mongoose from 'mongoose';
import Application from '../models/Application.js';

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

    // Interacción inicial automática
    const initialInteraction = {
      type: 'POSTULACION_ENVIADA',
      date: appliedAt ? new Date(appliedAt) : new Date(),
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
      status: status || 'ENVIADA',
      priority: priority || 'MEDIUM',
      workMode: workMode || 'REMOTE',
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
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      interactions: [initialInteraction],
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

/**
 * @desc    Listar todas las postulaciones con filtros por estado y prioridad
 * @route   GET /api/applications
 * @access  Public
 */
export const getApplications = async (req, res) => {
  try {
    const { status, priority, workMode, search } = req.query;

    const filter = {};

    // Filtro por estado
    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map((s) => s.trim().toUpperCase()) };
      } else {
        filter.status = status.trim().toUpperCase();
      }
    }

    // Filtro por prioridad
    if (priority) {
      if (priority.includes(',')) {
        filter.priority = { $in: priority.split(',').map((p) => p.trim().toUpperCase()) };
      } else {
        filter.priority = priority.trim().toUpperCase();
      }
    }

    // Filtro opcional por modalidad
    if (workMode) {
      filter.workMode = workMode.trim().toUpperCase();
    }

    // Búsqueda por nombre de empresa o rol
    if (search && search.trim()) {
      filter.$or = [
        { 'company.name': { $regex: search.trim(), $options: 'i' } },
        { role: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const applications = await Application.find(filter).sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
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

    if (!application) {
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
 * @desc    Actualizar el estado de una postulación
 * @route   PATCH /api/applications/:id/status
 * @access  Public
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de postulación inválido',
      });
    }

    const validStatuses = ['ENVIADA', 'CONTACTO', 'ENTREVISTA', 'RECHAZADA', 'OFERTA'];
    if (!status || typeof status !== 'string' || !validStatuses.includes(status.trim().toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido o no proporcionado. Valores permitidos: ${validStatuses.join(', ')}`,
      });
    }

    const normalizedStatus = status.trim().toUpperCase();

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Postulación no encontrada',
      });
    }

    const oldStatus = application.status;
    application.status = normalizedStatus;

    // Lógica analítica: si pasa a CONTACTO o ENTREVISTA y no se calculó tiempo de respuesta
    if (
      (normalizedStatus === 'CONTACTO' || normalizedStatus === 'ENTREVISTA') &&
      application.responseTimeDays === null
    ) {
      const targetDate = date ? new Date(date) : new Date();
      const diffMs = Math.max(0, targetDate.getTime() - new Date(application.appliedAt).getTime());
      application.responseTimeDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    // Registrar interacción correspondiente al cambio de estado
    let interactionType = 'MENSAJE_ENVIADO';
    if (normalizedStatus === 'CONTACTO') interactionType = 'RESPUESTA_RECIBIDA';
    else if (normalizedStatus === 'ENTREVISTA') interactionType = 'ENTREVISTA';
    else if (normalizedStatus === 'OFERTA') interactionType = 'OFERTA';
    else if (normalizedStatus === 'RECHAZADA') interactionType = 'RECHAZO';

    application.interactions.push({
      type: interactionType,
      date: date ? new Date(date) : new Date(),
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
 * @access  Public
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

    const application = await Application.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Postulación no encontrada',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Postulación eliminada exitosamente',
      id,
    });
  } catch (error) {
    console.error(`Error al eliminar postulación ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar la postulación',
    });
  }
};/**
 * @desc    Registrar una interacción en una postulación y calcular tiempos de respuesta
 * @route   POST /api/applications/:id/interactions
 * @access  Public
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

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Postulación no encontrada',
        message: 'Postulación no encontrada',
      });
    }

    // Crear la interacción con fallback de fecha
    const interactionDate = date ? new Date(date) : new Date();
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
      const diffTime = Math.max(0, interactionDate.getTime() - new Date(application.appliedAt).getTime());
      application.responseTimeDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

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

    return res.status(201).json(application);
  } catch (error) {
    console.error(`Error al registrar interacción en postulación ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al registrar la interacción',
      message: 'Error interno del servidor al registrar la interacción',
    });
  }
};
