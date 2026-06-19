import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup if already authenticated
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // Log in action
  const login = async (email, password) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    if (response.data.success) {
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  // Register action
  const register = async (username, email, password, profilePic = '', bio = '') => {
    const response = await axiosInstance.post('/api/auth/register', {
      username,
      email,
      password,
      profilePic,
      bio,
    });
    if (response.data.success) {
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      return response.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  };

  // Update user info action
  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  // Log out action
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
