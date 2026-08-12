import React, { createContext, useContext, useState, useEffect } from 'react';
import { query, hashPassword, initDatabase } from '../services/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        setDbReady(true);
        const stored = sessionStorage.getItem('san_martin_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          // Verify user still exists in DB
          const users = query(`SELECT * FROM usuarios WHERE id = ?`, [userObj.id]);
          if (users.length > 0) {
            setCurrentUser(users[0]);
            if (users[0].estudiante_id) {
              loadStudent(users[0].estudiante_id);
            }
          } else {
            sessionStorage.removeItem('san_martin_user');
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

  function loadStudent(estudianteId) {
    if (!estudianteId) {
      setStudentInfo(null);
      return;
    }
    const res = query(`SELECT * FROM estudiantes WHERE id = ?`, [estudianteId]);
    if (res.length > 0) {
      setStudentInfo(res[0]);
    }
  }

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

    if (user.estudiante_id) {
      loadStudent(user.estudiante_id);
    } else {
      setStudentInfo(null);
    }

    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    setStudentInfo(null);
    sessionStorage.removeItem('san_martin_user');
  };

  const refreshUser = () => {
    if (!currentUser) return;
    const users = query(`SELECT * FROM usuarios WHERE id = ?`, [currentUser.id]);
    if (users.length > 0) {
      const u = users[0];
      setCurrentUser(u);
      sessionStorage.setItem('san_martin_user', JSON.stringify(u));
      if (u.estudiante_id) {
        loadStudent(u.estudiante_id);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        studentInfo,
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
