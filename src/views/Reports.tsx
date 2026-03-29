import React, { useState, useEffect } from 'react';
import { Printer, Filter, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Reports() {
  const [reportType, setReportType] = useState('livestock');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('All');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [generatedBy, setGeneratedBy] = useState('Admin User');
  const [reportNotes, setReportNotes] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate, month, category]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let tableName = '';
      let selectQuery = '*';

      if (reportType === 'livestock') tableName = 'livestock';
      else if (reportType === 'farmers') tableName = 'farmers';
      else if (reportType === 'health') tableName = 'health_records';
      else if (reportType === 'distributions') tableName = 'distributions';
      else if (reportType === 'inventory') tableName = 'inventory';

      if (tableName) {
        let query = supabase.from(tableName).select(selectQuery).order('created_at', { ascending: false });
        
        // Apply date filters
        if (startDate) {
          query = query.gte('created_at', `${startDate}T00:00:00Z`);
        }
        if (endDate) {
          query = query.lte('created_at', `${endDate}T23:59:59Z`);
        }
        if (month) {
          const startOfMonth = `${month}-01T00:00:00Z`;
          const endOfMonth = new Date(new Date(startOfMonth).getFullYear(), new Date(startOfMonth).getMonth() + 1, 0).toISOString().split('T')[0] + 'T23:59:59Z';
          query = query.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
        }

        // Apply category filters
        const activeCategory = isCustomCategory ? customCategory : category;
        if (activeCategory !== 'All' && activeCategory !== '') {
          if (reportType === 'livestock') query = query.eq('species', activeCategory);
          if (reportType === 'health') query = query.eq('type', activeCategory);
          if (reportType === 'distributions') query = query.eq('status', activeCategory);
          if (reportType === 'inventory') query = query.eq('category', activeCategory);
        }

        const { data: result, error } = await query;
        if (error) throw error;
        setData(result || []);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    
    // Get headers
    const headers = Object.keys(data[0]).filter(key => key !== 'id').join(',');
    
    // Get rows
    const rows = data.map(obj => {
      return Object.entries(obj)
        .filter(([key]) => key !== 'id')
        .map(([_, val]) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Custom') {
      setIsCustomCategory(true);
      setCategory('Custom');
    } else {
      setIsCustomCategory(false);
      setCategory(value);
      setCustomCategory('');
    }
  };

  const renderCategoryFilter = () => {
    let options = <option value="All">All</option>;
    if (reportType === 'livestock') {
      options = (
        <>
          <option value="All">All Species</option>
          <option value="Cattle">Cattle</option>
          <option value="Swine">Swine</option>
          <option value="Poultry">Poultry</option>
          <option value="Goat">Goat</option>
          <option value="Custom">Add Custom Category...</option>
        </>
      );
    } else if (reportType === 'health') {
      options = (
        <>
          <option value="All">All Services</option>
          <option value="Vaccination">Vaccination</option>
          <option value="Treatment">Treatment</option>
          <option value="Deworming">Deworming</option>
          <option value="Checkup">Checkup</option>
          <option value="Custom">Add Custom Category...</option>
        </>
      );
    } else if (reportType === 'distributions') {
      options = (
        <>
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Planned">Planned</option>
          <option value="Custom">Add Custom Category...</option>
        </>
      );
    } else if (reportType === 'inventory') {
      options = (
        <>
          <option value="All">All Categories</option>
          <option value="Feed">Feed</option>
          <option value="Medicine">Medicine</option>
          <option value="Vaccine">Vaccine</option>
          <option value="Equipment">Equipment</option>
          <option value="Custom">Add Custom Category...</option>
        </>
      );
    } else {
        return null;
    }

    return (
      <div className="flex items-center gap-2">
        <select value={category} onChange={handleCategoryChange} className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]">
          {options}
        </select>
        {isCustomCategory && (
          <input
            type="text"
            placeholder="Enter custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
          />
        )}
      </div>
    );
  };

  const renderTable = () => {
    if (data.length === 0) return <div className="text-center py-8 text-gray-500">No data available for this report.</div>;

    switch (reportType) {
      case 'livestock':
        return (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-900">
                <th className="py-3 px-2">Tag ID</th>
                <th className="py-3 px-2">Farmer</th>
                <th className="py-3 px-2">Species/Breed</th>
                <th className="py-3 px-2">Sex/Age</th>
                <th className="py-3 px-2">Weight (kg)</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="py-2 px-2 font-medium">{item.tag_id}</td>
                  <td className="py-2 px-2">{item.farmer_name}</td>
                  <td className="py-2 px-2">{item.species} - {item.breed}</td>
                  <td className="py-2 px-2">{item.sex} / {item.age}</td>
                  <td className="py-2 px-2">{item.weight_kg}</td>
                  <td className="py-2 px-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'farmers':
        return (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-900">
                <th className="py-3 px-2">RSBSA ID</th>
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Contact</th>
                <th className="py-3 px-2">Address</th>
                <th className="py-3 px-2">Farm Type</th>
                <th className="py-3 px-2 text-center">Livestock Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="py-2 px-2 font-medium">{item.rsbsa_id}</td>
                  <td className="py-2 px-2">{item.name}</td>
                  <td className="py-2 px-2">{item.contact}</td>
                  <td className="py-2 px-2">{item.address}</td>
                  <td className="py-2 px-2">{item.farm_type} ({item.farm_area_sqm} sqm)</td>
                  <td className="py-2 px-2 text-center">{item.livestock_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'health':
        return (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-900">
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Farmer</th>
                <th className="py-3 px-2">Livestock Tag</th>
                <th className="py-3 px-2">Service Type</th>
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="py-2 px-2 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="py-2 px-2">{item.farmer_name}</td>
                  <td className="py-2 px-2">{item.livestock_tag} ({item.species})</td>
                  <td className="py-2 px-2 font-medium">{item.type}</td>
                  <td className="py-2 px-2">{item.description}</td>
                  <td className="py-2 px-2">{item.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'distributions':
        return (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-900">
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Program Name</th>
                <th className="py-3 px-2">Item Type</th>
                <th className="py-3 px-2">Quantity</th>
                <th className="py-3 px-2">Location</th>
                <th className="py-3 px-2 text-center">Beneficiaries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="py-2 px-2 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="py-2 px-2 font-medium">{item.program_name}</td>
                  <td className="py-2 px-2">{item.item_type}</td>
                  <td className="py-2 px-2">{item.quantity} {item.unit}</td>
                  <td className="py-2 px-2">{item.location}</td>
                  <td className="py-2 px-2 text-center">{item.beneficiaries_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'inventory':
        return (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-900">
                <th className="py-3 px-2">Item Name</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Quantity</th>
                <th className="py-3 px-2">Batch/Supplier</th>
                <th className="py-3 px-2">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map(item => (
                <tr key={item.id}>
                  <td className="py-2 px-2 font-medium">{item.item_name}</td>
                  <td className="py-2 px-2">{item.category}</td>
                  <td className="py-2 px-2">{item.quantity} {item.unit}</td>
                  <td className="py-2 px-2">{item.batch_number} / {item.supplier}</td>
                  <td className="py-2 px-2">{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Generate and export system reports</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Settings */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Report Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Report Type</label>
              <div className="space-y-3">
                {[
                  { value: 'inventory', label: 'Current Inventory', desc: 'List of all available items' },
                  { value: 'farmers', label: 'Registered Recipients', desc: 'List of all RSBSA farmers' },
                  { value: 'distributions', label: 'Distribution Summary', desc: 'Aggregated distribution totals' },
                  { value: 'distributions_by_recipient', label: 'Distribution by Recipient', desc: 'Aggregated items per farmer' },
                ].map((type) => (
                  <label key={type.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="radio" 
                      name="reportType" 
                      value={type.value} 
                      checked={reportType === type.value}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mt-1 text-[#00965e] focus:ring-[#00965e]"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
              <div className="space-y-3">
                <label className="block text-xs text-gray-500">Category</label>
                <select 
                  value={category} 
                  onChange={handleCategoryChange} 
                  className="w-full bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
                >
                  <option value="All">All Categories</option>
                  {/* Add other options dynamically based on reportType if needed */}
                </select>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm"
              >
                <Printer className="w-5 h-5" />
                <span>Generate PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Report Preview
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{data.length} records</span>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading report data...</div>
          ) : (
            <div className="overflow-x-auto">
              {renderTable()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
