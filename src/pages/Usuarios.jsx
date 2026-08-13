import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { query, run, hashPassword, setUserStudents } from '../services/db';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input, Select } from '../components/ui/form-controls';
import { Alert } from '../components/ui/widgets';
import { PaginationControls } from '../components/ui/pagination';
import { Users, UserPlus, Edit3, Trash2, Search, ShieldAlert, Key, X } from 'lucide-react';

const PAGE_SIZE = 10;

export function Usuarios() {
  const { isAdmin, refreshUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Pagination & Cursor State
  const [page, setPage] = useState(1);
  const [cursorStack, setCursorStack] = useState([null]);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    email: '',
    rol: 'estudiante_familia',
    selected_student_ids: []
  });
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    setPage(1);
    setCursorStack([null]);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, page, cursorStack, searchTerm, roleFilter]);

  function loadData() {
    // Build SQL query with filters and cursor pagination
    let whereClauses = ["1=1"];
    let params = [];

    if (roleFilter !== 'todos') {
      whereClauses.push("u.rol = ?");
      params.push(roleFilter);
    }

    if (searchTerm.trim() !== '') {
      whereClauses.push("(LOWER(u.nombre) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?)");
      const term = `%${searchTerm.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.join(" AND ");

    // Total count for info
    const countRes = query(`SELECT COUNT(*) as total FROM usuarios u WHERE ${whereSql}`, params);
    const total = countRes[0] ? countRes[0].total : 0;
    setTotalItems(total);

    // Cursor condition: u.id > currentCursor
    const currentCursor = cursorStack[page - 1];
    let cursorSql = whereSql;
    let cursorParams = [...params];

    if (currentCursor !== null && currentCursor !== undefined) {
      cursorSql += " AND u.id > ?";
      cursorParams.push(currentCursor);
    }

    // Cursor pagination query with LIMIT
    const rawUsers = query(
      `SELECT u.* FROM usuarios u WHERE ${cursorSql} ORDER BY u.id ASC LIMIT ${PAGE_SIZE + 1}`,
      cursorParams
    );

    const hasNext = rawUsers.length > PAGE_SIZE;
    const paginatedUsers = hasNext ? rawUsers.slice(0, PAGE_SIZE) : rawUsers;
    setHasNextPage(hasNext);

    // Map linked students for paginated users
    const userStudentsMap = {};
    const allLinks = query(`
      SELECT ue.usuario_id, e.id as estudiante_id, e.nombre as estudiante_nombre, e.curso as estudiante_curso, e.codigo as estudiante_codigo
      FROM usuario_estudiantes ue
      JOIN estudiantes e ON ue.estudiante_id = e.id
      ORDER BY e.nombre ASC
    `);

    allLinks.forEach(link => {
      if (!userStudentsMap[link.usuario_id]) {
        userStudentsMap[link.usuario_id] = [];
      }
      userStudentsMap[link.usuario_id].push(link);
    });

    const usersWithStudents = paginatedUsers.map(u => ({
      ...u,
      linked_students: userStudentsMap[u.id] || []
    }));

    setUsersList(usersWithStudents);

    const students = query(`SELECT * FROM estudiantes ORDER BY nombre ASC`);
    setStudentsList(students);
  }

  const handleNextPage = () => {
    if (hasNextPage && usersList.length > 0) {
      const lastUser = usersList[usersList.length - 1];
      setCursorStack(prev => [...prev, lastUser.id]);
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setCursorStack(prev => prev.slice(0, prev.length - 1));
      setPage(prev => prev - 1);
    }
  };

  if (!isAdmin) {
    return (
      <Alert variant="error" title="Acceso Restringido">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5" />
          <span>Esta sección está reservada exclusivamente para el personal con rol de **Administración**.</span>
        </div>
      </Alert>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredStudentsForSelection = studentsList.filter((st) => {
    const q = studentSearchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      st.nombre.toLowerCase().includes(q) ||
      (st.codigo && st.codigo.toLowerCase().includes(q)) ||
      (st.curso && st.curso.toLowerCase().includes(q))
    );
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      nombre: '',
      email: '',
      rol: 'estudiante_familia',
      selected_student_ids: []
    });
    setStudentSearchTerm('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    const existingStudentIds = user.linked_students.map(s => s.estudiante_id);
    if (existingStudentIds.length === 0 && user.estudiante_id) {
      existingStudentIds.push(user.estudiante_id);
    }
    setFormData({
      username: user.username,
      password: '',
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      selected_student_ids: existingStudentIds
    });
    setStudentSearchTerm('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      let userId = editingUser?.id;
      const studentIdsToSave = formData.rol === 'estudiante_familia' ? formData.selected_student_ids : [];
      const mainEstId = studentIdsToSave.length > 0 ? studentIdsToSave[0] : null;

      if (editingUser) {
        // Edit existing user
        if (formData.password.trim() !== '') {
          const passHash = await hashPassword(formData.password);
          await run(
            `UPDATE usuarios SET username = ?, password_hash = ?, nombre = ?, email = ?, rol = ?, estudiante_id = ? WHERE id = ?`,
            [formData.username, passHash, formData.nombre, formData.email, formData.rol, mainEstId, editingUser.id]
          );
        } else {
          await run(
            `UPDATE usuarios SET username = ?, nombre = ?, email = ?, rol = ?, estudiante_id = ? WHERE id = ?`,
            [formData.username, formData.nombre, formData.email, formData.rol, mainEstId, editingUser.id]
          );
        }
      } else {
        // Create new user
        if (!formData.password) {
          setFormError("La contraseña es requerida para un nuevo usuario.");
          return;
        }
        const passHash = await hashPassword(formData.password);
        await run(
          `INSERT INTO usuarios (username, password_hash, nombre, email, rol, estudiante_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [formData.username, passHash, formData.nombre, formData.email, formData.rol, mainEstId]
        );
        // Get inserted user id
        const createdUsers = query(`SELECT id FROM usuarios WHERE username = ?`, [formData.username]);
        if (createdUsers.length > 0) {
          userId = createdUsers[0].id;
        }
      }

      if (userId) {
        await setUserStudents(userId, studentIdsToSave);
      }

      setIsDialogOpen(false);
      loadData();
      refreshUser();
      
      if (editingUser) {
        toast.success('Usuario actualizado', {
          description: `${formData.nombre} fue modificado correctamente.`,
        });
      } else {
        toast.success('Usuario creado', {
          description: `${formData.nombre} fue registrado con éxito.`,
        });
      }
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('UNIQUE')) {
        setFormError("El nombre de usuario ya está registrado.");
        toast.error('Usuario duplicado', {
          description: 'Este nombre de usuario ya existe.',
        });
      } else {
        setFormError("Error al guardar el usuario.");
        toast.error('Error al guardar', {
          description: 'Intenta nuevamente.',
        });
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const userName = deletingUser.nombre;
      await run(`DELETE FROM usuarios WHERE id = ?`, [deletingUser.id]);
      await run(`DELETE FROM usuario_estudiantes WHERE usuario_id = ?`, [deletingUser.id]);
      setDeletingUser(null);
      loadData();
      refreshUser();
      toast.success('Usuario eliminado', {
        description: `${userName} fue removido del sistema.`,
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar', {
        description: 'No se pudo borrar el usuario.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-700" />
              <span>Gestión de Usuarios del Sistema</span>
            </CardTitle>
            <CardDescription>
              Alta, modificación y control de accesos por rol (Administración, Docente, Estudiante/Familia)
            </CardDescription>
          </div>
          <Button variant="primary" onClick={handleOpenAddModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, usuario o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="todos">Todos los roles</option>
              <option value="administracion">Administración</option>
              <option value="docente">Docente</option>
              <option value="estudiante_familia">Estudiante / Familia</option>
            </Select>
          </div>

          {/* Table of Users */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Alumnos Asignados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                    No se encontraron usuarios registrados con el filtro especificado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-slate-500">#{user.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{user.nombre}</TableCell>
                    <TableCell className="font-mono text-xs text-indigo-700 bg-indigo-50/60 px-2 py-1 rounded w-fit">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.rol}>{user.rol.replace('_', ' / ')}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.linked_students && user.linked_students.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.linked_students.map((st) => (
                            <Badge key={st.estudiante_id} variant="outline" className="text-[11px] font-normal bg-indigo-50/50 text-indigo-800 border-indigo-200">
                              {st.estudiante_nombre} ({st.estudiante_codigo || st.estudiante_curso})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(user)}
                        title="Editar datos de usuario"
                      >
                        <Edit3 className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                        title="Eliminar usuario"
                        className="hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog Modal */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingUser ? `Editar Usuario: ${editingUser.nombre}` : 'Registrar Nuevo Usuario'}
        description="Complete la información del usuario e indique sus permisos según su rol."
      >
        {formError && (
          <Alert variant="error" title="Error" className="mb-4">
            {formError}
          </Alert>
        )}
        <form onSubmit={handleSaveUser} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej. María Gutiérrez"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre de Usuario (Login)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="maria.gutierrez"
              required
            />

            <Input
              label={editingUser ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingUser}
            />
          </div>

          <Input
            label="Correo Electrónico Institucional"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="maria@sanmartin.edu.es"
            required
          />

          <Select
            label="Rol Institucional"
            value={formData.rol}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
          >
            <option value="estudiante_familia">Estudiante / Familia</option>
            <option value="docente">Docente</option>
            <option value="administracion">Administración</option>
          </Select>

          {formData.rol === 'estudiante_familia' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Vincular Estudiantes (Hijos a Cargo)
                </label>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  {formData.selected_student_ids.length} seleccionado(s)
                </span>
              </div>

              {/* Search input for students */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar estudiante por nombre o cédula / código..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-8 text-xs py-1.5"
                />
              </div>

              {/* Selected Badges Pill Box */}
              {formData.selected_student_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  {formData.selected_student_ids.map((id) => {
                    const st = studentsList.find((s) => s.id === id);
                    if (!st) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center space-x-1 bg-indigo-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-full shadow-xs"
                      >
                        <span>{st.nombre} ({st.codigo})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              selected_student_ids: formData.selected_student_ids.filter(stId => stId !== id)
                            });
                          }}
                          className="hover:bg-indigo-700 rounded-full p-0.5 transition-colors cursor-pointer"
                          title="Desvincular"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Filtered Checkbox List */}
              <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
                {filteredStudentsForSelection.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No se encontraron estudiantes con &quot;{studentSearchTerm}&quot;.
                  </p>
                ) : (
                  filteredStudentsForSelection.map((st) => {
                    const isChecked = formData.selected_student_ids.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between space-x-3 text-xs p-2 rounded transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  selected_student_ids: [...formData.selected_student_ids, st.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selected_student_ids: formData.selected_student_ids.filter(id => id !== st.id)
                                });
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="truncate">{st.nombre}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] shrink-0">
                          <span className="font-mono bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {st.codigo}
                          </span>
                          <span className="text-slate-400">
                            {st.curso} - {st.seccion}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Puede buscar por nombre o código / cédula para seleccionar múltiples estudiantes.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Confirmar Eliminación de Usuario"
        description="Esta acción eliminará la cuenta del usuario de la base de datos local SQLite."
      >
        <p className="text-xs text-slate-600 mb-4">
          ¿Está seguro/a de eliminar al usuario <strong>{deletingUser?.nombre}</strong> (<code>{deletingUser?.username}</code>)?
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={() => setDeletingUser(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser}>
            Confirmar Eliminación
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
