import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }    from 'react-router-dom';
import {
  FaArrowLeft,
  FaEdit,
  FaSpinner,
  FaSearch,
  FaUserShield,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaSchool,
  FaUsers
} from 'react-icons/fa';

export const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [school, setSchool]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState({ teachers: '', students: '', parents: '' });
  const [detailType, setDetailType]       = useState('');
  const [detailData, setDetailData]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const singularMap = {
    teachers: 'teacher',
    students: 'student',
    parents:  'parent',
    classes:  'classe',
    admins:   'user'
  };

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res   = await fetch(`/api/schools/${id}`, {
          headers: { 'Content-Type':'application/json', Authorization: token ? `Bearer ${token}` : undefined }
        });
        const body = await res.json();
        if (res.ok && body.success) setSchool(body.data.school);
        else setError(body.message || 'Failed to load');
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <FaSpinner className="animate-spin text-gray-500 text-3xl"/>
    </div>
  );
  if (error) return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <p className="text-red-500">{error}</p>
    </div>
  );

  const renderValue = val => {
    if (val == null) return '—';
    if (Array.isArray(val)) {
      if (!val.length) return '—';
      // array of objects?
      if (typeof val[0] === 'object') {
        return val.map(v => v.name || v._id).join(', ');
      }
      return val.join(', ');
    }
    if (typeof val === 'object') {
      return val.name || JSON.stringify(val);
    }
    return String(val);
  };

  const openDetail = async (listKey, itemId) => {
    const singular = singularMap[listKey];
    if (!singular) return;
    setDetailType(singular);
    setDetailData(null);
    setDetailLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res2  = await fetch(`/api/${singular}s/${itemId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        cache: 'no-store'
      });
      const b2 = await res2.json();
      const payload = b2.data[singular] ?? b2.data;
      setDetailData(payload);
    } catch {
      setDetailData({ error: 'Network error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = (list, q) =>
    list.filter(i => i.name.toLowerCase().includes(q.trim().toLowerCase()));

  const hideScroll = { scrollbarWidth:'none', msOverflowStyle:'none' };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="mr-2"/>Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{school.name}</h1>
          <div/>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {key:'admins',   icon:FaUserShield,       label:'Admins',   value:school.admins.length},
            {key:'teachers', icon:FaChalkboardTeacher,label:'Teachers', value:school.teachers.length},
            {key:'students', icon:FaUserGraduate,     label:'Students', value:school.students.length},
            {key:'classes',  icon:FaSchool,           label:'Classes',  value:school.classes.length},
            {key:'parents',  icon:FaUsers,            label:'Parents',  value:school.parents.length},
          ].map(({key,icon,label,value})=>(
            <div key={key}
                 className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
              {React.createElement(icon,{className:'text-3xl text-indigo-600 mb-2'})}
              <p className="text-2xl font-semibold text-gray-800">{value}</p>
              <p className="text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* General Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">General Information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            {[
              ['Email',    school.email],
              ['Address',  school.address],
              ['Phone',    school.phone],
              ['Created',  new Date(school.createdAt).toLocaleDateString()],
              ['Updated',  new Date(school.updatedAt).toLocaleDateString()]
            ].map(([label,val])=>(
              <div key={label}>
                <dt className="font-medium">{label}</dt>
                <dd>{renderValue(val)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Searchable Lists */}
        {['teachers','students','parents'].map(listKey=>{
          const Icon = {
            teachers: FaChalkboardTeacher,
            students: FaUserGraduate,
            parents:  FaUsers
          }[listKey];
          return (
            <div key={listKey} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center mb-3">
                <Icon className="text-2xl text-gray-600 mr-2"/>
                <h3 className="flex-1 text-lg font-medium text-gray-800 capitalize">
                  {listKey}
                </h3>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    type="text"
                    placeholder={`Search ${listKey}`}
                    value={search[listKey]}
                    onChange={e=>setSearch(s=>({...s,[listKey]:e.target.value}))}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <ul style={hideScroll}
                  className="max-h-48 overflow-y-auto hide-scrollbar
                             divide-y divide-gray-200 text-gray-700">
                {filtered(school[listKey],search[listKey]).map(item=>(
                  <li key={item._id}
                      className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                      onClick={()=>openDetail(listKey,item._id)}>
                    <span>{item.name}</span>
                    <button className="text-indigo-600 hover:text-indigo-800">
                      Details
                    </button>
                  </li>
                ))}
                {!filtered(school[listKey],search[listKey]).length && (
                  <li className="py-2 text-gray-400 italic">No matches</li>
                )}
              </ul>
            </div>
          );
        })}

        {/* Classes & Admins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['classes','admins'].map(listKey=>{
            const Icon = listKey==='classes' ? FaSchool : FaUserShield;
            return (
              <div key={listKey} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <Icon className="text-2xl text-gray-600 mr-2"/>
                  <h3 className="text-lg font-medium text-gray-800 capitalize">
                    {listKey}
                  </h3>
                </div>
                <ul className="divide-y divide-gray-200 text-gray-700">
                  {school[listKey].map(item=>(
                    <li key={item._id}
                        className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                        onClick={()=>openDetail(listKey,item._id)}>
                      <span>{item.name}</span>
                      <button className="text-indigo-600 hover:text-indigo-800">
                        Details
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {detailType && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm
                        flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 relative">
            {/* Edit icon in header */}
            <button
              className="absolute top-4 right-12 text-gray-400 hover:text-gray-600"
            >
              <FaEdit size={20}/>
            </button>
            {/* Close button */}
            <button
              onClick={()=>setDetailType('')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >✕</button>

            {detailLoading ? (
              <div className="flex justify-center py-12">
                <FaSpinner className="animate-spin text-gray-500 text-3xl"/>
              </div>
            ) : detailData?.error ? (
              <p className="text-red-500 text-center">{detailData.error}</p>
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800 pb-2 border-b">
                  {detailType.charAt(0).toUpperCase()+detailType.slice(1)} Details
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                  {Object.entries(detailData).map(([key,val])=>(
                    <div key={key} className="flex flex-col">
                      <dt className="font-medium text-gray-800">{key}</dt>
                      <dd className="mt-1">{renderValue(val)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {/* hide-scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
