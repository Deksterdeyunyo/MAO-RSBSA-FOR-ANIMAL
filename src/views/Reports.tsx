import React, { useState, useEffect } from 'react';
import { Printer, Filter, Download } from 'lucide-react';
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
      {/* Controls (Hidden on print) */}
      <div className="print:hidden flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => { setReportType(e.target.value); setCategory('All'); setIsCustomCategory(false); setCustomCategory(''); }}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
              >
                <option value="livestock">Livestock Inventory Report</option>
                <option value="farmers">Registered Farmers Report</option>
                <option value="health">Health Services Log</option>
                <option value="distributions">Program Distributions Report</option>
                <option value="inventory">Inventory Stock Report</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            
            {renderCategoryFilter()}
            
            <div className="flex items-center gap-2">
              <input 
                type="month" 
                value={month}
                onChange={(e) => { setMonth(e.target.value); setStartDate(''); setEndDate(''); }}
                className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
                title="Filter by Month"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">or</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setMonth(''); }}
                className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
                title="Start Date"
              />
              <span className="text-sm text-gray-500">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setMonth(''); }}
                className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
                title="End Date"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Generated By..." 
                value={generatedBy}
                onChange={(e) => setGeneratedBy(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm"
            >
              <Printer className="w-5 h-5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-area" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">
            {reportType === 'livestock' ? 'Livestock Inventory Report' :
             reportType === 'farmers' ? 'Registered Farmers Report' :
             reportType === 'health' ? 'Health Services Report' :
             reportType === 'inventory' ? 'Inventory Stock Report' :
             'Program Distributions Report'}
          </h1>
          <p className="text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()} by {generatedBy}</p>
          {(startDate || endDate || month || category !== 'All') && (
            <p className="text-gray-500 text-sm mt-1">
              Filters applied: 
              {category !== 'All' && !isCustomCategory && ` Category: ${category} |`}
              {isCustomCategory && customCategory && ` Category: ${customCategory} |`}
              {month && ` Month: ${month} |`}
              {startDate && ` From: ${startDate} |`}
              {endDate && ` To: ${endDate}`}
            </p>
          )}
          <p className="text-gray-500 mt-1">Total Records: {data.length}</p>
          {reportNotes && <p className="text-gray-700 mt-4 italic text-sm">Notes: {reportNotes}</p>}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading report data...</div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            {renderTable()}
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between print:flex hidden">
          <div className="text-center">
            <div className="w-48 border-b border-gray-800 mb-2 font-bold">{generatedBy}</div>
            <p className="text-sm text-gray-600">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-gray-800 mb-2"></div>
            <p className="text-sm text-gray-600">Approved By</p>
          </div>
        </div>
      </div>
    </div>
  );
}
