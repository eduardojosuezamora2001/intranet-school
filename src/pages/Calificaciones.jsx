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
import { Award, Plus, Edit3, Trash2, BookOpen, Filter, GraduationCap, CheckCircle } from 'lucide-react';

export function Calificaciones() {
  const { currentUser, isFamilia, studentInfo } = useAuth();
  const [calificacionesList, setCalificacionesList] = useState([]);
  const [estudiantesList, setEstudiantesList] = useState([]);
  const [selectedTrimestre, setSelectedTrimestre] = useState('todos');
  const [selectedEstudianteFilter, setSelectedEstudianteFilter] = useState('todos');

  // Modal State for Docente/Admin
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    estudiante_id: '',
    asignatura: 'Matemáticas',
    trimestre: '1º Trimestre',
    nota: '8.5',
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
      SELECT c.*, e.nombre as estudiante_nombre, e.curso as estudiante_curso, e.seccion as estudiante_seccion
      FROM calificaciones c
      JOIN estudiantes e ON c.estudiante_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Security & Role Filter Enforcement: If family, restrict exclusively to their linked student!
    if (isFamilia && studentInfo) {
      sql += ` AND c.estudiante_id = ? `;
      params.push(studentInfo.id);
    }

    sql += ` ORDER BY c.id DESC`;
    const list = query(sql, params);
    setCalificacionesList(list);
  }

  // Filter list by selected UI controls
  const filteredList = calificacionesList.filter((g) => {
    const matchTri = selectedTrimestre === 'todos' || g.trimestre === selectedTrimestre;
    const matchEst = isFamilia || selectedEstudianteFilter === 'todos' || String(g.estudiante_id) === String(selectedEstudianteFilter);
    return matchTri && matchEst;
  });

  // Calculate average
  const totalNotas = filteredList.reduce((acc, curr) => acc + parseFloat(curr.nota), 0);
  const promedioCalculado = filteredList.length > 0 ? (totalNotas / filteredList.length).toFixed(1) : 'N/A';

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    setFormData({
      estudiante_id: estudiantesList[0]?.id || '',
      asignatura: 'Matemáticas',
      trimestre: '1º Trimestre',
      nota: '8.0',
      observacion: ''
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditModal = (grade) => {
    setEditingGrade(grade);
    setFormData({
      estudiante_id: grade.estudiante_id,
      asignatura: grade.asignatura,
      trimestre: grade.trimestre,
      nota: grade.nota,
      observacion: grade.observacion || ''
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setFormError('');

    const notaNum = parseFloat(formData.nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      setFormError("La nota debe ser un número válido entre 0 y 10.");
      return;
    }

    try {
      if (editingGrade) {
        await run(
          `UPDATE calificaciones SET estudiante_id = ?, asignatura = ?, trimestre = ?, nota = ?, observacion = ? WHERE id = ?`,
          [formData.estudiante_id, formData.asignatura, formData.trimestre, notaNum, formData.observacion, editingGrade.id]
        );
      } else {
        await run(
          `INSERT INTO calificaciones (estudiante_id, asignatura, trimestre, nota, observacion, docente_nombre) VALUES (?, ?, ?, ?, ?, ?)`,
          [formData.estudiante_id, formData.asignatura, formData.trimestre, notaNum, formData.observacion, currentUser?.nombre || 'Docente']
        );
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setFormError("Error al guardar la calificación.");
    }
  };

  const handleDeleteGrade = async (id) => {
    try {
      await run(`DELETE FROM calificaciones WHERE id = ?`, [id]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-700" />
              <span>{isFamilia ? 'Calificaciones de Estudiante' : 'Gestión Académica de Calificaciones'}</span>
            </CardTitle>
            <CardDescription>
              {isFamilia && studentInfo
                ? `Boletín de calificaciones oficial para ${studentInfo.nombre} (${studentInfo.curso})`
                : 'Módulo de registro, edición y consulta de notas asignadas por trimestre y materia.'}
            </CardDescription>
          </div>

          {!isFamilia && (
            <Button variant="primary" onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Calificación
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Student Header Card for Family view */}
          {isFamilia && studentInfo && (
            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-950 text-base m-0">{studentInfo.nombre}</h3>
                  <p className="text-xs text-indigo-700 m-0">Código: {studentInfo.codigo} | {studentInfo.curso} - Sec {studentInfo.seccion}</p>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-indigo-200 shadow-xs flex items-center space-x-3">
                <span className="text-xs text-slate-500 font-semibold uppercase">Promedio General:</span>
                <span className="text-xl font-extrabold text-indigo-700">{promedioCalculado} / 10</span>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isFamilia && (
              <Select
                value={selectedEstudianteFilter}
                onChange={(e) => setSelectedEstudianteFilter(e.target.value)}
                className="flex-1"
              >
                <option value="todos">Todos los estudiantes</option>
                {estudiantesList.map((st) => (
                  <option key={st.id} value={st.id}>{st.nombre} ({st.curso})</option>
                ))}
              </Select>
            )}

            <Select
              value={selectedTrimestre}
              onChange={(e) => setSelectedTrimestre(e.target.value)}
              className={isFamilia ? "w-full sm:w-64" : "w-full sm:w-48"}
            >
              <option value="todos">Todos los Trimestres</option>
              <option value="1º Trimestre">1º Trimestre</option>
              <option value="2º Trimestre">2º Trimestre</option>
              <option value="3º Trimestre">3º Trimestre</option>
            </Select>
          </div>

          {/* Grades Table */}
          <Table>
            <TableHeader>
              <TableRow>
                {!isFamilia && <TableHead>Estudiante</TableHead>}
                <TableHead>Asignatura</TableHead>
                <TableHead>Trimestre</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Observación del Docente</TableHead>
                <TableHead>Docente</TableHead>
                {!isFamilia && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isFamilia ? 5 : 7} className="text-center py-8 text-slate-500">
                    No se registran calificaciones para el filtro seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((g) => (
                  <TableRow key={g.id}>
                    {!isFamilia && (
                      <TableCell className="font-semibold text-slate-900">
                        {g.estudiante_nombre}
                        <span className="block text-[11px] text-slate-400 font-normal">{g.estudiante_curso}</span>
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-slate-800 flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>{g.asignatura}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{g.trimestre}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-bold text-sm ${
                        g.nota >= 9 ? 'bg-emerald-100 text-emerald-800' :
                        g.nota >= 7 ? 'bg-indigo-100 text-indigo-800' :
                        g.nota >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {parseFloat(g.nota).toFixed(1)} / 10
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-xs text-xs">
                      {g.observacion || <span className="text-slate-400 italic">Sin observaciones</span>}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-medium">
                      {g.docente_nombre}
                    </TableCell>
                    {!isFamilia && (
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(g)}
                        >
                          <Edit3 className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGrade(g.id)}
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

      {/* Add / Edit Grade Dialog (Docentes / Admin) */}
      {!isFamilia && (
        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title={editingGrade ? "Editar Calificación" : "Registrar Calificación"}
          description="Ingrese la nota obtenida y la retroalimentación cualitativa para el estudiante."
        >
          {formError && (
            <Alert variant="error" title="Error" className="mb-4">
              {formError}
            </Alert>
          )}

          <form onSubmit={handleSaveGrade} className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Asignatura / Materia"
                value={formData.asignatura}
                onChange={(e) => setFormData({ ...formData, asignatura: e.target.value })}
              >
                <option value="Matemáticas">Matemáticas</option>
                <option value="Lengua Castellana">Lengua Castellana</option>
                <option value="Ciencias Naturales">Ciencias Naturales</option>
                <option value="Ciencias Sociales">Ciencias Sociales</option>
                <option value="Inglés">Inglés</option>
                <option value="Educación Física">Educación Física</option>
                <option value="Música">Música</option>
              </Select>

              <Select
                label="Periodo / Trimestre"
                value={formData.trimestre}
                onChange={(e) => setFormData({ ...formData, trimestre: e.target.value })}
              >
                <option value="1º Trimestre">1º Trimestre</option>
                <option value="2º Trimestre">2º Trimestre</option>
                <option value="3º Trimestre">3º Trimestre</option>
              </Select>
            </div>

            <Input
              label="Nota Numérica (0.0 - 10.0)"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.nota}
              onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
              required
            />

            <Textarea
              label="Observaciones y Retroalimentación"
              value={formData.observacion}
              onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              placeholder="Detalle aspectos destacados o recomendaciones de mejora..."
            />

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingGrade ? 'Actualizar Nota' : 'Guardar Calificación'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
