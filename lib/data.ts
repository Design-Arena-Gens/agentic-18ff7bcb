export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'guard';
  name: string;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  checklist: string[];
}

export interface PatrolRecord {
  id: string;
  guardId: string;
  guardName: string;
  locationId: string;
  locationName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  checklistResults: { [key: string]: boolean };
  photoUrl?: string;
  distanceFromCheckpoint: number;
}

// In-memory database (for demo purposes)
let users: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: '2',
    username: 'guard1',
    password: 'guard123',
    role: 'guard',
    name: 'John Smith'
  },
  {
    id: '3',
    username: 'guard2',
    password: 'guard123',
    role: 'guard',
    name: 'Jane Doe'
  }
];

let locations: Location[] = [
  {
    id: '1',
    name: 'Main Entrance',
    latitude: 40.7128,
    longitude: -74.0060,
    checklist: ['Door locked', 'Lights off', 'No damage visible', 'No safety hazards']
  },
  {
    id: '2',
    name: 'Parking Lot',
    latitude: 40.7138,
    longitude: -74.0070,
    checklist: ['Gate secured', 'Adequate lighting', 'No unauthorized vehicles', 'No safety hazards']
  },
  {
    id: '3',
    name: 'Building A',
    latitude: 40.7118,
    longitude: -74.0050,
    checklist: ['All doors locked', 'Windows secure', 'Alarm system active', 'No suspicious activity']
  },
  {
    id: '4',
    name: 'Warehouse',
    latitude: 40.7148,
    longitude: -74.0080,
    checklist: ['Loading dock secure', 'Inventory area locked', 'Fire exits clear', 'No safety hazards']
  },
  {
    id: '5',
    name: 'Back Perimeter',
    latitude: 40.7108,
    longitude: -74.0040,
    checklist: ['Fence intact', 'Gate locked', 'Lighting functional', 'No trespassing signs visible']
  }
];

let patrolRecords: PatrolRecord[] = [];

// Helper function to calculate distance between two GPS points (Haversine formula)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Data access functions
export const getUsers = () => users;
export const getUser = (id: string) => users.find(u => u.id === id);
export const getUserByUsername = (username: string) => users.find(u => u.username === username);
export const addUser = (user: Omit<User, 'id'>) => {
  const newUser = { ...user, id: Date.now().toString() };
  users.push(newUser);
  return newUser;
};
export const updateUser = (id: string, updates: Partial<User>) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    return users[index];
  }
  return null;
};
export const deleteUser = (id: string) => {
  users = users.filter(u => u.id !== id);
};

export const getLocations = () => locations;
export const getLocation = (id: string) => locations.find(l => l.id === id);
export const addLocation = (location: Omit<Location, 'id'>) => {
  const newLocation = { ...location, id: Date.now().toString() };
  locations.push(newLocation);
  return newLocation;
};
export const updateLocation = (id: string, updates: Partial<Location>) => {
  const index = locations.findIndex(l => l.id === id);
  if (index !== -1) {
    locations[index] = { ...locations[index], ...updates };
    return locations[index];
  }
  return null;
};
export const deleteLocation = (id: string) => {
  locations = locations.filter(l => l.id !== id);
};

export const getPatrolRecords = () => patrolRecords;
export const getPatrolRecordsByGuard = (guardId: string) =>
  patrolRecords.filter(p => p.guardId === guardId);
export const getPatrolRecordsByDate = (date: string) =>
  patrolRecords.filter(p => p.timestamp.startsWith(date));
export const addPatrolRecord = (record: Omit<PatrolRecord, 'id'>) => {
  const newRecord = { ...record, id: Date.now().toString() };
  patrolRecords.push(newRecord);
  return newRecord;
};

export const getGuardPatrolsToday = (guardId: string) => {
  const today = new Date().toISOString().split('T')[0];
  return patrolRecords.filter(p =>
    p.guardId === guardId && p.timestamp.startsWith(today)
  );
};
