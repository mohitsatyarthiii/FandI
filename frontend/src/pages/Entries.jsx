import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import EntryCard from '../components/EntryCard';
import { useAuth } from '../context/AuthContext';
import { 
  getEntriesAPI, 
  createEntryAPI, 
  updateEntryAPI,
  addNoteAPI,
  convertToTaskAPI 
} from '../api/axios';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  X,
  AlertCircle
} from 'lucide-react';

const Entries = () => {
  const { user, isAdmin, isManager, isStaff } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    clientCity: '',
    location: user?.location || 'mathura',
    enquiryType: 'service',
    enquiryDescription: '',
    priority: 'medium'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const locations = ['mathura', 'agra', 'noida'];
  const enquiryTypes = ['service', 'product', 'complaint', 'general', 'other'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['new', 'assigned', 'in-progress', 'completed', 'cancelled'];

  useEffect(() => {
    fetchEntries();
  }, [selectedLocation, selectedStatus]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (isAdmin) {
        if (selectedLocation !== 'all') params.location = selectedLocation;
      } else {
        params.location = user.location;
      }
      
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await getEntriesAPI(params);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Fetch entries error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await createEntryAPI(formData);
      if (response.data.success) {
        setSuccess('Entry created successfully!');
        setShowAddModal(false);
        setFormData({
          clientName: '', clientPhone: '', clientEmail: '', clientAddress: '', 
          clientCity: '', location: user.location, enquiryType: 'service',
          enquiryDescription: '', priority: 'medium'
        });
        fetchEntries();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create entry');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    try {
      await addNoteAPI(selectedEntry._id, noteText);
      setSuccess('Note added successfully!');
      setShowNoteModal(false);
      setNoteText('');
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add note');
    }
  };

  const handleConvertToTask = async (taskData) => {
    try {
      await convertToTaskAPI(selectedEntry._id, taskData);
      setSuccess('Task created successfully!');
      setShowConvertModal(false);
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to convert to task');
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.clientPhone?.includes(searchTerm) ||
    entry.enquiryDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationEntries = (location) => {
    return entries.filter(e => e.location === location);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              Form Entries
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? 'View all entries across locations' : `View entries in ${user?.location}`}
            </p>
          </div>
          
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              New Entry
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Location Stats - Admin Only */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-indigo-600" />
              Location-wise Entries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {locations.map(loc => {
                const count = getLocationEntries(loc).length;
                return (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedLocation === loc 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="capitalize font-medium text-gray-700">{loc}</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{count}</p>
                    <p className="text-xs text-gray-500 mt-1">entries</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name, phone, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status} className="capitalize">{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Entries Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'Create your first entry to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map(entry => (
              <EntryCard
                key={entry._id}
                entry={entry}
                onView={() => {
                  setSelectedEntry(entry);
                  setShowNoteModal(true);
                }}
                onAssign={(entry) => {
                  setSelectedEntry(entry);
                  setShowConvertModal(true);
                }}
                onConvertToTask={(isManager || isAdmin) ? () => {
                  setSelectedEntry(entry);
                  setShowConvertModal(true);
                } : null}
              />
            ))}
          </div>
        )}

        {/* Add Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Entry</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.clientCity}
                      onChange={(e) => setFormData({...formData, clientCity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({...formData, clientAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry Type *</label>
                    <select
                      required
                      value={formData.enquiryType}
                      onChange={(e) => setFormData({...formData, enquiryType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {enquiryTypes.map(type => (
                        <option key={type} value={type} className="capitalize">{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {priorities.map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.enquiryDescription}
                    onChange={(e) => setFormData({...formData, enquiryDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {!isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg capitalize"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                  >
                    Create Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showNoteModal && selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">{selectedEntry.clientName}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedEntry.enquiryType}</p>
              </div>
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Note
                </button>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Entries;