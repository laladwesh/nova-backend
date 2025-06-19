import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaSpinner,
  FaSearch,
  FaUserShield,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaSchool,
  FaUsers,
  FaTrashAlt,
} from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";
import { AddEntityPanel } from "../components/AddEntityPanel";

export const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // — state for the main school object —
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // — search filters —
  const [search, setSearch] = useState({
    teachers: "",
    students: "",
    parents: "",
  });

  // — logout handler —
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    navigate("/pixelgrid");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${detailType}?`)) return;
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      // build URL: users for Admin, teachers, students, parents, classes
      const key =
        detailType === "Admin"
          ? "users"
          : detailType === "Class"
          ? "classes"
          : detailType.toLowerCase() + "s";
      const url = `/api/${key}/${detailData._id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message);
      setDetailType(""); // close modal
      fetchSchool(); // refresh lists
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // — detail modal & edit state —
  const [detailType, setDetailType] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const fetchSchool = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/schools/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        cache: "no-store",
      });
      const body = await res.json();
      if (res.ok && body.success) setSchool(body.data.school);
      else setError(body.message || "Failed to load school");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchool();
  }, [fetchSchool]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <FaSpinner className="animate-spin text-gray-500 text-3xl" />
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );

  const renderValue = (val) => {
    if (val == null) return "—";
    if (Array.isArray(val)) {
      if (!val.length) return "—";
      if (typeof val[0] === "object")
        return val.map((v) => v.name || v._id).join(", ");
      return val.join(", ");
    }
    if (typeof val === "object") return val.name || JSON.stringify(val);
    return String(val);
  };

  const hideScroll = { scrollbarWidth: "none", msOverflowStyle: "none" };

  // -----------------------
  // Detail fetchers below
  // -----------------------
  const seedForm = (type, data) => {
    switch (type) {
      case "Parent":
        return { name: data.name, email: data.email, phone: data.phone };
      case "Teacher":
        return {
          name: data.name,
          email: data.email,
          phone: data.phone,
          roles: data.roles,
          teachingSubs: data.teachingSubs,
          salaryPaid: data.salaryPaid,
        };
      case "Student":
        return {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          dob: data.dob?.slice(0, 10),
        };
      case "Class":
        return {
          name: data.name,
          grade: data.grade,
          section: data.section,
          year: data.year,
        };
      default:
        return {};
    }
  };

  const openDetail = async (type, endpoint, readOnly = false) => {
    setDetailType(type);
    setDetailData(null);
    setDetailLoading(true);
    setIsReadOnly(readOnly);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(endpoint, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
        cache: "no-store",
      });
      const body = await res.json();
      const data = body.data[type.toLowerCase()] || body.data;
      setDetailData(data);
      setIsEditing(false);
      setEditForm(seedForm(type, data));
    } catch {
      setDetailData({ error: "Network error" });
    } finally {
      setDetailLoading(false);
    }
  };
  const openTeacherDetail = (id) =>
    openDetail("Teacher", `/api/teachers/${id}`, false);
  const openStudentDetail = (id) =>
    openDetail("Student", `/api/students/${id}`, false);
  const openParentDetail = (id) =>
    openDetail("Parent", `/api/parents/${id}`, false);
  const openClassDetail = (id) =>
    openDetail("Class", `/api/classes/${id}`, false);
  const openAdminDetail = (id) => openDetail("User", `/api/users/${id}`, true); // admin under /api/users

  const filtered = (list, q) =>
    list.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()));

  // render form inputs when editing
  const renderEditFields = () => {
    return Object.entries(editForm).map(([field, value]) => (
      <div key={field} className="flex flex-col">
        <dt className="font-medium capitalize">{field}</dt>
        <input
          type={field === "dob" ? "date" : "text"}
          value={value || ""}
          onChange={(e) =>
            setEditForm((f) => ({ ...f, [field]: e.target.value }))
          }
          className="mt-1 p-2 border rounded"
        />
      </div>
    ));
  };

  // submit updated data
  const submitEdit = async () => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const key =
        detailType === "Admin" ? "users" : detailType.toLowerCase() + "s";
      const url = `/api/${key}/${detailData._id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(editForm),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message);
      const updated = body.data[detailType.toLowerCase()] || body.data;
      setDetailData(updated);
      setSchool((s) => {
        const listKey = detailType.toLowerCase() + "s";
        return {
          ...s,
          [listKey]: s[listKey].map((item) =>
            item._id === updated._id ? { ...item, ...updated } : item
          ),
        };
      });
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };
  return (
    <div className="min-h-screen no-scrollbar bg-gray-100 py-8 px-16">
      <div className="max-w-full mx-auto flex space-x-8 space-y-8">
        <div className="flex-1 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{school.name}</h1>
            <div />
            <button
              onClick={handleLogout}
              className="flex items-center text-red-600 hover:text-red-800"
            >
              <FaSignOutAlt className="mr-1" />
              Logout
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Admins */}
            <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
              <FaUserShield className="text-3xl text-indigo-600 mb-2" />
              <p className="text-2xl font-semibold text-gray-800">
                {school.admins.length}
              </p>
              <p className="text-gray-500">Admins</p>
            </div>
            {/* Teachers */}
            <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
              <FaChalkboardTeacher className="text-3xl text-indigo-600 mb-2" />
              <p className="text-2xl font-semibold text-gray-800">
                {school.teachers.length}
              </p>
              <p className="text-gray-500">Teachers</p>
            </div>
            {/* Students */}
            <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
              <FaUserGraduate className="text-3xl text-indigo-600 mb-2" />
              <p className="text-2xl font-semibold text-gray-800">
                {school.students.length}
              </p>
              <p className="text-gray-500">Students</p>
            </div>
            {/* Classes */}
            <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
              <FaSchool className="text-3xl text-indigo-600 mb-2" />
              <p className="text-2xl font-semibold text-gray-800">
                {school.classes.length}
              </p>
              <p className="text-gray-500">Classes</p>
            </div>
            {/* Parents */}
            <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
              <FaUsers className="text-3xl text-indigo-600 mb-2" />
              <p className="text-2xl font-semibold text-gray-800">
                {school.parents.length}
              </p>
              <p className="text-gray-500">Parents</p>
            </div>
          </div>

          {/* General Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              General Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
              <div>
                <dt className="font-medium">Email</dt>
                <dd>{renderValue(school.email)}</dd>
              </div>
              <div>
                <dt className="font-medium">Address</dt>
                <dd>{renderValue(school.address)}</dd>
              </div>
              <div>
                <dt className="font-medium">Phone</dt>
                <dd>{renderValue(school.phone)}</dd>
              </div>
              <div>
                <dt className="font-medium">Created</dt>
                <dd>{new Date(school.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="font-medium">Updated</dt>
                <dd>{new Date(school.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {/* Teachers List */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-3">
              <FaChalkboardTeacher className="text-2xl text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Teachers</h3>
              <div className="relative ml-auto">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teachers"
                  value={search.teachers}
                  onChange={(e) =>
                    setSearch((s) => ({ ...s, teachers: e.target.value }))
                  }
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <ul
              style={hideScroll}
              className="max-h-48 overflow-y-auto hide-scrollbar divide-y divide-gray-200 text-gray-700"
            >
              {filtered(school.teachers, search.teachers).map((t) => (
                <li
                  key={t._id}
                  className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => openTeacherDetail(t._id)}
                >
                  <span>{t.name}</span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Details
                  </button>
                </li>
              ))}
              {!filtered(school.teachers, search.teachers).length && (
                <li className="py-2 text-gray-400 italic">No matches</li>
              )}
            </ul>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-3">
              <FaUserGraduate className="text-2xl text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Students</h3>
              <div className="relative ml-auto">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students"
                  value={search.students}
                  onChange={(e) =>
                    setSearch((s) => ({ ...s, students: e.target.value }))
                  }
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <ul
              style={hideScroll}
              className="max-h-48 overflow-y-auto hide-scrollbar divide-y divide-gray-200 text-gray-700"
            >
              {filtered(school.students, search.students).map((s) => (
                <li
                  key={s._id}
                  className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => openStudentDetail(s._id)}
                >
                  <span>{s.name}</span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Details
                  </button>
                </li>
              ))}
              {!filtered(school.students, search.students).length && (
                <li className="py-2 text-gray-400 italic">No matches</li>
              )}
            </ul>
          </div>

          {/* Parents List */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-3">
              <FaUsers className="text-2xl text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Parents</h3>
              <div className="relative ml-auto">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search parents"
                  value={search.parents}
                  onChange={(e) =>
                    setSearch((s) => ({ ...s, parents: e.target.value }))
                  }
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <ul
              style={hideScroll}
              className="max-h-48 overflow-y-auto hide-scrollbar divide-y divide-gray-200 text-gray-700"
            >
              {filtered(school.parents, search.parents).map((p) => (
                <li
                  key={p._id}
                  className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => openParentDetail(p._id)}
                >
                  <span>{p.name}</span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Details
                  </button>
                </li>
              ))}
              {!filtered(school.parents, search.parents).length && (
                <li className="py-2 text-gray-400 italic">No matches</li>
              )}
            </ul>
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-3">
              <FaSchool className="text-2xl text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Classes</h3>
            </div>
            <ul className="divide-y divide-gray-200 text-gray-700">
              {school.classes.map((c) => (
                <li
                  key={c._id}
                  className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => openClassDetail(c._id)}
                >
                  <span>{c.name}</span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Details
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Admins List */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-3">
              <FaUserShield className="text-2xl text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Admins</h3>
            </div>
            <ul className="divide-y divide-gray-200 text-gray-700">
              {school.admins.map((a) => (
                <li
                  key={a._id}
                  className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => openAdminDetail(a._id)}
                >
                  <span>{a.name}</span>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Details
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AddEntityPanel
          schoolId={id}
          classes={school.classes}
          teachers={school.teachers}
          students={school.students}
          onAdded={() => fetchSchool()}
        />
      </div>

      {/* Detail Modal */}
      {detailType && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setDetailType("")}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-2xl font-semibold text-gray-800">
                {detailType} Details
              </h3>
              {!isReadOnly && (
                <div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(seedForm(detailData));
                      }}
                      className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() =>
                      isEditing ? submitEdit() : setIsEditing(true)
                    }
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {isEditing ? "Save" : <FaEdit size={20} />}
                  </button>
                  {!isEditing && (
                    <button
                      onClick={handleDelete}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <FaTrashAlt size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12">
                <FaSpinner className="animate-spin text-gray-500 text-3xl" />
              </div>
            ) : detailData?.error ? (
              <p className="text-red-500 text-center">{detailData.error}</p>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                {isEditing
                  ? renderEditFields()
                  : Object.entries(detailData).map(([key, val]) => (
                      <div key={key} className="flex flex-col">
                        <dt className="font-medium text-gray-800">{key}</dt>
                        <dd className="mt-1">{renderValue(val)}</dd>
                      </div>
                    ))}
              </dl>
            )}
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
