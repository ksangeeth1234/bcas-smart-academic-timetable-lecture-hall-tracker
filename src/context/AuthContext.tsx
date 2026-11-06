import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { DataService } from '../services/dataService';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  canAccessLobbyTv: boolean;
  mustChangePassword: boolean;
  allUsers: UserProfile[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  createUser: (userData: { username: string; role: 'admin' | 'superadmin' | 'viewer'; displayName: string; email: string }) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string, active: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'bcas_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Listen to all users from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((d) => {
          usersList.push({ id: d.id, ...d.data() } as UserProfile);
        });
        setAllUsers(usersList);

        // Keep current user updated
        if (currentUser) {
          const matching = usersList.find((u) => u.username === currentUser.username);
          if (matching) {
            if (!matching.active) {
              // User deactivated, force logout
              logout();
            } else {
              setCurrentUser(matching);
              sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matching));
            }
          }
        }
      },
      (error) => {
        console.warn('Firestore users onSnapshot notice:', error.message);
      }
    );

    return () => unsub();
  }, [currentUser?.username]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedUser = username.trim().toLowerCase();
    
    // Check credentials against the bootstrap accounts & database
    // Superadmin bootstrap: superadmin / asdf@#123456
    // Admin bootstrap: admin / asdf@#1234
    // Viewer bootstrap (Lobby TV Display): viewer / asdf@#1234
    let validRole: 'superadmin' | 'admin' | 'viewer' | null = null;
    let initialPasswordUsed = false;

    if (trimmedUser === 'superadmin' && password === 'asdf@#123456') {
      validRole = 'superadmin';
      initialPasswordUsed = true;
    } else if (trimmedUser === 'admin' && password === 'asdf@#1234') {
      validRole = 'admin';
      initialPasswordUsed = true;
    } else if (trimmedUser === 'viewer' && password === 'asdf@#1234') {
      validRole = 'viewer';
      initialPasswordUsed = false;
    } else {
      // Check stored custom password in Firestore user record
      try {
        const userDoc = await getDoc(doc(db, 'users', trimmedUser));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.customPassword && data.customPassword === password) {
            validRole = data.role as 'superadmin' | 'admin' | 'viewer';
          }
        }
      } catch (err) {
        console.warn('Error verifying custom password:', err);
      }
    }

    if (!validRole) {
      return { success: false, error: 'Invalid username or password. Please verify credentials.' };
    }

    try {
      // Fetch user profile from Firestore or construct default
      const userDocRef = doc(db, 'users', trimmedUser);
      const userDoc = await getDoc(userDocRef);
      
      let profile: UserProfile;
      if (userDoc.exists()) {
        profile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        if (!profile.active) {
          return { success: false, error: 'This account has been deactivated. Contact the Super Administrator.' };
        }
      } else {
        const displayName =
          validRole === 'superadmin'
            ? 'Super Administrator'
            : validRole === 'viewer'
            ? 'Lobby Display Viewer'
            : 'Timetable Administrator';

        profile = {
          id: trimmedUser,
          username: trimmedUser,
          email: `${trimmedUser}@bcas.campus.lk`,
          role: validRole,
          displayName,
          active: true,
          mustChangePassword: validRole === 'viewer' ? false : initialPasswordUsed,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profile);
      }

      // If initial password was used, enforce mustChangePassword
      if (initialPasswordUsed && profile.mustChangePassword === undefined) {
        profile.mustChangePassword = true;
      }

      await updateDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
      });

      setCurrentUser(profile);
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));

      await DataService.logActivity(
        profile.username,
        profile.role,
        'User Login',
        'User',
        profile.id,
        `${profile.displayName} (${profile.username}) logged in successfully.`
      );

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    if (currentUser) {
      DataService.logActivity(
        currentUser.username,
        currentUser.role,
        'User Logout',
        'User',
        currentUser.id,
        `${currentUser.displayName} signed out.`
      );
    }
    setCurrentUser(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const userDocRef = doc(db, 'users', currentUser.username);
      await updateDoc(userDocRef, {
        customPassword: newPassword,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      });

      const updated = { ...currentUser, mustChangePassword: false };
      setCurrentUser(updated);
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

      await DataService.logActivity(
        currentUser.username,
        currentUser.role,
        'Password Changed',
        'User',
        currentUser.id,
        `Account password was updated successfully.`
      );

      return true;
    } catch (err) {
      console.error('Failed to update password:', err);
      return false;
    }
  };

  const createUser = async (userData: {
    username: string;
    role: 'admin' | 'superadmin' | 'viewer';
    displayName: string;
    email: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'superadmin') {
      return { success: false, error: 'Only Super Administrators can create accounts.' };
    }

    const cleanUsername = userData.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Username cannot be empty.' };
    }

    try {
      const existingDoc = await getDoc(doc(db, 'users', cleanUsername));
      if (existingDoc.exists()) {
        return { success: false, error: 'Username already exists.' };
      }

      const defaultPass =
        cleanUsername === 'superadmin' ? 'asdf@#123456' : 'asdf@#1234';

      const newUser: UserProfile & { customPassword?: string } = {
        id: cleanUsername,
        username: cleanUsername,
        displayName: userData.displayName || cleanUsername,
        email: userData.email || `${cleanUsername}@bcas.campus.lk`,
        role: userData.role,
        active: true,
        mustChangePassword: userData.role !== 'viewer',
        customPassword: defaultPass,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cleanUsername), newUser);

      await DataService.logActivity(
        currentUser.username,
        currentUser.role,
        'Create Account',
        'User',
        cleanUsername,
        `Created new ${userData.role} account for ${cleanUsername} (${userData.displayName})`
      );

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      return { success: false, error: msg };
    }
  };

  const toggleUserStatus = async (userId: string, active: boolean) => {
    if (currentUser?.role !== 'superadmin') return;
    if (userId === 'superadmin') return; // Cannot deactivate primary superadmin

    try {
      await updateDoc(doc(db, 'users', userId), {
        active,
        updatedAt: new Date().toISOString(),
      });

      await DataService.logActivity(
        currentUser.username,
        currentUser.role,
        active ? 'Activate User' : 'Deactivate User',
        'User',
        userId,
        `${active ? 'Activated' : 'Deactivated'} user account: ${userId}`
      );
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.role !== 'superadmin') return;
    if (userId === 'superadmin') return; // Primary superadmin cannot be deleted

    try {
      await deleteDoc(doc(db, 'users', userId));
      await DataService.logActivity(
        currentUser.username,
        currentUser.role,
        'Delete User',
        'User',
        userId,
        `Deleted user account: ${userId}`
      );
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const resetUserPassword = async (userId: string) => {
    if (currentUser?.role !== 'superadmin') return;
    try {
      const defaultPass = userId === 'superadmin' ? 'asdf@#123456' : 'asdf@#1234';
      await updateDoc(doc(db, 'users', userId), {
        customPassword: defaultPass,
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
      });

      await DataService.logActivity(
        currentUser.username,
        currentUser.role,
        'Reset Password',
        'User',
        userId,
        `Reset password for ${userId} to default bootstrap credentials.`
      );
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const role: UserRole = currentUser ? currentUser.role : 'guest';
  const isAuthenticated = !!currentUser;
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;
  const isViewer = currentUser?.role === 'viewer';
  const canAccessLobbyTv = isViewer || isAdmin;
  const mustChangePassword = !!currentUser?.mustChangePassword;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        isViewer,
        canAccessLobbyTv,
        mustChangePassword,
        allUsers,
        login,
        logout,
        updatePassword,
        createUser,
        toggleUserStatus,
        deleteUser,
        resetUserPassword,
      }}
    >
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
