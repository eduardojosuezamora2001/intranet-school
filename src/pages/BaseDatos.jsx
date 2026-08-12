import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { query, exportSqliteFile, resetDatabaseToSeed } from '../services/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/form-controls';
import { Alert } from '../components/ui/widgets';
import { Database, Download, RefreshCw, HardDrive, ShieldAlert, Code2 } from 'lucide-react';

export function BaseDatos() {
  const { isAdmin } = useAuth();
  const [selectedTable, setSelectedTable] = useState('usuarios');
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadTableData(selectedTable);
    }
  }, [isAdmin, selectedTable]);

  function loadTableData(tableName) {
    try {
      const data = query(`SELECT * FROM ${tableName} LIMIT 50`);
      setTableData(data);
      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (!isAdmin) {
    return (
      <Alert variant="error" title="Acceso Restringido">
        Solo la **Administración** puede acceder a las herramientas de base de datos.
      </Alert>
    );
  }

  const handleReset = async () => {
    if (window.confirm("¿Está seguro de reiniciar la base de datos? Se restaurarán los datos demo originales.")) {
      setIsResetting(true);
      await resetDatabaseToSeed();
      setIsResetting(false);
      loadTableData(selectedTable);
      alert("Base de datos reiniciada con exito.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-700" />
              <span>Administración de Base de Datos SQLite (WASM)</span>
            </CardTitle>
            <CardDescription>
              Inspección directa de tablas localmente en el navegador e importación/exportación de binarios
            </CardDescription>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={exportSqliteFile}>
              <Download className="w-4 h-4 mr-2 text-indigo-600" />
              Exportar .sqlite
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
              Reiniciar Datos Seed
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="info" title="Arquitectura de Persistencia Client-Side">
            La base de datos SQLite se ejecuta mediante WebAssembly en la memoria de la pestaña activa. 
            Todas las mutaciones ejecutan un guardado automático en **IndexedDB**, garantizando que las modificaciones persistan incluso al recargar o cerrar el navegador.
          </Alert>

          {/* Table Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <HardDrive className="w-5 h-5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase">Seleccionar Tabla:</span>
              <Select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full sm:w-64"
              >
                <option value="usuarios">usuarios</option>
                <option value="estudiantes">estudiantes</option>
                <option value="calificaciones">calificaciones</option>
                <option value="asistencia">asistencia</option>
                <option value="comunicados">comunicados</option>
              </Select>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Registros mostrados: <strong className="text-slate-800">{tableData.length}</strong>
            </div>
          </div>

          {/* Raw Table Preview */}
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length || 1} className="text-center py-6 text-slate-500">
                    La tabla `{selectedTable}` está vacía.
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col} className="font-mono text-xs max-w-xs truncate">
                        {row[col] !== null ? String(row[col]) : <span className="text-slate-400 italic">NULL</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
