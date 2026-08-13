import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { query, run } from '../services/db';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input, Select, Textarea } from '../components/ui/form-controls';
import { Alert } from '../components/ui/widgets';
import { Megaphone, Plus, Pin, Trash2, Clock, User, Filter, CheckCircle2 } from 'lucide-react';

export function Comunicados() {
  const { currentUser, userRole, isAdmin, isDocente, isFamilia } = useAuth();
  const [comunicadosList, setComunicadosList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todas');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    categoria: 'General',
    destinatarios: 'Todos',
    fijado: false
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadComunicados();
  }, [userRole]);

  function loadComunicados() {
    let sql = `SELECT * FROM comunicados WHERE 1=1 `;

    // Role visibility filtering
    if (isFamilia) {
      sql += ` AND destinatarios IN ('Todos', 'Familias') `;
    } else if (isDocente) {
      sql += ` AND destinatarios IN ('Todos', 'Docentes') `;
    }

    sql += ` ORDER BY fijado DESC, id DESC`;
    const list = query(sql);
    setComunicadosList(list);
  }

  const filteredList = comunicadosList.filter((item) => {
    return selectedCategory === 'todas' || item.categoria.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleOpenAddModal = () => {
    setFormData({
      titulo: '',
      contenido: '',
      categoria: 'General',
      destinatarios: isDocente ? 'Familias' : 'Todos',
      fijado: false
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSaveComunicado = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      setFormError("El título y el contenido son obligatorios.");
      return;
    }

    try {
      await run(
        `INSERT INTO comunicados (titulo, contenido, categoria, destinatarios, autor_nombre, fijado) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          formData.titulo,
          formData.contenido,
          formData.categoria,
          formData.destinatarios,
          currentUser?.nombre || 'Dirección',
          formData.fijado ? 1 : 0
        ]
      );
      setIsDialogOpen(false);
      loadComunicados();
      toast.success('Comunicado publicado', {
        description: `"${formData.titulo}" fue enviado a ${formData.destinatarios}.`,
      });
    } catch (err) {
      console.error(err);
      setFormError("Error al publicar el comunicado.");
      toast.error('Error al publicar', {
        description: 'No se pudo guardar el comunicado. Intenta de nuevo.',
      });
    }
  };

  const handleTogglePin = async (item) => {
    try {
      const newPin = item.fijado === 1 ? 0 : 1;
      await run(`UPDATE comunicados SET fijado = ? WHERE id = ?`, [newPin, item.id]);
      loadComunicados();
      if (newPin === 1) {
        toast.success('Comunicado fijado', {
          description: 'Se mostró al inicio del tablón.',
        });
      } else {
        toast.info('Comunicado desanclado');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar', {
        description: 'No se pudo cambiar el estado de fijado.',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await run(`DELETE FROM comunicados WHERE id = ?`, [id]);
      loadComunicados();
      toast.success('Comunicado eliminado', {
        description: 'Se removió del tablón.',
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar', {
        description: 'No se pudo borrar el comunicado.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-indigo-700" />
              <span>Tablón Institucional de Comunicados</span>
            </CardTitle>
            <CardDescription>
              Canal de información oficial para familias, profesorado y equipo directivo
            </CardDescription>
          </div>

          {(isAdmin || isDocente) && (
            <Button variant="primary" onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Publicar Comunicado
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1" /> Categorías:
            </span>
            {['todas', 'general', 'académico', 'urgente', 'evento'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Comunicados List Cards */}
          <div className="space-y-4">
            {filteredList.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-sm">
                No hay comunicados publicados en esta categoría.
              </p>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-xl border transition-all ${
                    item.fijado === 1
                      ? 'border-amber-300 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {item.fijado === 1 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Pin className="w-3 h-3 mr-1 fill-amber-800" /> Destacado
                        </span>
                      )}
                      <Badge variant={item.categoria.toLowerCase()}>{item.categoria}</Badge>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Dirigido a: {item.destinatarios}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {(isAdmin || isDocente) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(item)}
                          title={item.fijado === 1 ? "Desfijar aviso" : "Fijar al inicio"}
                          className={item.fijado === 1 ? "text-amber-600 hover:text-amber-700" : "text-slate-400 hover:text-slate-600"}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar comunicado"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2">{item.titulo}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                    {item.contenido}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <span className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Emisor: <strong className="ml-1 text-slate-700 font-medium">{item.autor_nombre}</strong>
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {item.fecha}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Notice Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Publicar Nuevo Comunicado"
        description="Redacte el comunicado oficial e indique los destinatarios."
      >
        {formError && (
          <Alert variant="error" title="Error" className="mb-4">
            {formError}
          </Alert>
        )}

        <form onSubmit={handleSaveComunicado} className="space-y-4">
          <Input
            label="Título del Comunicado"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Ej. Recordatorio de Excursión Educativa"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoría"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Académico">Académico</option>
              <option value="Urgente">Urgente</option>
              <option value="Evento">Evento</option>
            </Select>

            <Select
              label="Destinatarios"
              value={formData.destinatarios}
              onChange={(e) => setFormData({ ...formData, destinatarios: e.target.value })}
            >
              <option value="Todos">Todos</option>
              <option value="Familias">Familias</option>
              <option value="Docentes">Docentes</option>
            </Select>
          </div>

          <Textarea
            label="Contenido del Mensaje"
            rows={5}
            value={formData.contenido}
            onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
            placeholder="Escriba aquí el detalle del comunicado..."
            required
          />

          <label className="flex items-center space-x-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.fijado}
              onChange={(e) => setFormData({ ...formData, fijado: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="text-xs font-semibold text-slate-700">Fijar al inicio del tablón (Aviso destacado)</span>
          </label>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Publicar Aviso
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
