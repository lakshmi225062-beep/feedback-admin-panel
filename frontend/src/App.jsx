import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/feedbacks';

function RenderStars({ rating }) {
  const stars = Number(rating) || 0;
  return (
    <span style={{ color: '#f59e0b', fontSize: '15px', letterSpacing: '1px' }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

function Navbar({ isDarkMode, setIsDarkMode }) {
  return (
    <nav style={{
      padding: '18px 40px',
      background: isDarkMode ? 'linear-gradient(135deg, #090d16 0%, #111827 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      transition: 'background 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '10px', height: '10px', background: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 10px #38bdf8' }}></div>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '18px', letterSpacing: '0.3px', color: '#f8fafc' }}>EduFeedback Pro</h3>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            background: isDarkMode ? '#374151' : '#334155',
            color: '#f8fafc',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <Link to="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>Dashboard</Link>
        <Link to="/add" style={{ 
          background: '#0ea5e9', 
          color: '#fff', 
          padding: '8px 16px', 
          borderRadius: '8px', 
          textDecoration: 'none', 
          fontWeight: 600, 
          fontSize: '14px',
          boxShadow: '0 2px 10px rgba(14, 165, 233, 0.3)'
        }}>+ New Feedback</Link>
      </div>
    </nav>
  );
}

function Dashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [rowsPerPage, setRowsPerPage] = useState('5');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(API_URL);
      setFeedbacks(res.data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback entry?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchFeedbacks();
      } catch (err) {
        console.error('Error deleting feedback:', err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected entries?`)) {
      try {
        await Promise.all(selectedIds.map(id => axios.delete(`${API_URL}/${id}`)));
        fetchFeedbacks();
      } catch (err) {
        console.error('Error during bulk delete:', err);
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(displayedFeedbacks.map(item => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStarFilter('All');
    setStatusFilter('All');
    setSortBy('newest');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbacks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `feedback_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter logic
  const filteredFeedbacks = feedbacks.filter(item => {
    const courseName = item.courseName || '';
    const comments = item.feedbackComments || '';
    const matchesSearch = courseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          comments.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStar = starFilter === 'All' || Number(item.feedbackRating) === Number(starFilter);
    
    let matchesStatus = true;
    if (statusFilter === 'Needs Review') {
      matchesStatus = Number(item.feedbackRating) <= 2;
    } else if (statusFilter === 'Top Rated') {
      matchesStatus = Number(item.feedbackRating) >= 4;
    }

    return matchesSearch && matchesStar && matchesStatus;
  });

  // Sorting logic (Safely handles MongoDB string IDs via localeCompare)
  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    if (sortBy === 'rating-high') return Number(b.feedbackRating) - Number(a.feedbackRating);
    if (sortBy === 'rating-low') return Number(a.feedbackRating) - Number(b.feedbackRating);
    return String(b._id || '').localeCompare(String(a._id || ''));
  });

  // Pagination logic
  const displayedFeedbacks = rowsPerPage === 'All' 
    ? sortedFeedbacks 
    : sortedFeedbacks.slice(0, Number(rowsPerPage));

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((acc, curr) => acc + Number(curr.feedbackRating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  const ratingCounts = {
    5: feedbacks.filter(f => Number(f.feedbackRating) === 5).length,
    4: feedbacks.filter(f => Number(f.feedbackRating) === 4).length,
    3: feedbacks.filter(f => Number(f.feedbackRating) === 3).length,
    2: feedbacks.filter(f => Number(f.feedbackRating) === 2).length,
    1: feedbacks.filter(f => Number(f.feedbackRating) === 1).length,
  };

  const theme = {
    bg: isDarkMode ? '#0b0f19' : '#f8fafc',
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    textMain: isDarkMode ? '#f3f4f6' : '#0f172a',
    textMuted: isDarkMode ? '#9ca3af' : '#64748b',
    border: isDarkMode ? '#1f2937' : '#e2e8f0',
    tableHeaderBg: isDarkMode ? '#1f2937' : '#f1f5f9',
    inputBg: isDarkMode ? '#1f2937' : '#f8fafc',
    inputText: isDarkMode ? '#f9fafb' : '#0f172a'
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)' }}>
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div style={{ padding: '40px 30px', maxWidth: '1250px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', background: theme.bg, transition: 'background 0.3s ease' }}>
        
        {/* Top Analytics Grid & Rating Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ padding: '20px', background: theme.cardBg, borderRadius: '14px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Submissions</p>
              <h2 style={{ margin: '6px 0 0 0', color: theme.textMain, fontSize: '26px', fontWeight: 800 }}>{feedbacks.length}</h2>
            </div>
            <div style={{ padding: '20px', background: theme.cardBg, borderRadius: '14px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Rating</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <h2 style={{ margin: 0, color: theme.textMain, fontSize: '26px', fontWeight: 800 }}>{avgRating}</h2>
                <span style={{ color: theme.textMuted, fontSize: '14px', fontWeight: 500 }}>/ 5.0</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', background: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: '0 0 12px 0', color: theme.textMuted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating Distribution</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = ratingCounts[stars];
                const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <span style={{ color: theme.textMain, fontWeight: 600, width: '28px' }}>{stars}★</span>
                    <div style={{ flex: 1, background: theme.inputBg, height: '8px', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                      <div style={{ width: `${pct}%`, background: '#f59e0b', height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                    </div>
                    <span style={{ color: theme.textMuted, width: '20px', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '24px', background: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
            <p style={{ margin: '0 0 4px 0', color: theme.textMuted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Utilities</p>
            <button
              onClick={() => window.print()}
              style={{ 
                padding: '12px 18px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)', fontSize: '13px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span>🖨️ Print / PDF Report</span>
              <span>➔</span>
            </button>
            <button
              onClick={handleExportJSON}
              style={{ 
                padding: '12px 18px', background: isDarkMode ? '#38bdf8' : '#0f172a', color: isDarkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontSize: '13px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span>📥 Export JSON Dataset</span>
              <span>➔</span>
            </button>
          </div>

        </div>

        {/* Filter, Star Pills, Sort, Rows, Search & Reset Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '20px', background: theme.cardBg, padding: '20px 24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'background 0.3s ease' }}>
          <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Triage</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'Needs Review', 'Top Rated'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '7px 12px', borderRadius: '8px', border: '1px solid', borderColor: statusFilter === status ? (isDarkMode ? '#38bdf8' : '#0f172a') : theme.border, background: statusFilter === status ? (isDarkMode ? '#38bdf8' : '#0f172a') : theme.inputBg, color: statusFilter === status ? (isDarkMode ? '#0f172a' : '#fff') : theme.textMain, fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Star Filter</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['All', '5', '4', '3', '2', '1'].map(star => (
                  <button
                    key={star}
                    onClick={() => setStarFilter(star)}
                    style={{
                      padding: '7px 10px', borderRadius: '8px', border: '1px solid', borderColor: starFilter === star ? '#0ea5e9' : theme.border, background: starFilter === star ? '#0ea5e9' : theme.inputBg, color: starFilter === star ? '#fff' : theme.textMain, fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {star === 'All' ? 'All' : `${star}★`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort Order</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.inputText, fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                <option value="newest">Newest First</option>
                <option value="rating-high">Rating: High to Low</option>
                <option value="rating-low">Rating: Low to High</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rows</span>
              <select
                value={rowsPerPage}
                onChange={e => setRowsPerPage(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.inputText, fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="All">All</option>
              </select>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Feedbacks</span>
              <input
                type="text"
                placeholder="Search course or comments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, width: '200px', fontSize: '13px', outline: 'none', background: theme.inputBg, color: theme.inputText }}
              />
            </div>
            <button
              onClick={handleClearFilters}
              title="Reset all filters"
              style={{ padding: '8px 12px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px', height: '37px' }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Bulk Actions Header */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0284c7', color: '#fff', padding: '12px 20px', borderRadius: '12px', marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>
            <span>{selectedIds.length} item(s) selected</span>
            <button
              onClick={handleBulkDelete}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              🗑️ Delete Selected
            </button>
          </div>
        )}

        {/* Main Table Container */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: `1px solid ${theme.border}`, background: theme.cardBg, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'background 0.3s ease' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <th style={{ padding: '16px 14px', width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={displayedFeedbacks.length > 0 && selectedIds.length === displayedFeedbacks.length}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '16px 20px', fontWeight: 700 }}>Course ID</th>
                <th style={{ padding: '16px 20px', fontWeight: 700 }}>Course Name</th>
                <th style={{ padding: '16px 20px', fontWeight: 700 }}>Duration</th>
                <th style={{ padding: '16px 20px', fontWeight: 700 }}>Rating</th>
                <th style={{ padding: '16px 20px', fontWeight: 700 }}>Comments</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: theme.textMuted, fontSize: '15px' }}>No matching feedback records found.</td>
                </tr>
              ) : (
                displayedFeedbacks.map(item => {
                  const isSelected = selectedIds.includes(item._id);
                  return (
                    <tr key={item._id} style={{ borderBottom: `1px solid ${theme.border}`, background: isSelected ? (isDarkMode ? '#1e293b' : '#f0fdf4') : 'transparent' }}>
                      <td style={{ padding: '18px 14px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => handleToggleSelect(item._id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '18px 20px', fontSize: '13px', color: theme.textMuted, fontFamily: 'monospace', fontWeight: 500 }}>{item._id}</td>
                      <td style={{ padding: '18px 20px', fontWeight: 600, color: theme.textMain, fontSize: '15px' }}>{item.courseName}</td>
                      <td style={{ padding: '18px 20px', color: theme.textMuted, fontWeight: 500 }}>{item.courseDuration}</td>
                      <td style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <RenderStars rating={item.feedbackRating} />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: theme.textMain }}>({item.feedbackRating}/5)</span>
                        </div>
                        {Number(item.feedbackRating) <= 2 && (
                          <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            ⚠️ Needs Review
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '18px 20px', color: theme.textMuted, maxWidth: '280px', lineHeight: '1.4' }}>{item.feedbackComments}</td>
                      <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <Link to={`/edit/${item._id}`}>
                            <button style={{ padding: '8px 14px', border: 'none', background: '#0284c7', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Edit</button>
                          </Link>
                          <button onClick={() => handleDelete(item._id)} style={{ padding: '8px 14px', border: 'none', background: '#ef4444', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FeedbackForm() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('feedback_form_draft');
    return saved ? JSON.parse(saved) : { courseName: '', courseDuration: '', feedbackComments: '', feedbackRating: 5 };
  });
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      axios.get(API_URL).then(res => {
        const item = res.data.find(f => f._id === id);
        if (item) setFormData(item);
      }).catch(err => console.error('Error fetching item for edit:', err));
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      localStorage.setItem('feedback_form_draft', JSON.stringify(formData));
    }
  }, [formData, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`${API_URL}/${id}`, formData);
      } else {
        await axios.post(API_URL, formData);
        localStorage.removeItem('feedback_form_draft');
      }
      navigate('/');
    } catch (err) {
      console.error('Error saving feedback:', err);
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '520px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginTop: 0, color: '#0f172a', fontWeight: 800, fontSize: '24px', marginBottom: '8px' }}>
          {id ? 'Update Course Feedback' : 'Create Course Feedback'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Fill in the curriculum and evaluation details below.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Course Name</label>
            <input placeholder="e.g. Advanced Operating Systems" value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px', background: '#f8fafc', outline: 'none' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Course Duration</label>
            <input placeholder="e.g. 6 Weeks" value={formData.courseDuration} onChange={e => setFormData({...formData, courseDuration: e.target.value})} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px', background: '#f8fafc', outline: 'none' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Feedback Rating (1 - 5)</label>
            <input type="number" min="1" max="5" value={formData.feedbackRating} onChange={e => setFormData({...formData, feedbackRating: e.target.value})} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px', background: '#f8fafc', outline: 'none' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Feedback Comments</label>
            <textarea placeholder="Write constructive feedback notes..." value={formData.feedbackComments} onChange={e => setFormData({...formData, feedbackComments: e.target.value})} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', height: '110px', boxSizing: 'border-box', fontSize: '14px', background: '#f8fafc', outline: 'none', resize: 'vertical' }} required />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
              {id ? 'Save Changes' : 'Submit Feedback'}
            </button>
            <Link to="/" style={{ flex: 1, textDecoration: 'none' }}>
              <button type="button" style={{ width: '100%', padding: '14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<FeedbackForm />} />
        <Route path="/edit/:id" element={<FeedbackForm />} />
      </Routes>
    </BrowserRouter>
  );
}