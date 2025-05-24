'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { loginUser, LoginResponse } from '@/lib/apiService'; 
import { useAuth } from '@/contexts/AuthContext'; 
import { motion } from 'framer-motion';
import Link from 'next/link';

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
      <div className="min-h-screen hope-gradient flex items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 px-8 py-6 shadow-xl"
        >
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div className="min-h-screen hope-gradient flex items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 px-10 py-8 shadow-xl max-w-md"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <motion.div 
                className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Već ste prijavljeni</h2>
            <p className="text-white/80 mb-6">Preusmjeravanje na dashboard...</p>
            <motion.div 
              className="w-full h-2 bg-white/10 rounded-full overflow-hidden" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div 
                className="h-2 bg-gradient-to-r from-green-400 to-blue-500" 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hope-gradient text-white flex flex-col justify-center items-center p-4 relative">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/15 rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full filter blur-[100px]"></div>
        <motion.div 
          className="absolute -top-20 -right-20 w-80 h-80 border border-white/10 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 border border-white/5 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
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
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Korisničko ime
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
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
                className="block w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white"
                placeholder="npr. admin"
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
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Lozinka
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
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
                className="block w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white"
                placeholder="*******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
          </div>

          {error && (
            <motion.div 
              className="bg-red-500/20 backdrop-blur-sm border border-red-500/20 text-white px-4 py-3 rounded-xl relative" 
              role="alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
            <Link href="/" className="text-sm text-white/60 hover:text-white flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              Natrag na početnu
            </Link>
            <Link href="/reset-password" className="text-sm text-white/60 hover:text-white">
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
        <p>&copy; {new Date().getFullYear()} AvioServis. Sva prava zadržana.</p>
      </motion.footer>
    </div>
  );
}
