'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { getUsers, deleteUser } from '@/lib/apiService';
import withAuth from '@/components/auth/withAuth';
import AddUserModal from '@/components/users/AddUserModal';
import { FiPlus, FiEdit, FiTrash2, FiLoader, FiEye } from 'react-icons/fi';
import { FaUserAlt, FaUserCog, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

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
      toast.error('Failed to fetch users.');
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
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case UserRole.SERVICER:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case UserRole.FUEL_OPERATOR:
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case UserRole.KONTROLA:
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white';
      case UserRole.CARINA:
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
      case UserRole.AERODROM:
        return 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-150px)]">
        <motion.div 
          className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-lg font-medium text-muted-foreground mt-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Učitavanje korisnika...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Upravljanje Korisnicima
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-1">Dodajte ili upravljajte korisnicima sistema</p>
          </div>
          <Button 
            variant="default" 
            onClick={() => setIsAddUserModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
          >
            <FiPlus className="mr-2" />
            Dodaj Novog Korisnika
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-5 translate-y-1/2 -translate-x-1/4"></div>
        
        {loading && users.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <motion.div 
              className="h-6 w-6 rounded-full border-t-2 border-b-2 border-blue-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
        
        <div className="relative z-10">
          {users.length === 0 && !loading ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                <FaUserAlt className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
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
                  <tr className="text-left border-b border-white/10">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Korisničko ime</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Uloga</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Kreiran</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr 
                      key={user.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                            <FaUserAlt className="text-blue-500/80" />
                          </div>
                          <span className="font-medium text-gray-700">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)} shadow-sm`}>
                            {user.role === 'ADMIN' ? 'Administrator' : 
                             user.role === 'SERVICER' ? 'Serviser' : 
                             user.role === 'FUEL_OPERATOR' ? 'Operater Goriva' :
                             user.role === 'KONTROLA' ? 'Kontrola' :
                             user.role === 'CARINA' ? 'Carina' :
                             user.role === 'AERODROM' ? 'Aerodrom' : user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span className="text-gray-600">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 border border-white/10 hover:bg-blue-500/10"
                            // onClick={() => { /* TODO: Open view user modal */ }}
                            disabled
                            aria-label="Pregledaj Korisnika"
                          >
                            <FiEye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-yellow-500 hover:text-yellow-600 border border-white/10 hover:bg-yellow-500/10"
                            // onClick={() => { /* TODO: Open edit user modal */ }}
                            disabled
                            aria-label="Izmeni Korisnika"
                          >
                            <FiEdit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 border border-white/10 hover:bg-red-500/10"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            aria-label="Obriši Korisnika"
                          >
                            {deletingUserId === user.id ? (
                              <motion.div 
                                animate={{ rotate: 360 }} 
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <FiLoader size={16} />
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
      />
    </motion.div>
  );
};

export default withAuth(UserManagementPage, [UserRole.ADMIN]);
