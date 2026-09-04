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
      salary: salary ? salary.trim() : undefined,
      experienceLevel: experienceLevel ? experienceLevel.trim() : undefined,
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
