import React, { createContext, useContext, useState, useEffect } from 'react';
import { query, hashPassword, initDatabase, getUserStudents } from '../services/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentIdState] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const loadUserStudents = (user) => {
    if (!user) {
      setLinkedStudents([]);
      setStudentInfo(null);
      setSelectedStudentIdState(null);
      return;
    }

    let students = getUserStudents(user.id);
    // Fallback to user.estudiante_id if user_estudiantes table had no rows
    if (students.length === 0 && user.estudiante_id) {
      const res = query(`SELECT * FROM estudiantes WHERE id = ?`, [user.estudiante_id]);
      if (res.length > 0) {
        students = [res[0]];
      }
    }

    setLinkedStudents(students);

    if (students.length > 0) {
      const savedStudentId = sessionStorage.getItem('san_martin_active_student_id');
      const found = savedStudentId ? students.find(s => s.id === parseInt(savedStudentId)) : null;
      const active = found || students[0];
      setSelectedStudentIdState(active.id);
      setStudentInfo(active);
      sessionStorage.setItem('san_martin_active_student_id', active.id.toString());
    } else {
      setSelectedStudentIdState(null);
      setStudentInfo(null);
      sessionStorage.removeItem('san_martin_active_student_id');
    }
  };

  const setSelectedStudentId = (id) => {
    const numId = parseInt(id);
    const found = linkedStudents.find(s => s.id === numId);
    if (found) {
      setSelectedStudentIdState(numId);
      setStudentInfo(found);
      sessionStorage.setItem('san_martin_active_student_id', numId.toString());
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        setDbReady(true);
        const stored = sessionStorage.getItem('san_martin_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          const users = query(`SELECT * FROM usuarios WHERE id = ?`, [userObj.id]);
          if (users.length > 0) {
            setCurrentUser(users[0]);
            loadUserStudents(users[0]);
          } else {
            sessionStorage.removeItem('san_martin_user');
            sessionStorage.removeItem('san_martin_active_student_id');
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    }
    prepare();
  }, []);

  const login = async (username, password) => {
    if (!dbReady) await initDatabase();

    const hashed = await hashPassword(password);
    const users = query(
      `SELECT * FROM usuarios WHERE username = ? AND password_hash = ?`,
      [username, hashed]
    );

    if (users.length === 0) {
      throw new Error("Usuario o contraseña incorrectos");
    }

    const user = users[0];
    setCurrentUser(user);
    sessionStorage.setItem('san_martin_user', JSON.stringify(user));
    loadUserStudents(user);

    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    setLinkedStudents([]);
    setStudentInfo(null);
    setSelectedStudentIdState(null);
    sessionStorage.removeItem('san_martin_user');
    sessionStorage.removeItem('san_martin_active_student_id');
  };

  const refreshUser = () => {
    if (!currentUser) return;
    const users = query(`SELECT * FROM usuarios WHERE id = ?`, [currentUser.id]);
    if (users.length > 0) {
      const u = users[0];
      setCurrentUser(u);
      sessionStorage.setItem('san_martin_user', JSON.stringify(u));
      loadUserStudents(u);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        studentInfo,
        linkedStudents,
        selectedStudentId,
        setSelectedStudentId,
        loading,
        dbReady,
        login,
        logout,
        refreshUser,
        userRole: currentUser?.rol || null,
        isAdmin: currentUser?.rol === 'administracion',
        isDocente: currentUser?.rol === 'docente',
        isFamilia: currentUser?.rol === 'estudiante_familia'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
