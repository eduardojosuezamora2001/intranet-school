import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { query, run, hashPassword } from '../services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input, Select } from '../components/ui/form-controls';
import { Alert } from '../components/ui/widgets';
import { Users, UserPlus, Edit3, Trash2, Search, ShieldAlert, Key } from 'lucide-react';

export function Usuarios() {
  const { isAdmin } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    email: '',
    rol: 'estudiante_familia',
    estudiante_id: ''
  });
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  function loadData() {
    const users = query(`
      SELECT u.*, e.nombre as estudiante_nombre, e.curso as estudiante_curso 
      FROM usuarios u 
      LEFT JOIN estudiantes e ON u.estudiante_id = e.id 
      ORDER BY u.id ASC
    `);
    setUsersList(users);

    const students = query(`SELECT * FROM estudiantes ORDER BY nombre ASC`);
    setStudentsList(students);
  }

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

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      nombre: '',
      email: '',
      rol: 'estudiante_familia',
      estudiante_id: ''
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      estudiante_id: user.estudiante_id || ''
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const estId = formData.rol === 'estudiante_familia' && formData.estudiante_id ? parseInt(formData.estudiante_id) : null;

      if (editingUser) {
        // Edit existing user
        if (formData.password.trim() !== '') {
          const passHash = await hashPassword(formData.password);
          await run(
            `UPDATE usuarios SET username = ?, password_hash = ?, nombre = ?, email = ?, rol = ?, estudiante_id = ? WHERE id = ?`,
            [formData.username, passHash, formData.nombre, formData.email, formData.rol, estId, editingUser.id]
          );
        } else {
          await run(
            `UPDATE usuarios SET username = ?, nombre = ?, email = ?, rol = ?, estudiante_id = ? WHERE id = ?`,
            [formData.username, formData.nombre, formData.email, formData.rol, estId, editingUser.id]
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
          [formData.username, passHash, formData.nombre, formData.email, formData.rol, estId]
        );
      }

      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('UNIQUE')) {
        setFormError("El nombre de usuario ya está registrado.");
      } else {
        setFormError("Error al guardar el usuario.");
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await run(`DELETE FROM usuarios WHERE id = ?`, [deletingUser.id]);
      setDeletingUser(null);
      loadData();
    } catch (err) {
      console.error(err);
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
                <TableHead>Alumno Asignado</TableHead>
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
                      {user.estudiante_nombre ? (
                        <span className="text-xs text-slate-700 font-medium">
                          {user.estudiante_nombre} <span className="text-slate-400">({user.estudiante_curso})</span>
                        </span>
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
            <Select
              label="Vincular a Estudiante"
              value={formData.estudiante_id}
              onChange={(e) => setFormData({ ...formData, estudiante_id: e.target.value })}
            >
              <option value="">-- Seleccionar Estudiante --</option>
              {studentsList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nombre} ({st.curso} - Sec {st.seccion})
                </option>
              ))}
            </Select>
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
