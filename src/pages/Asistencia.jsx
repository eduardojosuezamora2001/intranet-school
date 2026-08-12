import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { query, run } from '../services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input, Select, Textarea } from '../components/ui/form-controls';
import { Alert } from '../components/ui/widgets';
import { CalendarCheck, Plus, Trash2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export function Asistencia() {
  const { currentUser, isFamilia, studentInfo } = useAuth();
  const [asistenciaList, setAsistenciaList] = useState([]);
  const [estudiantesList, setEstudiantesList] = useState([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('todos');

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    estudiante_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'Presente',
    observacion: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, [isFamilia, studentInfo]);

  function loadData() {
    const students = query(`SELECT * FROM estudiantes ORDER BY nombre ASC`);
    setEstudiantesList(students);

    let sql = `
      SELECT a.*, e.nombre as estudiante_nombre, e.curso as estudiante_curso
      FROM asistencia a
      JOIN estudiantes e ON a.estudiante_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (isFamilia && studentInfo) {
      sql += ` AND a.estudiante_id = ? `;
      params.push(studentInfo.id);
    }

    sql += ` ORDER BY a.fecha DESC, a.id DESC`;
    const list = query(sql, params);
    setAsistenciaList(list);
  }

  const filteredList = asistenciaList.filter((item) => {
    return isFamilia || selectedStudentFilter === 'todos' || String(item.estudiante_id) === String(selectedStudentFilter);
  });

  // Calculate Attendance Stats
  const totalSesiones = filteredList.length;
  const presentesCount = filteredList.filter(x => x.estado === 'Presente').length;
  const ausentesCount = filteredList.filter(x => x.estado === 'Ausente').length;
  const tardanzasCount = filteredList.filter(x => x.estado === 'Tardanza').length;
  const justificadosCount = filteredList.filter(x => x.estado === 'Justificado').length;

  const porcentajePresente = totalSesiones > 0 ? ((presentesCount + justificadosCount) / totalSesiones * 100).toFixed(0) : '100';

  const handleOpenAddModal = () => {
    setFormData({
      estudiante_id: estudiantesList[0]?.id || '',
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'Presente',
      observacion: ''
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSaveAsistencia = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await run(
        `INSERT INTO asistencia (estudiante_id, fecha, estado, observacion, docente_nombre) VALUES (?, ?, ?, ?, ?)`,
        [formData.estudiante_id, formData.fecha, formData.estado, formData.observacion, currentUser?.nombre || 'Docente']
      );
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setFormError("Error al registrar la asistencia.");
    }
  };

  const handleDeleteAsistencia = async (id) => {
    try {
      await run(`DELETE FROM asistencia WHERE id = ?`, [id]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-indigo-700" />
              <span>{isFamilia ? 'Registro de Asistencia Escolar' : 'Control de Asistencia de Clases'}</span>
            </CardTitle>
            <CardDescription>
              {isFamilia && studentInfo
                ? `Historial diario y puntualidad de ${studentInfo.nombre}`
                : 'Pase de lista diario, marcado de puntualidad y justificantes médicos/familiares.'}
            </CardDescription>
          </div>

          {!isFamilia && (
            <Button variant="primary" onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Asistencia
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="space-y-1 border-r border-slate-200/80 last:border-r-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">Puntualidad Global</p>
              <p className="text-xl font-bold text-indigo-700">{porcentajePresente}%</p>
            </div>
            <div className="space-y-1 border-r border-slate-200/80 last:border-r-0">
              <p className="text-[10px] uppercase font-bold text-emerald-600">Presentes</p>
              <p className="text-xl font-bold text-emerald-700">{presentesCount}</p>
            </div>
            <div className="space-y-1 border-r border-slate-200/80 last:border-r-0">
              <p className="text-[10px] uppercase font-bold text-amber-600">Tardanzas</p>
              <p className="text-xl font-bold text-amber-700">{tardanzasCount}</p>
            </div>
            <div className="space-y-1 border-r border-slate-200/80 last:border-r-0">
              <p className="text-[10px] uppercase font-bold text-blue-600">Justificados</p>
              <p className="text-xl font-bold text-blue-700">{justificadosCount}</p>
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase font-bold text-rose-600">Ausentes</p>
              <p className="text-xl font-bold text-rose-700">{ausentesCount}</p>
            </div>
          </div>

          {!isFamilia && (
            <div className="flex items-center space-x-3">
              <Select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="w-full sm:w-72"
              >
                <option value="todos">Todos los estudiantes</option>
                {estudiantesList.map((st) => (
                  <option key={st.id} value={st.id}>{st.nombre} ({st.curso})</option>
                ))}
              </Select>
            </div>
          )}

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                {!isFamilia && <TableHead>Estudiante</TableHead>}
                <TableHead>Estado Asistencia</TableHead>
                <TableHead>Observaciones / Justificante</TableHead>
                <TableHead>Registrado por</TableHead>
                {!isFamilia && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isFamilia ? 4 : 6} className="text-center py-8 text-slate-500">
                    No hay registros de asistencia para la selección actual.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {item.fecha}
                    </TableCell>
                    {!isFamilia && (
                      <TableCell className="font-semibold text-slate-900">
                        {item.estudiante_nombre}
                        <span className="block text-[11px] text-slate-400 font-normal">{item.estudiante_curso}</span>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={item.estado.toLowerCase()}>{item.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {item.observacion || <span className="text-slate-400 italic">Normal</span>}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {item.docente_nombre}
                    </TableCell>
                    {!isFamilia && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsistencia(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Attendance Dialog */}
      {!isFamilia && (
        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title="Registrar Asistencia Diaria"
          description="Seleccione al alumno, la fecha y el estado de la sesión."
        >
          {formError && (
            <Alert variant="error" title="Error" className="mb-4">
              {formError}
            </Alert>
          )}

          <form onSubmit={handleSaveAsistencia} className="space-y-4">
            <Select
              label="Seleccionar Estudiante"
              value={formData.estudiante_id}
              onChange={(e) => setFormData({ ...formData, estudiante_id: e.target.value })}
              required
            >
              {estudiantesList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nombre} ({st.curso} - Sec {st.seccion})
                </option>
              ))}
            </Select>

            <Input
              label="Fecha de la Clase"
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
            />

            <Select
              label="Estado de Asistencia"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            >
              <option value="Presente">Presente</option>
              <option value="Ausente">Ausente</option>
              <option value="Tardanza">Tardanza</option>
              <option value="Justificado">Justificado</option>
            </Select>

            <Textarea
              label="Observaciones (motivo de tardanza, nota médica, etc.)"
              value={formData.observacion}
              onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              placeholder="Opcional: detalle el justificante o motivo de falta..."
            />

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Guardar Registro
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
