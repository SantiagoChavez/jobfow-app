import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Application from '../models/Application.js';

describe('GET /api/applications - Paginación en Servidor, Ordenamiento y Filtros Combinados', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper para simular consultas encadenadas de Mongoose (.sort().skip().limit())
   */
  const setupQueryMock = (data = []) => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (resolve, reject) => Promise.resolve(data).then(resolve, reject),
    };
    vi.spyOn(Application, 'find').mockReturnValue(query);
    return query;
  };

  /**
   * Helper para generar documentos de prueba simulados
   */
  const generateMockApps = (count, baseRole = 'Developer') => {
    return Array.from({ length: count }, (_, index) => ({
      _id: `mock-id-${index + 1}`,
      company: { name: `Empresa ${index + 1}` },
      role: `${baseRole} ${index + 1}`,
      status: 'ENVIADA',
      priority: 'MEDIUM',
      workMode: 'REMOTE',
      appliedAt: new Date(Date.now() - index * 86400000),
    }));
  };

  describe('1. Paginación por defecto y DTO de respuesta', () => {
    it('debe responder 200 con paginación por defecto (page=1, limit=10, sortBy=appliedAt desc) y DTO limpio', async () => {
      const mockDocs = generateMockApps(10);
      const queryMock = setupQueryMock(mockDocs);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(45);

      const res = await request(app).get('/api/applications');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(10);

      // Verificación de invocación a Mongoose
      expect(queryMock.sort).toHaveBeenCalledWith({ appliedAt: -1 });
      expect(queryMock.skip).toHaveBeenCalledWith(0);
      expect(queryMock.limit).toHaveBeenCalledWith(10);

      // Verificación del DTO de paginación esperado
      expect(res.body.pagination).toEqual({
        totalDocs: 45,
        totalPages: 5,
        currentPage: 1,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });
  });

  describe('2. Páginas intermedias y skips', () => {
    it('debe solicitar segmento de página 2 con limit 10 y calcular skip=10 y prev/next flags correctamente', async () => {
      const page2Docs = generateMockApps(10, 'Page 2 Dev');
      const queryMock = setupQueryMock(page2Docs);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(45);

      const res = await request(app).get('/api/applications?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(10);
      expect(queryMock.skip).toHaveBeenCalledWith(10);
      expect(queryMock.limit).toHaveBeenCalledWith(10);

      expect(res.body.pagination).toEqual({
        totalDocs: 45,
        totalPages: 5,
        currentPage: 2,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('debe indicar hasNextPage: false en la última página disponible', async () => {
      const lastPageDocs = generateMockApps(5, 'Last Page Dev');
      const queryMock = setupQueryMock(lastPageDocs);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(45);

      const res = await request(app).get('/api/applications?page=5&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(5);
      expect(queryMock.skip).toHaveBeenCalledWith(40);
      expect(queryMock.limit).toHaveBeenCalledWith(10);

      expect(res.body.pagination).toEqual({
        totalDocs: 45,
        totalPages: 5,
        currentPage: 5,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('debe responder con data vacía y flags consistentes si se solicita una página superior al total de páginas', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(20);

      const res = await request(app).get('/api/applications?page=4&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(queryMock.skip).toHaveBeenCalledWith(30);

      expect(res.body.pagination).toEqual({
        totalDocs: 20,
        totalPages: 2,
        currentPage: 4,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });
  });

  describe('3. Base de datos vacía', () => {
    it('debe responder limpiamente cuando no existen postulaciones en la base de datos (totalDocs=0)', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(0);

      const res = await request(app).get('/api/applications');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(queryMock.skip).toHaveBeenCalledWith(0);
      expect(queryMock.limit).toHaveBeenCalledWith(10);

      expect(res.body.pagination).toEqual({
        totalDocs: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });
  });

  describe('4. Sanitización de límites y páginas inválidos', () => {
    it('debe sanear límites y páginas no numéricas o menores a 1 a sus valores por defecto', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(10);

      const res = await request(app).get('/api/applications?page=abc&limit=-10');

      expect(res.status).toBe(200);
      expect(queryMock.skip).toHaveBeenCalledWith(0);
      expect(queryMock.limit).toHaveBeenCalledWith(10);
      expect(res.body.pagination.currentPage).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    it('debe sanear limit=0 y page=0 para evitar consultas sin límite a MongoDB', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(10);

      const res = await request(app).get('/api/applications?page=0&limit=0');

      expect(res.status).toBe(200);
      expect(queryMock.skip).toHaveBeenCalledWith(0);
      expect(queryMock.limit).toHaveBeenCalledWith(10);
      expect(res.body.pagination.currentPage).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    it('debe restringir el límite a un máximo de 100 si se envía un valor excesivo', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(10);

      const res = await request(app).get('/api/applications?limit=500');

      expect(res.status).toBe(200);
      expect(queryMock.limit).toHaveBeenCalledWith(100);
      expect(res.body.pagination.limit).toBe(100);
    });
  });

  describe('5. Ordenamiento dinámico seguro', () => {
    it('debe ordenar ascendentemente por el campo role cuando sortBy=role y order=asc', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(5);

      const res = await request(app).get('/api/applications?sortBy=role&order=asc');

      expect(res.status).toBe(200);
      expect(queryMock.sort).toHaveBeenCalledWith({ role: 1 });
    });

    it('debe mapear sortBy=company a company.name descendente', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(5);

      const res = await request(app).get('/api/applications?sortBy=company&order=desc');

      expect(res.status).toBe(200);
      expect(queryMock.sort).toHaveBeenCalledWith({ 'company.name': -1 });
    });

    it('debe hacer fallback seguro a appliedAt si se envía un campo desconocido o no permitido', async () => {
      const queryMock = setupQueryMock([]);
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(5);

      const res = await request(app).get('/api/applications?sortBy=malicious$where&order=asc');

      expect(res.status).toBe(200);
      expect(queryMock.sort).toHaveBeenCalledWith({ appliedAt: 1 });
    });
  });

  describe('6. Preservación de filtros combinados', () => {
    it('debe aplicar filtros por status (múltiple), priority, workMode y búsqueda textual sin interferir con la paginación', async () => {
      const filteredDocs = generateMockApps(2, 'Tech Lead');
      const queryMock = setupQueryMock(filteredDocs);
      const countSpy = vi.spyOn(Application, 'countDocuments').mockResolvedValue(12);
      const findSpy = vi.spyOn(Application, 'find');

      const res = await request(app).get(
        '/api/applications?status=ENVIADA,ENTREVISTA&priority=HIGH&workMode=REMOTE&search=Google&page=2&limit=5'
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(queryMock.skip).toHaveBeenCalledWith(5);
      expect(queryMock.limit).toHaveBeenCalledWith(5);

      const expectedFilter = {
        status: { $in: ['ENVIADA', 'ENTREVISTA'] },
        priority: 'HIGH',
        workMode: 'REMOTE',
        $or: [
          { 'company.name': { $regex: 'Google', $options: 'i' } },
          { role: { $regex: 'Google', $options: 'i' } },
        ],
      };

      expect(countSpy).toHaveBeenCalledWith(expectedFilter);
      expect(findSpy).toHaveBeenCalledWith(expectedFilter);

      expect(res.body.pagination).toEqual({
        totalDocs: 12,
        totalPages: 3,
        currentPage: 2,
        limit: 5,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('debe soportar filtro de prioridad múltiple separado por comas', async () => {
      const queryMock = setupQueryMock([]);
      const countSpy = vi.spyOn(Application, 'countDocuments').mockResolvedValue(0);

      const res = await request(app).get('/api/applications?priority=LOW,MEDIUM');

      expect(res.status).toBe(200);
      expect(countSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: { $in: ['LOW', 'MEDIUM'] },
        })
      );
    });
  });

  describe('7. Manejo de Errores de Base de Datos', () => {
    it('debe responder 500 con formato JSON controlado si countDocuments falla', async () => {
      vi.spyOn(Application, 'countDocuments').mockRejectedValue(new Error('Fallo de conexión en replica set'));
      setupQueryMock([]);

      const res = await request(app).get('/api/applications');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Error interno del servidor al obtener las postulaciones');
    });

    it('debe responder 500 con formato JSON controlado si find() falla', async () => {
      vi.spyOn(Application, 'countDocuments').mockResolvedValue(10);
      const query = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve, reject) => reject(new Error('Timeout de consulta Mongoose')),
      };
      vi.spyOn(Application, 'find').mockReturnValue(query);

      const res = await request(app).get('/api/applications');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Error interno del servidor al obtener las postulaciones');
    });
  });
});
