import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Filter, Layers, Info, Navigation, Check, X, Locate, User, Phone, Calendar, Home, Briefcase, Activity, Maximize } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

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
  barangay?: string;
  contact?: string;
  gender?: string;
  birthdate?: string;
  civil_status?: string;
  education?: string;
  farm_type?: string;
  farm_area_sqm?: number;
  livestock_count?: number;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ locations, trigger }: { locations: FarmLocation[], trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map, trigger]);
  return null;
}

export default function Geotagging({ userRole }: { userRole?: string }) {
  const [locations, setLocations] = useState<FarmLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5995, 120.9842]); // Default to Manila
  const [zoom, setZoom] = useState(13);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmLocation | null>(null);
  const [isGeotaggingMode, setIsGeotaggingMode] = useState(false);
  const [tempCoords, setTempCoords] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);

  const isEncoder = userRole === 'Encoder';

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressSearch.trim()) return;

    setIsSearchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setZoom(16);
      } else {
        alert('Address not found. Please try a more specific search.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Failed to search address. Please try again.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data: farmers, error } = await supabase.from('farmers').select('*');
      
      if (error) throw error;

      if (farmers) {
        const processedLocations: FarmLocation[] = farmers.map((f, idx) => {
          const hasCoords = f.latitude && f.longitude && f.latitude !== 0 && f.longitude !== 0;
          
          return {
            id: f.id,
            name: f.name,
            rsbsa_id: f.rsbsa_id || 'N/A',
            address: f.address || f.barangay || 'No address',
            lat: hasCoords ? f.latitude : 14.5995 + (Math.sin(idx) * 0.05),
            lng: hasCoords ? f.longitude : 120.9842 + (Math.cos(idx) * 0.05),
            status: f.status || (idx % 5 === 0 ? 'Alert' : idx % 8 === 0 ? 'Warning' : 'Healthy'),
            barangay: f.barangay,
            contact: f.contact,
            gender: f.gender,
            birthdate: f.birthdate,
            civil_status: f.civil_status,
            education: f.education,
            farm_type: f.farm_type,
            farm_area_sqm: f.farm_area_sqm,
            livestock_count: f.livestock_count
          };
        });
        setLocations(processedLocations);
        
        // Trigger fit bounds on initial load if we have locations
        if (processedLocations.length > 0) {
          setFitTrigger(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isGeotaggingMode && selectedFarmer) {
      setTempCoords([lat, lng]);
    }
  };

  const saveGeotag = async () => {
    if (!selectedFarmer || !tempCoords) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('farmers')
        .update({
          latitude: tempCoords[0],
          longitude: tempCoords[1]
        })
        .eq('id', selectedFarmer.id);

      if (error) throw error;

      setLocations(prev => prev.map(loc => 
        loc.id === selectedFarmer.id 
          ? { ...loc, lat: tempCoords[0], lng: tempCoords[1] } 
          : loc
      ));
      
      setIsGeotaggingMode(false);
      setTempCoords(null);
      alert('Geotag updated successfully!');
    } catch (error) {
      console.error('Error updating geotag:', error);
      alert('Failed to update geotag.');
    } finally {
      setSaving(false);
    }
  };

  const locateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setZoom(15);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not determine your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const filteredLocations = locations.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         l.rsbsa_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (l.barangay && l.barangay.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getMarkerIcon = (status: string, isSelected: boolean) => {
    const color = status === 'Alert' ? '#ef4444' : status === 'Warning' ? '#f59e0b' : '#10b981';
    const size = isSelected ? 24 : 16;
    const border = isSelected ? '4px solid #3b82f6' : '3px solid white';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}; box-shadow: 0 0 10px rgba(0,0,0,0.5); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const focusOnFarmer = (loc: FarmLocation) => {
    setSelectedFarmer(loc);
    setMapCenter([loc.lat, loc.lng]);
    setZoom(16);
  };

  const fitAll = () => {
    if (filteredLocations.length > 0) {
      setFitTrigger(prev => prev + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Alert': return 'text-red-600';
      case 'Warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-0">
      {/* Header Controls */}
      <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0 bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, RSBSA ID, or barangay..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-transparent outline-none font-medium text-gray-700"
            >
              <option value="All">All Status</option>
              <option value="Healthy">Healthy</option>
              <option value="Warning">Warning</option>
              <option value="Alert">Alert</option>
            </select>
          </div>
        </div>

        {isGeotaggingMode ? (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg animate-pulse shadow-md">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Geotagging Mode</span>
              <span className="text-[10px] text-blue-600 font-medium">Click on the map to set location for {selectedFarmer?.name}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={saveGeotag}
                disabled={!tempCoords || saving}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                title="Save Location"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => { setIsGeotaggingMode(false); setTempCoords(null); }}
                className="p-2 bg-white text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={fetchLocations}
              className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              title="Refresh Data"
            >
              <Locate className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-sm hidden md:flex z-10">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" />
              Farmer Locations
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              Showing {filteredLocations.length} results
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => focusOnFarmer(loc)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-all flex flex-col gap-1 border-l-4 ${
                  selectedFarmer?.id === loc.id ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900 text-sm truncate pr-2">{loc.name}</span>
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    loc.status === 'Alert' ? 'bg-red-500' : loc.status === 'Warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                </div>
                <span className="text-[10px] text-gray-500 font-mono">RSBSA: {loc.rsbsa_id}</span>
                <div className="flex items-center gap-1 text-[11px] text-gray-600 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{loc.barangay || loc.address}</span>
                </div>
              </button>
            ))}
            {filteredLocations.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No farmers found</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-white overflow-hidden relative">
          {/* Address Search Overlay */}
          <div className="absolute top-6 left-6 z-[1000] w-full max-w-xs">
            <form onSubmit={handleAddressSearch} className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search address or place..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={isSearchingAddress}
                className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSearchingAddress ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm font-medium">Loading map data...</p>
              </div>
            </div>
          ) : (
            <>
              <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                {mapLayer === 'street' ? (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                )}
                <ChangeView center={mapCenter} zoom={zoom} />
                <FitBounds locations={filteredLocations} trigger={fitTrigger} />
                <MapEvents onMapClick={handleMapClick} />
                
                {filteredLocations.map((loc) => (
                  <Marker 
                    key={loc.id} 
                    position={[loc.lat, loc.lng]}
                    icon={getMarkerIcon(loc.status, selectedFarmer?.id === loc.id)}
                    eventHandlers={{
                      click: () => setSelectedFarmer(loc)
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1 min-w-[220px]">
                        <h3 className="font-bold text-gray-900 text-base mb-0.5">{loc.name}</h3>
                        <p className="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-wider">RSBSA: {loc.rsbsa_id}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {loc.barangay || loc.address}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ${
                            loc.status === 'Alert' ? 'bg-red-100 text-red-700 border border-red-200' : 
                            loc.status === 'Warning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                            'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {loc.status}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                            onClick={() => setIsProfileModalOpen(true)}
                          >
                            <User className="w-3 h-3" />
                            Profile
                          </button>
                          {!isEncoder && (
                            <button 
                              className="flex-1 py-2 bg-white text-blue-600 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-1"
                              onClick={() => {
                                setSelectedFarmer(loc);
                                setIsGeotaggingMode(true);
                              }}
                            >
                              <Navigation className="w-3 h-3" />
                              Geotag
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Temporary marker for geotagging */}
                {isGeotaggingMode && tempCoords && (
                  <Marker position={tempCoords} icon={getMarkerIcon('Healthy', true)}>
                    <Popup permanent>
                      <div className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        New Location
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Map Legend */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-xl z-[1000] text-[10px] font-bold uppercase tracking-wider space-y-2 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-700">Healthy Farm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-700">Warning / Alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                  <span className="text-gray-700">Critical Alert</span>
                </div>
                <div className="pt-1 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-md ring-2 ring-blue-200"></div>
                    <span className="text-blue-600">Selected</span>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
                <button 
                  onClick={fitAll}
                  className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-lg hover:bg-gray-50 transition-all text-green-600 active:scale-90"
                  title="Show All Farmers"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { setMapCenter([14.5995, 120.9842]); setZoom(13); }}
                  className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-lg hover:bg-gray-50 transition-all text-gray-600 active:scale-90"
                  title="Recenter Map"
                >
                  <Navigation className="w-5 h-5" />
                </button>
                <button 
                  onClick={locateMe}
                  className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-lg hover:bg-gray-50 transition-all text-blue-600 active:scale-90"
                  title="My Location"
                >
                  <Locate className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setMapLayer(prev => prev === 'street' ? 'satellite' : 'street')}
                  className={`p-2.5 rounded-xl border shadow-lg transition-all active:scale-90 ${
                    mapLayer === 'satellite' ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Toggle Satellite View"
                >
                  <Layers className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Farmer Profile Modal */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        title="Farmer Profile Details"
      >
        {selectedFarmer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedFarmer.name}</h4>
                <p className="text-sm text-gray-500 font-mono">RSBSA: {selectedFarmer.rsbsa_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedFarmer.contact || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{selectedFarmer.birthdate ? new Date(selectedFarmer.birthdate).toLocaleDateString() : 'N/A'} ({selectedFarmer.gender || 'N/A'})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="w-4 h-4 text-gray-400" />
                  <span>{selectedFarmer.barangay || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span>{selectedFarmer.education || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span>{selectedFarmer.civil_status || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className={`font-bold ${getStatusColor(selectedFarmer.status)}`}>{selectedFarmer.status}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Farm Information</h5>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Farm Type</span>
                  <span className="text-sm font-semibold text-gray-700">{selectedFarmer.farm_type || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Area (sqm)</span>
                  <span className="text-sm font-semibold text-gray-700">{selectedFarmer.farm_area_sqm?.toLocaleString() || '0'} sqm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Livestock Count</span>
                  <span className="text-sm font-semibold text-gray-700">{selectedFarmer.livestock_count || '0'} heads</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Coordinates</span>
                  <span className="text-[11px] font-mono text-gray-600">{selectedFarmer.lat.toFixed(4)}, {selectedFarmer.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              {!isEncoder && (
                <button 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setIsGeotaggingMode(true);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Update Geotag
                </button>
              )}
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className={`${isEncoder ? 'flex-1' : 'px-6'} py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
