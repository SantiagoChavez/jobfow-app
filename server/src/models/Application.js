import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Subdocumento para registrar eventos y seguimiento cronológico de la postulación.
 */
const interactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'POSTULACION_ENVIADA',
        'MENSAJE_ENVIADO',
        'RESPUESTA_RECIBIDA',
        'ENTREVISTA',
        'RECHAZO',
        'OFERTA',
      ],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

/**
 * Esquema principal de la postulación laboral.
 */
const applicationSchema = new Schema(
  {
    company: {
      name: {
        type: String,
        required: [true, 'El nombre de la empresa es obligatorio'],
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      industry: {
        type: String,
        trim: true,
      },
    },
    role: {
      type: String,
      required: [true, 'El puesto o rol es obligatorio'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['ENVIADA', 'CONTACTO', 'ENTREVISTA', 'RECHAZADA', 'OFERTA'],
      default: 'ENVIADA',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    workMode: {
      type: String,
      enum: ['REMOTE', 'HYBRID', 'ON_SITE'],
      default: 'REMOTE',
    },
    salary: {
      type: String,
      trim: true,
    },
    experienceLevel: {
      type: String,
      trim: true,
    },
    recruiter: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
    },
    jobUrl: {
      type: String,
      trim: true,
    },
    requirementsRaw: {
      type: String,
    },
    extractedSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    interactions: [interactionSchema],
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    responseTimeDays: {
      type: Number,
      default: null,
    },
    suggestedPitch: {
      type: String,
      trim: true,
    },
    companySummary: {
      type: String,
      trim: true,
    },
    matchScore: {
      type: Number,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario propietario es obligatorio'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar reportes y búsquedas
applicationSchema.index({ user: 1, appliedAt: -1 });
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ status: 1, appliedAt: -1 });
applicationSchema.index({ priority: 1 });
applicationSchema.index({ workMode: 1 });
applicationSchema.index({ 'company.name': 1 });
applicationSchema.index({ responseTimeDays: 1, 'company.name': 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
