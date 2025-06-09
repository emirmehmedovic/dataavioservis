import { PrismaClient, Role, FixedTankStatus, VehicleStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random float between min and max
function randomFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper function to generate random date in a specific month of 2025
function randomDateInMonth(month: number) {
  // Generate a random date in the specified month of 2025
  // Month is 0-based (0 = January, 1 = February, etc.)
  const daysInMonth = new Date(2025, month + 1, 0).getDate(); // Get number of days in the month
  const day = Math.floor(Math.random() * daysInMonth) + 1; // 1-daysInMonth
  const hour = Math.floor(Math.random() * 24); // 0-23
  const minute = Math.floor(Math.random() * 60); // 0-59
  
  return new Date(2025, month, day, hour, minute);
}

// Helper function for January 2025 (for backward compatibility)
function randomJanuaryDate() {
  return randomDateInMonth(0); // January is month 0
}

// Helper function to generate random flight number
function generateRandomFlightNumber() {
  const airlines = ['JA', 'LH', 'TK', 'FB', 'EK', 'BA', 'OS', 'SU', 'LX'];
  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const number = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  
  return `${airline}${number}`;
}

// Helper function to generate random destination
function generateRandomDestination() {
  const destinations = [
    'Vienna', 'Istanbul', 'Munich', 'Zurich', 'Dubai', 'Frankfurt', 
    'Belgrade', 'Zagreb', 'London', 'Paris', 'Amsterdam', 'Rome', 'Madrid'
  ];
  
  return destinations[Math.floor(Math.random() * destinations.length)];
}

async function main() {
  console.log('Starting seed script...');

  // 1. Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('Seeded admin user:', { username: admin.username, password: 'admin123' });

  // Create fuel operator user
  const operatorPasswordHash = await bcrypt.hash('operator123', 10);
  const operator = await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      passwordHash: operatorPasswordHash,
      role: 'FUEL_OPERATOR',
    },
  });
  console.log('Seeded operator user:', { username: operator.username, password: 'operator123' });

  // 2. Create airlines with destinations
  const airlines = [
    {
      name: 'Air Bosnia',
      isForeign: false,
      address: 'Sarajevo International Airport, Kurta Schorka 36',
      taxId: 'BA123456789',
      operatingDestinations: ['Vienna', 'Istanbul', 'Munich', 'Zurich', 'Dubai']
    },
    {
      name: 'Lufthansa',
      isForeign: true,
      address: 'Frankfurt Airport, 60547 Frankfurt am Main, Germany',
      taxId: 'DE987654321',
      operatingDestinations: ['Sarajevo', 'Belgrade', 'Zagreb', 'Vienna', 'Frankfurt']
    },
    {
      name: 'Turkish Airlines',
      isForeign: true,
      address: 'Istanbul Airport, Tayakadın, Terminal Caddesi No:1, 34283 Arnavutköy/İstanbul',
      taxId: 'TR123456789',
      operatingDestinations: ['Sarajevo', 'Belgrade', 'Zagreb', 'Vienna', 'Istanbul']
    },
    {
      name: 'FlyBosnia',
      isForeign: false,
      address: 'Sarajevo International Airport, Kurta Schorka 36',
      taxId: 'BA987654321',
      operatingDestinations: ['Vienna', 'Istanbul', 'Munich', 'Zurich', 'Dubai']
    },
    {
      name: 'Emirates',
      isForeign: true,
      address: 'Dubai International Airport, Dubai, UAE',
      taxId: 'AE123456789',
      operatingDestinations: ['Sarajevo', 'Belgrade', 'Zagreb', 'Vienna', 'Dubai']
    }
  ];

  for (const airlineData of airlines) {
    const airline = await prisma.airline.upsert({
      where: { name: airlineData.name },
      update: {},
      create: {
        name: airlineData.name,
        isForeign: airlineData.isForeign,
        address: airlineData.address,
        taxId: airlineData.taxId,
        operatingDestinations: airlineData.operatingDestinations
      }
    });
    console.log(`Created airline: ${airline.name}`);

    // Create price rules for each airline
    const currencies = ['BAM', 'EUR', 'USD'];
    for (const currency of currencies) {
      const basePrice = currency === 'BAM' ? 2.5 : (currency === 'EUR' ? 1.3 : 1.5);
      const priceVariation = randomFloat(-0.2, 0.3);
      
      await prisma.fuelPriceRule.upsert({
        where: {
          airlineId_currency: {
            airlineId: airline.id,
            currency: currency
          }
        },
        update: {},
        create: {
          airlineId: airline.id,
          price: basePrice + priceVariation,
          currency: currency
        }
      });
    }
    console.log(`Created price rules for ${airline.name}`);
  }

  // 3. Create fixed storage tanks (80,000L capacity)
  const fixedTanks = [
    {
      tank_name: 'Glavni Rezervoar 1',
      tank_identifier: 'FR-001',
      capacity_liters: 80000,
      fuel_type: 'JET A-1',
      current_quantity_liters: 24000, // 30% kapaciteta
      location_description: 'Sarajevo International Airport - Zona A',
      notes: 'Glavni rezervoar za JET A-1 gorivo',
      status: FixedTankStatus.ACTIVE
    },
    {
      tank_name: 'Glavni Rezervoar 2',
      tank_identifier: 'FR-002',
      capacity_liters: 80000,
      fuel_type: 'JET A-1',
      current_quantity_liters: 24000, // 30% kapaciteta
      location_description: 'Sarajevo International Airport - Zona A',
      notes: 'Rezervni rezervoar za JET A-1 gorivo',
      status: FixedTankStatus.ACTIVE
    },
    {
      tank_name: 'Glavni Rezervoar 3',
      tank_identifier: 'FR-003',
      capacity_liters: 80000,
      fuel_type: 'JET A-1',
      current_quantity_liters: 24000, // 30% kapaciteta
      location_description: 'Sarajevo International Airport - Zona B',
      notes: 'Dodatni rezervoar za JET A-1 gorivo',
      status: FixedTankStatus.ACTIVE
    }
  ];

  const createdFixedTanks = [];
  for (const tankData of fixedTanks) {
    const tank = await prisma.fixedStorageTanks.upsert({
      where: { tank_identifier: tankData.tank_identifier },
      update: {},
      create: tankData
    });
    createdFixedTanks.push(tank);
    console.log(`Created fixed tank: ${tank.tank_name} (${tank.tank_identifier}) with ${tank.current_quantity_liters}L`);
  }

  // 4. Create mobile tanker vehicles (37,500L capacity)
  // First, create a location
  const location = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Sarajevo International Airport',
      address: 'Kurta Schorka 36, Sarajevo'
    }
  });

  // Create a company
  const company = await prisma.company.upsert({
    where: { name: 'Avioservis d.o.o.' },
    update: {},
    create: {
      name: 'Avioservis d.o.o.',
      address: 'Kurta Schorka 36, Sarajevo',
      taxId: 'BA123456789',
      contactPersonName: 'Emir Mehmedović',
      contactPersonPhone: '+38761123456'
    }
  });

  const mobileTankers = [
    {
      vehicle_name: 'Cisterna 1',
      license_plate: 'A01-K-123',
      status: VehicleStatus.ACTIVE,
      kapacitet_cisterne: 37500,
      crijeva_za_tocenje: '2x HD38, 1x TW75',
      tip_filtera: 'EI-1583 Standard',
      filter_installed: true,
      companyId: company.id,
      locationId: location.id
    },
    {
      vehicle_name: 'Cisterna 2',
      license_plate: 'A01-K-456',
      status: VehicleStatus.ACTIVE,
      kapacitet_cisterne: 37500,
      crijeva_za_tocenje: '2x HD38, 1x TW75',
      tip_filtera: 'EI-1583 Standard',
      filter_installed: true,
      companyId: company.id,
      locationId: location.id
    }
  ];

  const createdMobileTankers = [];
  for (const tankerData of mobileTankers) {
    const tanker = await prisma.vehicle.upsert({
      where: { license_plate: tankerData.license_plate },
      update: {},
      create: tankerData
    });
    createdMobileTankers.push(tanker);
    console.log(`Created mobile tanker: ${tanker.vehicle_name} (${tanker.license_plate})`);

    // Create fuel tank for each vehicle with a unique identifier
    const capacity = tankerData.kapacitet_cisterne || 37500;
    
    const fuelTank = await prisma.fuelTank.create({
      data: {
        name: `Tank for ${tanker.vehicle_name}`,
        location: `Mobile tanker ${tanker.license_plate}`,
        identifier: `MT-${tanker.license_plate.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-5)}`, // Ensure uniqueness
        capacity_liters: capacity,
        current_liters: 0, // Start with empty tank
        fuel_type: 'JET A-1'
      }
    });
    console.log(`Created fuel tank for ${tanker.vehicle_name} with 0L initial fuel`);
  }

  // 5. Create 150 random fueling operations for January 2025
  console.log('\nGenerating 150 random fueling operations for January 2025...');
  
  // Get all fuel tanks (mobile tankers)
  const fuelTanks = await prisma.fuelTank.findMany();
  if (fuelTanks.length === 0) {
    console.log('No fuel tanks found. Cannot create fueling operations.');
    return;
  }
  
  // Get all airlines
  const allAirlines = await prisma.airline.findMany();
  if (allAirlines.length === 0) {
    console.log('No airlines found. Cannot create fueling operations.');
    return;
  }
  
  // Fill the tanks with initial fuel (35000 liters each for a total of 105000)
  for (const tank of fuelTanks) {
    await prisma.fuelTank.update({
      where: { id: tank.id },
      data: { current_liters: 35000 }
    });
    console.log(`Filled tank ${tank.identifier} with 35000 liters of fuel`);
  }
  
  // Generate 150 random fueling operations
  const fuelingOperations = [];
  const operatorNames = ['Emir Mehmedović', 'Adnan Husić', 'Senad Bašić', 'Mirza Hodžić'];
  
  // Create a batch of aircraft registrations
  const aircraftRegistrations = [];
  for (let i = 0; i < 20; i++) {
    const country = ['D-', 'TC-', 'A9-', '9A-', 'G-', 'F-'][Math.floor(Math.random() * 6)];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let registration = country;
    for (let j = 0; j < 3; j++) {
      registration += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    aircraftRegistrations.push(registration);
  }
  
  for (let i = 0; i < 150; i++) {
    // Rotate through the tanks
    const tankIndex = i % fuelTanks.length;
    const tank = fuelTanks[tankIndex];
    
    // Select a random airline
    const airline = allAirlines[Math.floor(Math.random() * allAirlines.length)];
    
    // Generate random date in January 2025
    const operationDate = randomJanuaryDate();
    
    // Create the fueling operation
    const operation = await prisma.fuelingOperation.create({
      data: {
        dateTime: operationDate,
        aircraft_registration: aircraftRegistrations[Math.floor(Math.random() * aircraftRegistrations.length)],
        airlineId: airline.id,
        destination: generateRandomDestination(),
        quantity_liters: 600, // Each operation is 600 liters
        tankId: tank.id,
        flight_number: generateRandomFlightNumber(),
        operator_name: operatorNames[Math.floor(Math.random() * operatorNames.length)],
        notes: `Test operation ${i+1} for January 2025`,
        tip_saobracaja: Math.random() > 0.5 ? 'Međunarodni' : 'Domaći',
        currency: airline.isForeign ? (Math.random() > 0.5 ? 'EUR' : 'USD') : 'BAM',
        price_per_kg: Math.random() > 0.5 ? 2.5 : 2.7,
        quantity_kg: 600 * 0.8, // Converting liters to kg using specific density
        specific_density: 0.8,
        total_amount: 600 * 0.8 * (Math.random() > 0.5 ? 2.5 : 2.7),
        discount_percentage: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
        delivery_note_number: `DN-${Math.floor(Math.random() * 90000) + 10000}-${i}`
      }
    });
    
    fuelingOperations.push(operation);
    
    // Update the tank's current fuel level
    await prisma.fuelTank.update({
      where: { id: tank.id },
      data: { current_liters: { decrement: 600 } }
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1} fueling operations...`);
    }
  }
  
  console.log(`Successfully created 150 fueling operations for January 2025`);

  // 6. Create 150 random fueling operations for February through June 2025
  const monthsToGenerate = [
    { month: 1, name: 'February' }, // February is month 1 (0-based)
    { month: 2, name: 'March' },
    { month: 3, name: 'April' },
    { month: 4, name: 'May' },
    { month: 5, name: 'June' }
  ];
  
  // Start with February
  console.log('\nGenerating 150 random fueling operations for February 2025...');
  
  // Check if we still have fuel tanks
  if (fuelTanks.length === 0) {
    console.log('No fuel tanks found. Cannot create fueling operations for February.');
    return;
  }
  
  // Refill the tanks if needed
  for (const tank of fuelTanks) {
    // Get current tank status
    const currentTank = await prisma.fuelTank.findUnique({
      where: { id: tank.id }
    });
    
    if (!currentTank) continue;
    
    // Calculate how much fuel to add to reach 35000 liters
    const fuelToAdd = 35000 - currentTank.current_liters;
    
    if (fuelToAdd > 0) {
      await prisma.fuelTank.update({
        where: { id: tank.id },
        data: { current_liters: { increment: fuelToAdd } }
      });
      console.log(`Refilled tank ${tank.identifier} with ${fuelToAdd.toFixed(2)} liters of fuel`);
    }
  }
  
  // Generate 150 random fueling operations for February
  const februaryOperations = [];
  
  for (let i = 0; i < 150; i++) {
    // Rotate through the tanks
    const tankIndex = i % fuelTanks.length;
    const tank = fuelTanks[tankIndex];
    
    // Select a random airline
    const airline = allAirlines[Math.floor(Math.random() * allAirlines.length)];
    
    // Generate random date in February 2025
    const operationDate = randomDateInMonth(monthsToGenerate[0].month); // February
    
    // Create the fueling operation
    const operation = await prisma.fuelingOperation.create({
      data: {
        dateTime: operationDate,
        aircraft_registration: aircraftRegistrations[Math.floor(Math.random() * aircraftRegistrations.length)],
        airlineId: airline.id,
        destination: generateRandomDestination(),
        quantity_liters: 100, // Each operation is 100 liters for February
        tankId: tank.id,
        flight_number: generateRandomFlightNumber(),
        operator_name: operatorNames[Math.floor(Math.random() * operatorNames.length)],
        notes: `Test operation ${i+1} for February 2025`,
        tip_saobracaja: Math.random() > 0.5 ? 'Međunarodni' : 'Domaći',
        currency: airline.isForeign ? (Math.random() > 0.5 ? 'EUR' : 'USD') : 'BAM',
        price_per_kg: Math.random() > 0.5 ? 2.5 : 2.7,
        quantity_kg: 100 * 0.8, // Converting liters to kg using specific density
        specific_density: 0.8,
        total_amount: 100 * 0.8 * (Math.random() > 0.5 ? 2.5 : 2.7),
        discount_percentage: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
        delivery_note_number: `DN-FEB-${Math.floor(Math.random() * 90000) + 10000}-${i}`
      }
    });
    
    februaryOperations.push(operation);
    
    // Update the tank's current fuel level
    await prisma.fuelTank.update({
      where: { id: tank.id },
      data: { current_liters: { decrement: 100 } }
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1} fueling operations for February...`);
    }
  }
  
  console.log(`Successfully created 150 fueling operations for February 2025`);
  
  // Generate operations for March, April, May, and June
  for (let monthIndex = 1; monthIndex < monthsToGenerate.length; monthIndex++) {
    const currentMonth = monthsToGenerate[monthIndex];
    
    console.log(`\nGenerating 150 random fueling operations for ${currentMonth.name} 2025...`);
    
    // Refill the tanks if needed
    for (const tank of fuelTanks) {
      // Get current tank status
      const currentTank = await prisma.fuelTank.findUnique({
        where: { id: tank.id }
      });
      
      if (!currentTank) continue;
      
      // Calculate how much fuel to add to reach 35000 liters
      const fuelToAdd = 35000 - currentTank.current_liters;
      
      if (fuelToAdd > 0) {
        await prisma.fuelTank.update({
          where: { id: tank.id },
          data: { current_liters: { increment: fuelToAdd } }
        });
        console.log(`Refilled tank ${tank.identifier} with ${fuelToAdd.toFixed(2)} liters of fuel`);
      }
    }
    
    // Generate 150 random fueling operations for the current month
    const monthOperations = [];
    
    for (let i = 0; i < 150; i++) {
      // Rotate through the tanks
      const tankIndex = i % fuelTanks.length;
      const tank = fuelTanks[tankIndex];
      
      // Select a random airline
      const airline = allAirlines[Math.floor(Math.random() * allAirlines.length)];
      
      // Generate random date in the current month of 2025
      const operationDate = randomDateInMonth(currentMonth.month);
      
      // Create the fueling operation
      const operation = await prisma.fuelingOperation.create({
        data: {
          dateTime: operationDate,
          aircraft_registration: aircraftRegistrations[Math.floor(Math.random() * aircraftRegistrations.length)],
          airlineId: airline.id,
          destination: generateRandomDestination(),
          quantity_liters: 100, // Each operation is 100 liters
          tankId: tank.id,
          flight_number: generateRandomFlightNumber(),
          operator_name: operatorNames[Math.floor(Math.random() * operatorNames.length)],
          notes: `Test operation ${i+1} for ${currentMonth.name} 2025`,
          tip_saobracaja: Math.random() > 0.5 ? 'Međunarodni' : 'Domaći',
          currency: airline.isForeign ? (Math.random() > 0.5 ? 'EUR' : 'USD') : 'BAM',
          price_per_kg: Math.random() > 0.5 ? 2.5 : 2.7,
          quantity_kg: 100 * 0.8, // Converting liters to kg using specific density
          specific_density: 0.8,
          total_amount: 100 * 0.8 * (Math.random() > 0.5 ? 2.5 : 2.7),
          discount_percentage: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
          delivery_note_number: `DN-${currentMonth.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 90000) + 10000}-${i}`
        }
      });
      
      monthOperations.push(operation);
      
      // Update the tank's current fuel level
      await prisma.fuelTank.update({
        where: { id: tank.id },
        data: { current_liters: { decrement: 100 } }
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1} fueling operations for ${currentMonth.name}...`);
      }
    }
    
    console.log(`Successfully created 150 fueling operations for ${currentMonth.name} 2025`);
  }
  
  console.log('Seed script completed successfully!');
}

main().catch(e => {
  console.error('Error in seed script:', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());