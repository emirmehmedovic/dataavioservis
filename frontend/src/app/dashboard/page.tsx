'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataDisplay, DataGrid } from '@/components/ui/DataDisplay';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/Table';
import { motion } from 'framer-motion';
import { 
  Car, 
  Users, 
  Building2, 
  MapPin, 
  AlertTriangle, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Clock,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { title: 'Ukupno vozila', value: '24', icon: <Car size={20} />, trend: { value: 12, isPositive: true } },
    { title: 'Aktivni korisnici', value: '8', icon: <Users size={20} /> },
    { title: 'Partnerske firme', value: '5', icon: <Building2 size={20} /> },
    { title: 'Lokacije', value: '3', icon: <MapPin size={20} /> },
  ];

  const upcomingEvents = [
    { id: 1, type: 'Servis', vehicle: 'Mercedes Sprinter', date: '18.05.2025', status: 'Zakazano' },
    { id: 2, type: 'Registracija', vehicle: 'BMW X5', date: '22.05.2025', status: 'Uskoro' },
    { id: 3, type: 'Inspekcija', vehicle: 'Audi A6', date: '01.06.2025', status: 'Zakazano' },
  ];

  const alerts = [
    { id: 1, title: 'Ističe registracija', description: 'BMW X5 - registracija ističe za 7 dana', severity: 'high' },
    { id: 2, title: 'Potreban servis', description: 'Mercedes Sprinter - 2000km do redovnog servisa', severity: 'medium' },
    { id: 3, title: 'Inspekcija zakazana', description: 'Audi A6 - inspekcija zakazana za 01.06.2025', severity: 'low' },
  ];

  const recentActivities = [
    { id: 1, action: 'Dodano vozilo', user: 'admin', timestamp: 'Prije 2 sata', details: 'Dodano novo vozilo: Audi A6' },
    { id: 2, action: 'Ažuriran servis', user: 'marko', timestamp: 'Prije 1 dan', details: 'Ažuriran servisni zapis za Mercedes Sprinter' },
    { id: 3, action: 'Dodana slika', user: 'admin', timestamp: 'Prije 2 dana', details: 'Dodana nova slika za BMW X5' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <motion.div 
          className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  // Define animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome section */}
      <motion.div variants={itemVariants}>
        <Card className="border border-white/10 overflow-hidden backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 z-0"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 relative z-10">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Dobrodošli na AvioServis Dashboard
                </h1>
                <p className="text-muted-foreground">Pregled ključnih informacija i aktivnosti u sistemu</p>
              </div>
              <div className="flex space-x-3">
                <Link href="/dashboard/vehicles/new">
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-white/20 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                    <Car size={16} /> Dodaj vozilo
                  </Button>
                </Link>
                <Link href="/dashboard/users/new">
                  <Button className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2">
                    <Users size={16} /> Dodaj korisnika
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats section */}
      <motion.div variants={itemVariants}>
        <DataGrid>
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.title}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="transform transition-all duration-300"
            >
              <DataDisplay 
                title={stat.title} 
                value={stat.value} 
                icon={stat.icon} 
                trend={stat.trend}
                className="backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 border border-white/10 shadow-md hover:shadow-lg transition-all duration-300"
              />
            </motion.div>
          ))}
        </DataGrid>
      </motion.div>

      {/* Main content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Upcoming events */}
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <Card className="border border-white/10 overflow-hidden backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg">
            <CardHeader className="pb-3 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full filter blur-3xl opacity-5"></div>
              <div className="flex items-center justify-between relative z-10">
                <CardTitle className="text-lg font-medium flex items-center">
                  <div className="flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 mr-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Nadolazeći događaji
                  </span>
                </CardTitle>
                <Link href="/dashboard/events">
                  <Button className="text-sm bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 flex items-center gap-1 transition-all duration-300">
                    Vidi sve <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="rounded-xl overflow-hidden backdrop-blur-md border border-white/10">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                    <TableRow>
                      <TableHead>Tip</TableHead>
                      <TableHead>Vozilo</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingEvents.map((event, index) => (
                      <TableRow key={event.id} className="hover:bg-white/5 transition-colors duration-200">
                        <TableCell>{event.type}</TableCell>
                        <TableCell className="font-medium">{event.vehicle}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                            event.status === 'Zakazano' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' :
                            event.status === 'Uskoro' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' :
                            'bg-green-500/20 text-green-600 border border-green-500/30'
                          }`}>
                            {event.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column - Alerts */}
        <motion.div variants={itemVariants}>
          <Card className="border border-white/10 overflow-hidden backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg">
            <CardHeader className="pb-3 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 rounded-full filter blur-3xl opacity-5"></div>
              <CardTitle className="text-lg font-medium flex items-center">
                <div className="flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 mr-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-600">
                  Upozorenja i obavijesti
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <motion.div 
                    key={alert.id} 
                    className={`p-4 rounded-xl backdrop-blur-sm border ${
                      alert.severity === 'high' ? 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-500/5' : 
                      alert.severity === 'medium' ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5' : 
                      'border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-blue-500/5'
                    }`}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  >
                    <h3 className={`font-semibold mb-1 ${
                      alert.severity === 'high' ? 'text-red-600' : 
                      alert.severity === 'medium' ? 'text-amber-600' : 
                      'text-blue-600'
                    }`}>{alert.title}</h3>
                    <p className="text-sm">{alert.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity section */}
      <motion.div variants={itemVariants}>
        <Card className="border border-white/10 overflow-hidden backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg">
          <CardHeader className="pb-3 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full filter blur-3xl opacity-5"></div>
            <CardTitle className="text-lg font-medium flex items-center">
              <div className="flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 mr-3">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                Nedavne aktivnosti
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div 
                  key={activity.id} 
                  className="flex items-start pb-4 border-b border-white/10 last:border-0 last:pb-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mr-3 border border-white/10">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-purple-600">{activity.action}</h4>
                      <span className="text-xs bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                      Korisnik: {activity.user}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className="text-center text-sm text-muted-foreground py-6"
        variants={itemVariants}
      >
        <p className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inline-block">
          © 2025 AvioServis. Sva prava pridržana.
        </p>
      </motion.footer>
    </motion.div>
  );
}
