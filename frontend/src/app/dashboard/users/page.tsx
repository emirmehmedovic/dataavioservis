'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { getUsers, deleteUser } from '@/lib/apiService';
import withAuth from '@/components/auth/withAuth';
import AddUserModal from '@/components/users/AddUserModal';
import { FiPlus, FiEdit, FiTrash2, FiLoader, FiEye } from 'react-icons/fi'; // Keeping these, common icons
import { FaUserAlt, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa'; // FaUserCog not used, FaExclamationTriangle not used directly
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button'; // Assuming this Button uses theme colors
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'; // For potential future use or consistency

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Neuspješno dohvatanje korisnika.'); // Corrected spelling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      setDeletingUserId(userId);
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast.success('Korisnik uspešno obrisan.');
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Neuspešno brisanje korisnika.');
      } finally {
        setDeletingUserId(null);
      }
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    // Using theme colors for badges. Gradients are preserved as they are specific.
    // Consider if these gradients should be defined in theme or if plain colors are preferred for badges.
    // If plain, use bg-primary, bg-secondary, bg-destructive, etc.
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-gradient-to-r from-primary to-red-600 text-primary-foreground'; // Primary is red
      case UserRole.SERVICER:
        return 'bg-gradient-to-r from-secondary to-blue-600 text-secondary-foreground'; // Secondary is blue
      case UserRole.FUEL_OPERATOR:
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'; // Keep green for fuel ops
      case UserRole.KONTROLA:
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'; // Keep purple
      case UserRole.CARINA:
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'; // Keep amber/yellow
      case UserRole.AERODROM:
        return 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white'; // Keep sky/cyan
      default:
        return 'bg-gradient-to-r from-muted to-slate-500 text-muted-foreground'; // Muted for default
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-150px)] bg-background text-foreground">
        <motion.div 
          className="h-16 w-16 rounded-full border-t-4 border-b-4 border-secondary" // Use secondary for loader
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-lg font-medium text-muted-foreground mt-4 bg-clip-text text-transparent bg-gradient-to-r from-secondary to-avioBlue-600">
          Učitavanje korisnika...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 p-4 md:p-6 bg-background text-foreground" // Ensure base bg and text colors
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section - Glassmorphism kept */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl p-6">
        {/* Decorative blurs - adjusted colors to theme */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-avioBlue-400/20 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-avioBlue-600" // Themed gradient
            >
              Upravljanje Korisnicima
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-1">Dodajte ili upravljajte korisnicima sistema</p>
          </div>
          <Button 
            variant="default" // This should use bg-primary from your Button.tsx
            onClick={() => setIsAddUserModalOpen(true)}
            // className="shadow-md" // Shadow can be part of the default variant in Button.tsx
          >
            <FiPlus className="mr-2" /> {/* Icon color should be handled by text-primary-foreground */}
            Dodaj Novog Korisnika
          </Button>
        </div>
      </div>

      {/* Users List - Glassmorphism kept */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl">
        {/* Decorative blurs - adjusted colors to theme */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/15 rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-avioBlue-400/15 rounded-full filter blur-3xl opacity-5 translate-y-1/2 -translate-x-1/4"></div>
        
        {loading && users.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <motion.div 
              className="h-6 w-6 rounded-full border-t-2 border-b-2 border-secondary" // Themed loader
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
        
        <div className="relative z-10">
          {users.length === 0 && !loading ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-secondary/20 to-avioBlue-500/20 rounded-full flex items-center justify-center mb-4">
                <FaUserAlt className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-secondary to-avioBlue-600">
                Nema pronađenih korisnika
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-2">
                Dodajte prvog korisnika klikom na dugme iznad.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {/* Table header styles from global.css should apply if using <TableHead> from ui/Table.tsx */}
                  {/* If not, apply text-muted-foreground and border-border */}
                  <tr className="text-left border-b border-border"> {/* Use border-border */}
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Korisničko ime</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Uloga</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kreiran</th>
                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr 
                      key={user.id} 
                      // hover:bg-muted/50 for table rows, border-border for row borders
                      className="border-b border-border hover:bg-muted/50 transition-colors duration-200" 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {/* Using themed icon background and color */}
                          <div className="p-2 bg-secondary/10 rounded-lg mr-3">
                            <FaUserAlt className="text-secondary" /> 
                          </div>
                          <span className="font-medium text-foreground">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)} shadow-sm`}>
                            {user.role === UserRole.ADMIN ? 'Administrator' : 
                             user.role === UserRole.SERVICER ? 'Serviser' : 
                             user.role === UserRole.FUEL_OPERATOR ? 'Operater Goriva' :
                             user.role === UserRole.KONTROLA ? 'Kontrola' :
                             user.role === UserRole.CARINA ? 'Carina' :
                             user.role === UserRole.AERODROM ? 'Aerodrom' : user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-muted-foreground/70" /> {/* Slightly muted icon */}
                          <span className="text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Action buttons should use variants from Button.tsx for consistency */}
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-secondary-foreground" // Ghost hover should use accent by default
                            // onClick={() => { /* TODO: Open view user modal */ }}
                            disabled
                            aria-label="Pregledaj Korisnika"
                          >
                            <FiEye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-yellow-500 hover:text-yellow-600" // Keep specific color for edit if desired
                            // Or make it secondary: className="h-8 w-8 text-secondary hover:text-secondary-foreground"
                            // onClick={() => { /* TODO: Open edit user modal */ }}
                            disabled
                            aria-label="Izmeni Korisnika"
                          >
                            <FiEdit size={16} />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive-foreground" // Destructive action
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            aria-label="Obriši Korisnika"
                          >
                            {deletingUserId === user.id ? (
                              <motion.div 
                                animate={{ rotate: 360 }} 
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <FiLoader size={16} className="text-destructive" /> {/* Ensure loader is also destructive color */}
                              </motion.div>
                            ) : (
                              <FiTrash2 size={16} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddUserModal 
        isOpen={isAddUserModalOpen} 
        onClose={() => setIsAddUserModalOpen(false)} 
        onUserAdded={() => {
          fetchUsers();
          setIsAddUserModalOpen(false);
        }}
        // Ensure AddUserModal is also themed, if it's a custom component
      />
    </motion.div>
  );
};

export default withAuth(UserManagementPage, [UserRole.ADMIN]);