'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

interface Guard {
  id: string;
  username: string;
  password: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  checklist: string[];
}

interface PatrolRecord {
  id: string;
  guardId: string;
  guardName: string;
  locationId: string;
  locationName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  checklistResults: { [key: string]: boolean };
  distanceFromCheckpoint: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [patrols, setPatrols] = useState<PatrolRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guards' | 'locations'>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states
  const [guardForm, setGuardForm] = useState({ id: '', name: '', username: '', password: '' });
  const [locationForm, setLocationForm] = useState({
    id: '',
    name: '',
    latitude: '',
    longitude: '',
    checklist: [''],
  });

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    loadData();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadPatrols();
    }
  }, [selectedDate, user]);

  const loadData = async () => {
    await Promise.all([loadGuards(), loadLocations(), loadPatrols()]);
  };

  const loadGuards = async () => {
    try {
      const res = await fetch('/api/guards');
      const data = await res.json();
      setGuards(data);
    } catch (err) {
      console.error('Failed to load guards', err);
    }
  };

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const loadPatrols = async () => {
    try {
      const res = await fetch(`/api/patrols?date=${selectedDate}`);
      const data = await res.json();
      setPatrols(data);
    } catch (err) {
      console.error('Failed to load patrols', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (guardForm.id) {
        await fetch('/api/guards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guardForm),
        });
      } else {
        await fetch('/api/guards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guardForm),
        });
      }
      setGuardForm({ id: '', name: '', username: '', password: '' });
      loadGuards();
    } catch (err) {
      console.error('Failed to save guard', err);
    }
  };

  const handleGuardDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guard?')) return;
    try {
      await fetch(`/api/guards?id=${id}`, { method: 'DELETE' });
      loadGuards();
    } catch (err) {
      console.error('Failed to delete guard', err);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...locationForm,
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude),
        checklist: locationForm.checklist.filter(item => item.trim() !== ''),
      };

      if (locationForm.id) {
        await fetch('/api/locations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setLocationForm({ id: '', name: '', latitude: '', longitude: '', checklist: [''] });
      loadLocations();
    } catch (err) {
      console.error('Failed to save location', err);
    }
  };

  const handleLocationDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await fetch(`/api/locations?id=${id}`, { method: 'DELETE' });
      loadLocations();
    } catch (err) {
      console.error('Failed to delete location', err);
    }
  };

  const downloadCSV = () => {
    const headers = ['Date/Time', 'Guard', 'Location', 'Latitude', 'Longitude', 'Distance (m)', 'Checklist'];
    const rows = patrols.map(p => [
      new Date(p.timestamp).toLocaleString(),
      p.guardName,
      p.locationName,
      p.latitude.toFixed(6),
      p.longitude.toFixed(6),
      Math.round(p.distanceFromCheckpoint),
      Object.entries(p.checklistResults).map(([k, v]) => `${k}: ${v ? 'Yes' : 'No'}`).join('; '),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patrols-${selectedDate}.csv`;
    a.click();
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const totalPatrols = patrols.length;
  const expectedPatrols = guards.length * 5;
  const completionRate = expectedPatrols > 0 ? Math.round((totalPatrols / expectedPatrols) * 100) : 0;
  const missedPatrols = Math.max(0, expectedPatrols - totalPatrols);

  return (
    <div>
      <div className="header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="button">Logout</button>
      </div>

      <div style={{ background: '#2c3e50', padding: '10px 20px' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="button"
          style={{ background: activeTab === 'dashboard' ? '#3498db' : '#34495e' }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('guards')}
          className="button"
          style={{ background: activeTab === 'guards' ? '#3498db' : '#34495e' }}
        >
          Guards
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className="button"
          style={{ background: activeTab === 'locations' ? '#3498db' : '#34495e' }}
        >
          Locations
        </button>
      </div>

      <div className="container">
        {activeTab === 'dashboard' && (
          <>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Daily Reports</h2>
                <div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input"
                    style={{ width: 'auto', display: 'inline-block', marginRight: 10 }}
                  />
                  <button onClick={downloadCSV} className="button button-success" disabled={patrols.length === 0}>
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <h3>{totalPatrols}</h3>
                <p>Completed Patrols</p>
              </div>
              <div className="stat-card">
                <h3>{missedPatrols}</h3>
                <p>Missed Patrols</p>
              </div>
              <div className="stat-card">
                <h3>{completionRate}%</h3>
                <p>Completion Rate</p>
              </div>
              <div className="stat-card">
                <h3>{guards.length}</h3>
                <p>Active Guards</p>
              </div>
            </div>

            {patrols.length > 0 && (
              <>
                <div className="card">
                  <h2>Patrol Map</h2>
                  <MapComponent patrols={patrols} locations={locations} />
                </div>

                <div className="card">
                  <h2>Patrol Records</h2>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Guard</th>
                        <th>Location</th>
                        <th>Distance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patrols.map(patrol => (
                        <tr key={patrol.id}>
                          <td>{new Date(patrol.timestamp).toLocaleTimeString()}</td>
                          <td>{patrol.guardName}</td>
                          <td>{patrol.locationName}</td>
                          <td>{Math.round(patrol.distanceFromCheckpoint)}m</td>
                          <td>
                            <span className="badge badge-success">Completed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {patrols.length === 0 && (
              <div className="card">
                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: 40 }}>
                  No patrol records for selected date
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'guards' && (
          <>
            <div className="card">
              <h2>{guardForm.id ? 'Edit Guard' : 'Add New Guard'}</h2>
              <form onSubmit={handleGuardSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="input"
                    value={guardForm.name}
                    onChange={(e) => setGuardForm({ ...guardForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    className="input"
                    value={guardForm.username}
                    onChange={(e) => setGuardForm({ ...guardForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="input"
                    value={guardForm.password}
                    onChange={(e) => setGuardForm({ ...guardForm, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="button button-success">
                  {guardForm.id ? 'Update Guard' : 'Add Guard'}
                </button>
                {guardForm.id && (
                  <button
                    type="button"
                    className="button"
                    onClick={() => setGuardForm({ id: '', name: '', username: '', password: '' })}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>

            <div className="card">
              <h2>All Guards</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guards.map(guard => (
                    <tr key={guard.id}>
                      <td>{guard.name}</td>
                      <td>{guard.username}</td>
                      <td>
                        <button
                          className="button"
                          onClick={() => setGuardForm(guard)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => handleGuardDelete(guard.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'locations' && (
          <>
            <div className="card">
              <h2>{locationForm.id ? 'Edit Location' : 'Add New Location'}</h2>
              <form onSubmit={handleLocationSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="input"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                    required
                    placeholder="e.g., 40.7128"
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                    required
                    placeholder="e.g., -74.0060"
                  />
                </div>
                <div className="form-group">
                  <label>Checklist Items</label>
                  {locationForm.checklist.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <input
                        type="text"
                        className="input"
                        value={item}
                        onChange={(e) => {
                          const newChecklist = [...locationForm.checklist];
                          newChecklist[index] = e.target.value;
                          setLocationForm({ ...locationForm, checklist: newChecklist });
                        }}
                        placeholder="Checklist item"
                      />
                      {index === locationForm.checklist.length - 1 ? (
                        <button
                          type="button"
                          className="button"
                          onClick={() => setLocationForm({
                            ...locationForm,
                            checklist: [...locationForm.checklist, '']
                          })}
                        >
                          +
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-danger"
                          onClick={() => {
                            const newChecklist = locationForm.checklist.filter((_, i) => i !== index);
                            setLocationForm({ ...locationForm, checklist: newChecklist });
                          }}
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="submit" className="button button-success">
                  {locationForm.id ? 'Update Location' : 'Add Location'}
                </button>
                {locationForm.id && (
                  <button
                    type="button"
                    className="button"
                    onClick={() => setLocationForm({ id: '', name: '', latitude: '', longitude: '', checklist: [''] })}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>

            <div className="card">
              <h2>All Locations</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Coordinates</th>
                    <th>Checklist Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map(location => (
                    <tr key={location.id}>
                      <td>{location.name}</td>
                      <td>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</td>
                      <td>{location.checklist.length} items</td>
                      <td>
                        <button
                          className="button"
                          onClick={() => setLocationForm({
                            id: location.id,
                            name: location.name,
                            latitude: location.latitude.toString(),
                            longitude: location.longitude.toString(),
                            checklist: [...location.checklist, '']
                          })}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => handleLocationDelete(location.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
