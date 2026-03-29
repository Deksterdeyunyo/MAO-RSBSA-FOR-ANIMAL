import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Layers, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FarmLocation {
  id: string;
  name: string;
  rsbsa_id: string;
  address: string;
  lat: number;
  lng: number;
  status: 'Healthy' | 'Alert' | 'Warning';
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function Geotagging() {
  const [locations, setLocations] = useState<FarmLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5995, 120.9842]); // Default to Manila
  const [zoom, setZoom] = useState(13);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      // In a real app, we'd have a 'farm_locations' table or lat/lng in 'farmers'
      // For this demo, we'll generate some locations based on existing farmers
      const { data: farmers } = await supabase.from('farmers').select('*');
      
      if (farmers && farmers.length > 0) {
        const mockLocations: FarmLocation[] = farmers.map((f, idx) => ({
          id: f.id,
          name: f.name,
          rsbsa_id: f.rsbsa_id,
          address: f.address,
          // Use actual coordinates if available, otherwise fallback to mock
          lat: f.latitude && f.latitude !== 0 ? f.latitude : 14.5995 + (Math.random() - 0.5) * 0.1,
          lng: f.longitude && f.longitude !== 0 ? f.longitude : 120.9842 + (Math.random() - 0.5) * 0.1,
          status: idx % 5 === 0 ? 'Alert' : idx % 8 === 0 ? 'Warning' : 'Healthy'
        }));
        setLocations(mockLocations);
        if (mockLocations.length > 0) {
          setMapCenter([mockLocations[0].lat, mockLocations[0].lng]);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         l.rsbsa_id.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Alert': return 'text-red-600';
      case 'Warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getMarkerIcon = (status: string) => {
    const color = status === 'Alert' ? '#ef4444' : status === 'Warning' ? '#f59e0b' : '#10b981';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search locations or farmers..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
            <Filter className="w-5 h-5 text-gray-500" />
            <span>Filters</span>
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-xs font-medium">
            <button 
              onClick={() => setStatusFilter('All')}
              className={`px-2 py-1 rounded transition-colors ${statusFilter === 'All' ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('Healthy')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${statusFilter === 'Healthy' ? 'bg-green-50 font-bold text-green-700' : 'hover:bg-gray-50'}`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span>Healthy</span>
            </button>
            <button 
              onClick={() => setStatusFilter('Warning')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${statusFilter === 'Warning' ? 'bg-yellow-50 font-bold text-yellow-700' : 'hover:bg-gray-50'}`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <span>Warning</span>
            </button>
            <button 
              onClick={() => setStatusFilter('Alert')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${statusFilter === 'Alert' ? 'bg-red-50 font-bold text-red-700' : 'hover:bg-gray-50'}`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span>Alert</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden relative shadow-sm">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading map data...</p>
            </div>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} zoom={zoom} />
            {filteredLocations.map((loc) => (
              <Marker 
                key={loc.id} 
                position={[loc.lat, loc.lng]}
                icon={getMarkerIcon(loc.status)}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-gray-900 text-base mb-1">{loc.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">RSBSA: {loc.rsbsa_id}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      {loc.address}
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(loc.status)}`}>
                      Status: {loc.status}
                    </div>
                    <button 
                      className="mt-3 w-full py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded hover:bg-green-100 transition-colors border border-green-200"
                      onClick={() => alert(`Viewing details for ${loc.name}`)}
                    >
                      View Farm Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
