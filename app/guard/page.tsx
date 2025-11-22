'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: string;
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
  locationName: string;
  timestamp: string;
}

export default function GuardDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [patrols, setPatrols] = useState<PatrolRecord[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'guard') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    loadLocations();
    loadPatrols(parsedUser.id);
  }, [router]);

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const loadPatrols = async (guardId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/patrols?guardId=${guardId}&date=${today}`);
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

  const startPatrol = (location: Location) => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(pos);

        // Calculate distance
        const distance = calculateDistance(
          pos.lat,
          pos.lng,
          location.latitude,
          location.longitude
        );

        if (distance > 50) {
          setError(`You are ${Math.round(distance)}m away from the checkpoint. You must be within 50 meters to start the patrol.`);
          setLoading(false);
          return;
        }

        setSelectedLocation(location);
        const initialChecklist: { [key: string]: boolean } = {};
        location.checklist.forEach(item => {
          initialChecklist[item] = false;
        });
        setChecklist(initialChecklist);
        setLoading(false);
      },
      (err) => {
        setError('Unable to get your location. Please enable location services.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleChecklistChange = (item: string) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const submitPatrol = async () => {
    if (!selectedLocation || !currentPosition || !user) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/patrols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardId: user.id,
          locationId: selectedLocation.id,
          latitude: currentPosition.lat,
          longitude: currentPosition.lng,
          checklistResults: checklist,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Patrol completed successfully!');
        setSelectedLocation(null);
        setChecklist({});
        loadPatrols(user.id);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to submit patrol');
      }
    } catch (err) {
      setError('An error occurred while submitting the patrol');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const completedPatrols = patrols.length;
  const remainingPatrols = 5 - completedPatrols;
  const progressPercentage = (completedPatrols / 5) * 100;

  return (
    <div>
      <div className="header">
        <div>
          <h1>Security Guard Portal</h1>
          <p>Welcome, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="button">Logout</button>
      </div>

      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="patrol-progress">
          <h3>Today's Progress: {completedPatrols} / 5 Patrols</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}>
              {completedPatrols > 0 && `${completedPatrols}/5`}
            </div>
          </div>
          <p>{remainingPatrols > 0 ? `${remainingPatrols} patrols remaining` : 'All patrols completed for today!'}</p>
        </div>

        <div className="card">
          <h2>Available Checkpoints</h2>
          {locations.map(location => (
            <div key={location.id} className="location-card">
              <h3>📍 {location.name}</h3>
              <p>Checklist items: {location.checklist.length}</p>
              <button
                onClick={() => startPatrol(location)}
                className="button button-success"
                disabled={loading}
              >
                {loading ? 'Getting location...' : 'Start Patrol'}
              </button>
            </div>
          ))}
        </div>

        {patrols.length > 0 && (
          <div className="card">
            <h2>Today's Completed Patrols</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patrols.map(patrol => (
                  <tr key={patrol.id}>
                    <td>{new Date(patrol.timestamp).toLocaleTimeString()}</td>
                    <td>{patrol.locationName}</td>
                    <td><span className="badge badge-success">Completed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Patrol Checklist: {selectedLocation.name}</h2>
            <div className="alert alert-success">
              ✓ GPS verified - You are at the checkpoint
            </div>

            <div className="checklist">
              {selectedLocation.checklist.map(item => (
                <div key={item} className="checklist-item">
                  <input
                    type="checkbox"
                    id={item}
                    checked={checklist[item] || false}
                    onChange={() => handleChecklistChange(item)}
                  />
                  <label htmlFor={item}>{item}</label>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={submitPatrol}
                className="button button-success"
                disabled={loading || Object.values(checklist).some(v => !v)}
                style={{ flex: 1 }}
              >
                {loading ? 'Submitting...' : 'Submit Patrol'}
              </button>
              <button
                onClick={() => setSelectedLocation(null)}
                className="button"
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
            {Object.values(checklist).some(v => !v) && (
              <p style={{ marginTop: 10, color: '#e74c3c', fontSize: 14 }}>
                Please complete all checklist items before submitting
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
