import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { query } from '../services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { StatsCard, Alert } from '../components/ui/widgets';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Users,
  GraduationCap,
  Megaphone,
  Award,
  CalendarCheck,
  ArrowRight,
  Pin,
  Clock,
  UserCheck
} from 'lucide-react';

export function Dashboard({ setTab }) {
  const { currentUser, userRole, studentInfo, isAdmin, isDocente, isFamilia } = useAuth();
  const [stats, setStats] = useState({
    userCount: 0,
    studentCount: 0,
    comunicadosCount: 0,
    promedioGeneral: '0.0',
    asistenciaPorcentaje: '100%'
  });
  const [comunicadosDestacados, setComunicadosDestacados] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [userRole, studentInfo]);

  function loadDashboardData() {
    // 1. Load Comunicados
    let comSql = `SELECT * FROM comunicados WHERE 1=1 `;
    if (isFamilia) {
      comSql += ` AND destinatarios IN ('Todos', 'Familias') `;
    } else if (isDocente) {
      comSql += ` AND destinatarios IN ('Todos', 'Docentes') `;
    }
    comSql += ` ORDER BY fijado DESC, id DESC LIMIT 3`;
    const coms = query(comSql);
    setComunicadosDestacados(coms);

    // 2. Load Stats based on role
    const users = query(`SELECT COUNT(*) as cnt FROM usuarios`);
    const students = query(`SELECT COUNT(*) as cnt FROM estudiantes`);
    const comunicados = query(`SELECT COUNT(*) as cnt FROM comunicados`);

    let prom = '8.9';
    let asisPct = '95%';

    if (isFamilia && studentInfo) {
      const notas = query(`SELECT AVG(nota) as avgNota FROM calificaciones WHERE estudiante_id = ?`, [studentInfo.id]);
      if (notas[0]?.avgNota) {
        prom = parseFloat(notas[0].avgNota).toFixed(1);
      }
      const totalAsis = query(`SELECT COUNT(*) as total, SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) as pres FROM asistencia WHERE estudiante_id = ?`, [studentInfo.id]);
      if (totalAsis[0]?.total > 0) {
        const pct = (totalAsis[0].pres / totalAsis[0].total) * 100;
        asisPct = `${pct.toFixed(0)}%`;
      }
    }

    setStats({
      userCount: users[0]?.cnt || 0,
      studentCount: students[0]?.cnt || 0,
      comunicadosCount: comunicados[0]?.cnt || 0,
      promedioGeneral: prom,
      asistenciaPorcentaje: asisPct
    });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white m-0">
              ¡Bienvenido/a, {currentUser?.nombre}!
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            {isAdmin && "Panel de control administrativo institucional del Centro San Martín."}
            {isDocente && "Portal docente para gestión académica, calificaciones y asistencia de estudiantes."}
            {isFamilia && studentInfo && `Portal de seguimiento escolar para la familia de ${studentInfo.nombre} (${studentInfo.curso}).`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={() => setTab('usuarios')}>
              <Users className="w-4 h-4 mr-1.5" />
              Gestionar Usuarios
            </Button>
          )}
          {(isAdmin || isDocente) && (
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setTab('comunicados')}>
              <Megaphone className="w-4 h-4 mr-1.5" />
              Nuevo Comunicado
            </Button>
          )}
          {isFamilia && (
            <Button variant="primary" size="sm" onClick={() => setTab('calificaciones')}>
              <Award className="w-4 h-4 mr-1.5" />
              Ver Calificaciones
            </Button>
          )}
        </div>
      </div>

      {/* Role-Specific Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <>
            <StatsCard
              title="Usuarios Registrados"
              value={stats.userCount}
              description="Cuentas activas en la intranet"
              icon={Users}
              color="indigo"
            />
            <StatsCard
              title="Alumnos Matriculados"
              value={stats.studentCount}
              description="Estudiantes en el sistema"
              icon={GraduationCap}
              color="emerald"
            />
            <StatsCard
              title="Comunicados Emitidos"
              value={stats.comunicadosCount}
              description="Avisos escolares vigentes"
              icon={Megaphone}
              color="sky"
            />
            <StatsCard
              title="Estado del Sistema"
              value="SQLite WASM"
              description="Persistencia en IndexedDB"
              icon={UserCheck}
              color="amber"
            />
          </>
        )}

        {isDocente && (
          <>
            <StatsCard
              title="Alumnos a Cargo"
              value={stats.studentCount}
              description="4º Educación Primaria A y B"
              icon={GraduationCap}
              color="indigo"
            />
            <StatsCard
              title="Promedio del Curso"
              value="8.8"
              description="Rendimiento académico global"
              icon={Award}
              color="emerald"
            />
            <StatsCard
              title="Registro Asistencia"
              value="Al Día"
              description="Última actualización hoy"
              icon={CalendarCheck}
              color="sky"
            />
            <StatsCard
              title="Comunicados Publicados"
              value={stats.comunicadosCount}
              description="Novedades para familias"
              icon={Megaphone}
              color="amber"
            />
          </>
        )}

        {isFamilia && studentInfo && (
          <>
            <StatsCard
              title="Estudiante Asignado"
              value={studentInfo.nombre}
              description={`${studentInfo.curso} - Sec ${studentInfo.seccion}`}
              icon={GraduationCap}
              color="indigo"
            />
            <StatsCard
              title="Promedio Académico"
              value={stats.promedioGeneral}
              description="Calificación media general"
              icon={Award}
              color="emerald"
            />
            <StatsCard
              title="Tasa de Asistencia"
              value={stats.asistenciaPorcentaje}
              description="Asistencia a clases registradas"
              icon={CalendarCheck}
              color="sky"
            />
            <StatsCard
              title="Avisos Recientes"
              value={comunicadosDestacados.length}
              description="Comunicaciones escolares"
              icon={Megaphone}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Main Grid: Recent Notices & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Announcements (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tablón de Comunicados Destacados</CardTitle>
                <CardDescription>Avisos oficiales recientes de la dirección y equipo docente</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTab('comunicados')} className="text-indigo-700 font-semibold">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {comunicadosDestacados.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No hay comunicados registrados.</p>
              ) : (
                comunicadosDestacados.map((com) => (
                  <div key={com.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {com.fijado === 1 && (
                          <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            <Pin className="w-3 h-3 mr-1 fill-amber-700" /> Fijado
                          </span>
                        )}
                        <Badge variant={com.categoria.toLowerCase()}>{com.categoria}</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {com.fecha.slice(0, 10)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">{com.titulo}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{com.contenido}</p>
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Publicado por: {com.autor_nombre}</span>
                      <span className="text-slate-500 font-medium">Destinatarios: {com.destinatarios}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Info & Prototype Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Institucional</CardTitle>
              <CardDescription>Instituto Educativo San Martín</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg space-y-1">
                <p className="font-semibold text-indigo-900">Horario de Atención Secretaría</p>
                <p className="text-indigo-800">Lunes a Viernes: 08:30h - 14:00h</p>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Año Académico:</span>
                  <span className="font-medium text-slate-800">2026 - 2027</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dirección:</span>
                  <span className="font-medium text-slate-800">Av. San Martín 102</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Teléfono Directo:</span>
                  <span className="font-medium text-slate-800">91 555 01 23</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert variant="info" title="Acerca del prototipo sin backend">
            Toda la base de datos se mantiene en memoria WebAssembly (`sql.js`) y se auto-guarda en `IndexedDB`.
            Puede exportar la base de datos completa `.sqlite` en cualquier momento desde el menú superior.
          </Alert>
        </div>
      </div>
    </div>
  );
}
