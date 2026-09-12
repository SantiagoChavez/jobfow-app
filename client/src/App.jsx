import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import KPICards from './components/KPICards.jsx';
import UpcomingReminders from './components/UpcomingReminders.jsx';
import RemindersDrawer from './components/RemindersDrawer.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import ApplicationTable from './components/ApplicationTable.jsx';
import QuickAddModal from './components/QuickAddModal.jsx';
import ApplicationDetailModal from './components/ApplicationDetailModal.jsx';
import ReportModal from './components/ReportModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import { useToast } from './context/ToastContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import {
  RadarIcon,
  SparklesIcon,
  KanbanIcon,
  FileTextIcon,
} from './components/Icons.jsx';
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  addInteraction,
  deleteApplication,
  getAnalyticsSummary,
} from './services/api.js';

export function App() {
  // Autenticación global
  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();

  // Colección completa para Kanban, Alertas y Estadísticas
  const [allApplications, setAllApplications] = useState([]);
  // Colección paginada del servidor para la vista de Tabla
  const [tableApplications, setTableApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook centralizado de notificaciones toast
  const { showToast } = useToast();

  // Estados de navegación y filtros
  const [currentView, setCurrentView] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales y Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRemindersDrawerOpen, setIsRemindersDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Carga de la colección completa desde la API (con all=true)
  const fetchAllData = useCallback(async () => {
    if (!localStorage.getItem('jobflow_token')) return;

    try {
      setLoading(true);
      setError(null);
      const [appsRes, analyticsData] = await Promise.all([
        getApplications({ all: true }),
        getAnalyticsSummary().catch(() => null),
      ]);
      setAllApplications(appsRes.data || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error al cargar datos generales:', err);
      setError('No se pudo conectar con el servidor backend. Verifica que esté en ejecución en el puerto 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga de la tabla paginada en servidor (GET /api/applications?page=X)
  const fetchTableData = useCallback(async (page = 1, search = searchQuery, status = statusFilter) => {
    if (!localStorage.getItem('jobflow_token')) return;

    try {
      const res = await getApplications({
        page,
        limit: 10,
        search: search ? search.trim() : undefined,
        status: status || undefined,
      });
      setTableApplications(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      console.error('Error al cargar página de tabla:', err);
      showToast('Error al cargar datos de la página', 'error');
    }
  }, [searchQuery, statusFilter, showToast]);

  // Sincronización inicial y reactiva con el estado de autenticación
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setAllApplications([]);
      setTableApplications([]);
      setAnalytics(null);
      setLoading(false);
    }
  }, [isAuthenticated, fetchAllData]);

  // Manejadores sincronizados de vista y filtros para evitar renders en cascada
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'table') {
      setCurrentPage(1);
      fetchTableData(1, searchQuery, statusFilter);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (currentView === 'table') {
      setCurrentPage(1);
      fetchTableData(1, query, statusFilter);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    if (currentView === 'table') {
      setCurrentPage(1);
      fetchTableData(1, searchQuery, status);
    }
  };

  // Manejador: Cambio interactivo de página numérica en la tabla
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || (pagination?.totalPages && newPage > pagination.totalPages)) return;
    setCurrentPage(newPage);
    await fetchTableData(newPage, searchQuery, statusFilter);
  };

  // Manejador: Crear Postulación
  const handleSaveApplication = async (newAppData) => {
    const created = await createApplication(newAppData);
    setAllApplications((prev) => [created, ...prev]);
    if (currentView === 'table') {
      fetchTableData(currentPage, searchQuery, statusFilter);
    }
    showToast(`Postulación en "${created.company?.name || 'la empresa'}" registrada con éxito.`);
    getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
  };

  // Manejador: Cambiar Estado con protección de degradación confirmable (409)
  const handleStatusChange = async (id, newStatus, options = {}) => {
    try {
      const updated = await updateApplicationStatus(id, newStatus, options);
      setAllApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
      );
      setTableApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
      );
      if (selectedApp && selectedApp._id === id) {
        setSelectedApp((prev) => ({ ...prev, ...updated }));
      }
      showToast(`Estado actualizado a ${newStatus}`);
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      // Si la API retorna 409 por degradación de OFERTA, solicitar confirmación explícita
      if (err.message && err.message.includes('OFERTA') && err.message.includes('force')) {
        const confirmForce = window.confirm(
          'Esta postulación ya se encuentra en estado OFERTA. ¿Estás seguro de que deseas forzar el cambio a un estado anterior?'
        );
        if (confirmForce) {
          handleStatusChange(id, newStatus, { ...options, force: true });
          return;
        }
      }
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // Manejador: Drag and Drop en Tablero Kanban con UI Optimista y Rollback
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const previousStatus = source.droppableId;

    if (newStatus === previousStatus) {
      return;
    }

    // 1. Actualización Optimista inmediata en UI
    setAllApplications((prev) =>
      prev.map((app) =>
        app._id === draggableId ? { ...app, status: newStatus } : app
      )
    );

    try {
      // 2. Persistencia en backend
      const updated = await updateApplicationStatus(draggableId, newStatus);

      // 3. Sincronizar datos devueltos por backend
      setAllApplications((prev) =>
        prev.map((app) =>
          app._id === draggableId ? { ...app, ...updated } : app
        )
      );

      if (selectedApp && selectedApp._id === draggableId) {
        setSelectedApp((prev) => ({ ...prev, ...updated }));
      }

      showToast(`Estado actualizado a ${newStatus}`, 'success');
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al mover tarjeta:', err);
      // Si fue rechazo por degradación de OFERTA, consultar si desea forzar (409)
      if (err.message && err.message.includes('OFERTA') && err.message.includes('force')) {
        const confirmForce = window.confirm(
          'Esta postulación ya se encuentra en estado OFERTA. ¿Deseas forzar la degradación a un estado anterior?'
        );
        if (confirmForce) {
          try {
            const forcedUpdated = await updateApplicationStatus(draggableId, newStatus, { force: true });
            setAllApplications((prev) =>
              prev.map((app) =>
                app._id === draggableId ? { ...app, ...forcedUpdated } : app
              )
            );
            if (selectedApp && selectedApp._id === draggableId) {
              setSelectedApp((prev) => ({ ...prev, ...forcedUpdated }));
            }
            showToast(`Estado actualizado a ${newStatus} (confirmado)`, 'success');
            getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
            return;
          } catch (forceErr) {
            setAllApplications((prev) =>
              prev.map((app) =>
                app._id === draggableId ? { ...app, status: previousStatus } : app
              )
            );
            showToast(`Error al forzar cambio: ${forceErr.message}`, 'error');
            return;
          }
        }
      }
      // 4. Rollback quirúrgico: solo revierte la tarjeta afectada a su estado previo
      setAllApplications((prev) =>
        prev.map((app) =>
          app._id === draggableId ? { ...app, status: previousStatus } : app
        )
      );
      showToast(`Error al mover: ${err.message || 'Falló la conexión con el servidor'}`, 'error');
    }
  };

  // Manejador: Agregar Interacción
  const handleAddInteraction = async (id, interactionData) => {
    const updated = await addInteraction(id, interactionData);
    setAllApplications((prev) =>
      prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
    );
    setTableApplications((prev) =>
      prev.map((app) => (app._id === id ? { ...app, ...updated } : app))
    );
    if (selectedApp && selectedApp._id === id) {
      setSelectedApp((prev) => ({ ...prev, ...updated }));
    }
    showToast('Evento registrado en el historial');
    getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
  };

  // Manejador: Eliminar Postulación
  const handleDeleteApplication = async (id) => {
    try {
      await deleteApplication(id);
      setAllApplications((prev) => prev.filter((app) => app._id !== id));
      if (currentView === 'table') {
        const nextTargetPage =
          tableApplications.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(nextTargetPage);
        fetchTableData(nextTargetPage, searchQuery, statusFilter);
      }
      showToast('Postulación eliminada');
      getAnalyticsSummary().then((res) => setAnalytics(res)).catch(() => {});
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  // Filtrado de postulaciones en memoria para el Tablero Kanban
  const filteredKanbanApplications = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allApplications.filter((app) => {
      const matchesSearch =
        !query ||
        app.company?.name?.toLowerCase().includes(query) ||
        app.role?.toLowerCase().includes(query) ||
        app.company?.industry?.toLowerCase().includes(query) ||
        app.requirementsRaw?.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allApplications, searchQuery, statusFilter]);

  // Cantidad de seguimientos prioritarios o con atención requerida
  const remindersCount = useMemo(() => {
    return allApplications.filter((app) => {
      if (!['ENVIADA', 'CONTACTO', 'ENTREVISTA', 'OFERTA'].includes(app.status)) return false;
      if (app.status === 'ENTREVISTA' || app.status === 'OFERTA') return true;
      if (app.status === 'CONTACTO') return true;
      if (app.appliedAt) {
        const days = Math.floor((new Date() - new Date(app.appliedAt)) / (1000 * 60 * 60 * 24));
        if (days >= 5) return true;
      }
      return false;
    }).length;
  }, [allApplications]);

  // Pantalla de carga mientras se valida la sesión persistida
  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-base flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-navy-surface border border-gold-primary/40 flex items-center justify-center text-gold-primary shadow-xl shadow-gold-primary/10">
          <RadarIcon className="w-7 h-7 animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400">Verificando sesión en Jobflow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-base text-slate-100 flex flex-col selection:bg-gold-primary selection:text-navy-base">
      {/* Navbar Superior con Campana y Menú de Usuario */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleViewChange}
        onOpenAddModal={() => {
          if (!isAuthenticated) {
            openAuthModal('login');
          } else {
            setIsAddModalOpen(true);
          }
        }}
        onOpenReportModal={() => {
          if (!isAuthenticated) {
            openAuthModal('login');
          } else {
            setIsReportModalOpen(true);
          }
        }}
        remindersCount={remindersCount}
        onOpenReminders={() => {
          if (!isAuthenticated) {
            openAuthModal('login');
          } else {
            setIsRemindersDrawerOpen(true);
          }
        }}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {!isAuthenticated ? (
          /* Estado Desconectado / Landing de Bienvenida y Seguridad */
          <div className="py-8 md:py-16 flex flex-col items-center text-center max-w-3xl mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-navy-surface border border-gold-primary/40 flex items-center justify-center text-gold-primary shadow-2xl shadow-gold-primary/20 mb-6">
              <RadarIcon className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-primary/10 border border-gold-primary/30 text-gold-primary text-xs font-bold uppercase tracking-wider mb-4">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Jobflow Radar PRO • Tu Espacio Privado</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Gestiona tu búsqueda laboral con el poder de la <span className="text-gold-primary">Inteligencia Artificial</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-2xl leading-relaxed">
              Registra y dale seguimiento a tus postulaciones, autocompleta vacantes con Gemini AI, calcula afinidad técnica en tiempo real y descarga reportes PDF ejecutivos en un espacio seguro y exclusivo para tu perfil.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => openAuthModal('register')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm bg-gold-primary hover:bg-gold-light text-navy-base shadow-lg shadow-gold-primary/20 hover:shadow-gold-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Crear Cuenta Gratis
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-navy-surface border border-slate-700 hover:border-gold-primary/60 text-slate-200 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Tarjetas informativas de características */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full text-left">
              <div className="p-5 rounded-2xl bg-navy-surface/80 border border-slate-800 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-navy-highlight border border-slate-700 flex items-center justify-center text-sky-tech mb-3">
                  <KanbanIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Tablero Kanban & Alertas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Arrastra tus postulaciones por estado, registra eventos cronológicos y calcula tiempos de respuesta automáticamente.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-navy-surface/80 border border-slate-800 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-navy-highlight border border-slate-700 flex items-center justify-center text-gold-primary mb-3">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Copiloto IA con Gemini</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pega cualquier oferta laboral y extrae instantáneamente las habilidades clave, resumen y pitch de presentación.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-navy-surface/80 border border-slate-800 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-navy-highlight border border-slate-700 flex items-center justify-center text-emerald-400 mb-3">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Reportes PDF & Métricas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analítica de conversión, empresas más ágiles y descarga de reportes ejecutivos en PDF para compartir con tu coach.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Estado Conectado: Dashboard, KPIs, Kanban y Tabla */
          <>
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={fetchAllData}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Tarjetas de Métricas y KPIs */}
            <KPICards analytics={analytics} loading={loading} />

            {/* Alertas y Recordatorios Clave */}
            <UpcomingReminders
              applications={allApplications}
              onSelectApplication={(app) => setSelectedApp(app)}
              onOpenReminders={() => setIsRemindersDrawerOpen(true)}
            />

            {/* Barra de Filtros y Selector de Vista */}
            <ViewToggle
              currentView={currentView}
              setCurrentView={handleViewChange}
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              statusFilter={statusFilter}
              setStatusFilter={handleStatusFilterChange}
              totalCount={
                currentView === 'table'
                  ? pagination?.totalDocs ?? tableApplications.length
                  : filteredKanbanApplications.length
              }
            />

            {/* Vista Alternada: Kanban o Tabla */}
            {currentView === 'kanban' ? (
              <KanbanBoard
                applications={filteredKanbanApplications}
                onSelectApplication={(app) => setSelectedApp(app)}
                onQuickStatusChange={handleStatusChange}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onDragEnd={handleDragEnd}
              />
            ) : (
              <ApplicationTable
                applications={tableApplications}
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onSelectApplication={(app) => setSelectedApp(app)}
                onDeleteApplication={handleDeleteApplication}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Navegación Móvil Fija */}
      {isAuthenticated && (
        <BottomNav
          currentView={currentView}
          setCurrentView={handleViewChange}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onRefresh={() => {
            fetchAllData();
            if (currentView === 'table') {
              fetchTableData(currentPage, searchQuery, statusFilter);
            }
          }}
        />
      )}

      {/* Modal: + Nueva Postulación */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveApplication}
      />

      {/* Modal: Detalle de Postulación */}
      <ApplicationDetailModal
        application={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onStatusChange={handleStatusChange}
        onAddInteraction={handleAddInteraction}
        onDelete={handleDeleteApplication}
      />

      {/* Modal: Descargar Reporte PDF */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Drawer Lateral: Alertas y Seguimientos */}
      <RemindersDrawer
        isOpen={isRemindersDrawerOpen}
        onClose={() => setIsRemindersDrawerOpen(false)}
        applications={allApplications}
        onSelectApplication={(app) => {
          setIsRemindersDrawerOpen(false);
          setSelectedApp(app);
        }}
      />

      {/* Modal Global de Autenticación */}
      <AuthModal />
    </div>
  );
}

export default App;
