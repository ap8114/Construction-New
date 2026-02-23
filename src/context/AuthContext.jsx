import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import locationTracker from '../utils/LocationTracker';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();

  const refreshPermissions = async (currentUser) => {
    try {
      const permRes = await api.get('/roles/my-permissions');
      const updatedUser = {
        ...currentUser,
        permissions: permRes.data.permissions || []
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Permissions refreshed real-time');
    } catch (error) {
      console.error('Failed to refresh permissions real-time:', error);
    }
  };

  useEffect(() => {
    // Socket for real-time permission updates
    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');
    socketRef.current = io(socketUrl);

    socketRef.current.on('permissions_updated', (data) => {
      // Use functional state update to get most recent user
      setUser(prev => {
        if (prev && prev.role === data.role) {
          refreshPermissions(prev);
        }
        return prev;
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    // Check for stored token/user on load
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          // Verify/Refresh permissions on load
          const permRes = await api.get('/roles/my-permissions');
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = {
            ...parsedUser,
            permissions: permRes.data.permissions || []
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Start location tracking
          locationTracker.init(updatedUser);
        } catch (error) {
          console.error('Failed to refresh permissions:', error);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          locationTracker.init(parsedUser);
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      locationTracker.stopTracking();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;

      // Fetch actual permissions from DB
      localStorage.setItem('token', userData.token); // Set token first for the next API call

      let permissions = [];
      try {
        const permRes = await api.get('/roles/my-permissions');
        permissions = permRes.data.permissions || [];
      } catch (e) {
        console.error('Failed to fetch permissions during login:', e);
      }

      const userWithPerms = {
        ...userData,
        permissions
      };

      setUser(userWithPerms);
      localStorage.setItem('user', JSON.stringify(userWithPerms));

      // Start location tracking on login
      locationTracker.init(userWithPerms);

      return userWithPerms;
    } catch (error) {
      console.error('Login Error:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    locationTracker.stopTracking();
  };

  const updateUserData = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
