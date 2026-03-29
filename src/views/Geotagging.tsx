import React from 'react';
import { MapPin, Search, Filter, Layers } from 'lucide-react';

export default function Geotagging() {
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
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
            <Filter className="w-5 h-5 text-gray-500" />
            <span>Filters</span>
          </button>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
          <Layers className="w-5 h-5 text-gray-500" />
          <span>Map Layers</span>
        </button>
      </div>

      <div className="flex-1 bg-gray-200 rounded-xl border border-gray-300 overflow-hidden relative shadow-inner">
        {/* Placeholder for actual map implementation (e.g., Leaflet, Google Maps) */}
        <div className="absolute inset-0 flex items-center justify-center bg-[url('https://maps.wikimedia.org/osm-intl/13/4193/3820.png')] bg-cover bg-center opacity-60">
          <div className="text-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 max-w-sm">
            <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Map View</h3>
            <p className="text-gray-600 text-sm">
              This area would integrate with a mapping service (like Leaflet or Google Maps) to display geotagged farms, disease outbreak zones, and livestock distribution.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy Farms
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Alert Zones
              </span>
            </div>
          </div>
        </div>
        
        {/* Mock Map Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 border border-gray-200">
            <span className="text-xl font-bold">+</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 border border-gray-200">
            <span className="text-xl font-bold">-</span>
          </button>
        </div>
      </div>
    </div>
  );
}
