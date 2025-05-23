'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { loginUser, LoginResponse } from '@/lib/apiService'; 
import { useAuth } from '@/contexts/AuthContext'; 
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { login, authToken, isLoading: authIsLoading, authUser } = useAuth(); 

  useEffect(() => {
    if (!authIsLoading && authToken && authUser) {
      router.push('/dashboard');
    }
  }, [authToken, authIsLoading, authUser, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!username || !password) {
      setError('Korisničko ime i lozinka su obavezni.');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
        setError('Korisničko ime mora imati bar 3 karaktera.');
        setLoading(false);
        return;
    }
    if (password.length < 6) {
        setError('Lozinka mora imati bar 6 karaktera.');
        setLoading(false);
        return;
    }

    try {
      const data: LoginResponse = await loginUser({ username, password });
      login(data); 
    } catch (err: any) {
      console.error('Login page error:', err);
      setError(err.message || 'Došlo je do greške prilikom prijave.');
    } finally {
      setLoading(false);
    }
  };

  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#363636] via-[#000000] to-[#363636] flex items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 px-8 py-6 shadow-xl"
        >
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-[#E60026] mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xl font-medium">Učitavanje...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#363636] via-[#000000] to-[#363636] flex items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 p-8 shadow-xl max-w-md w-full z-10"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#363636] to-black p-1 flex items-center justify-center shadow-lg"
            >
              <div className="text-[#E60026] font-bold text-xl">AVIO</div>
            </motion.div>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Dobrodošli nazad</h2>
            <p className="text-white/70 mt-2">Prijavite se da nastavite</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#363636] via-[#000000] to-[#363636] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-64 h-64 bg-[#E60026]/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 15, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-[#800014]/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 20, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#B3001F]/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 10, 
            ease: "easeInOut" 
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-8 md:p-10 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative z-10"
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4">
          <Link href="/">
            <motion.div 
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </motion.div>
          </Link>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 mb-2">
          Admin Prijava
        </h1>
        <p className="text-white/70 text-center mb-8">
          Prijavite se za pristup admin panelu
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-white/90 mb-1"
            >
              Korisničko ime
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/60 group-focus-within:text-[#E60026] transition-colors duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <motion.input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="block w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#E60026]/50 focus:border-[#B3001F] text-white transition-all duration-200"
                placeholder="korisnicko.ime"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-white/90 mb-1"
            >
              Lozinka
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/60 group-focus-within:text-[#E60026] transition-colors duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <motion.input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#E60026]/50 focus:border-[#B3001F] text-white transition-all duration-200"
                placeholder="*******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#E60026] focus:ring-[#E60026]/50 focus:ring-offset-0"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-white/70">
              Zapamti me
            </label>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-[#E60026]/20 backdrop-blur-sm border border-[#E60026]/30 text-white px-4 py-3 rounded-xl relative" 
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-[#E60026]">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-[#E60026] to-[#4D000A] hover:from-[#B3001F] hover:to-[#800014] focus:outline-none focus:ring-2 focus:ring-[#E60026]/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Prijava u toku...
                </div>
              ) : "Prijavi se"}
            </motion.button>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Link href="/" className="text-sm text-white/60 hover:text-white hover:text-[#E60026] transition-colors duration-200 flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              Natrag na početnu
            </Link>
            <Link href="/reset-password" className="text-sm text-white/60 hover:text-[#E60026] transition-colors duration-200">
              Zaboravljena lozinka?
            </Link>
          </div>
        </form>
      </motion.div>

      <motion.footer 
        className="mt-12 text-center text-sm text-white/60 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex justify-center space-x-4 mb-2">
          <select 
            className="bg-white/5 text-white/70 text-xs rounded-lg border border-white/10 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#E60026]/30"
            defaultValue="bs"
          >
            <option value="bs">Bosanski</option>
            <option value="en">English</option>
          </select>
        </div>
        <p>&copy; {new Date().getFullYear()} AvioServis. Sva prava zadržana.</p>
        <p className="text-xs text-white/40 mt-1">v1.2.0</p>
      </motion.footer>
    </div>
  );
}
