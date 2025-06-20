import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
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
  FaSignOutAlt,
} from "react-icons/fa";
import { AddEntityPanel } from "../components/AddEntityPanel";

export const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // — main state —
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // — search filters —
  const [search, setSearch] = useState({
    teachers: "",
    students: "",
    parents: "",
  });

  // — detail modal & edit state —
  const [detailType, setDetailType] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [editForm, setEditForm] = useState({});

  // — fetch school data —
  const fetchSchool = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/schools/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body.success)
        throw new Error(body.message || "Failed to load");
      setSchool(body.data.school);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchool();
  }, [fetchSchool]);

  // — logout —
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    navigate("/pixelgrid");
  };

  // — helper to render values —
  const renderValue = (val) => {
    if (val == null) return "—";
    if (Array.isArray(val)) {
      if (!val.length) return "—";
      return typeof val[0] === "object"
        ? val.map((v) => v.name || v._id).join(", ")
        : val.join(", ");
    }
    if (typeof val === "object") return val.name || JSON.stringify(val);
    return String(val);
  };

  // — utility for search filter —
  const filtered = (list, q) =>
    list.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()));

  // — seed edit form based on type —
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

  // — open detail modal —
  const openDetail = async (type, endpoint, readOnly = false) => {
    setDetailType(type);
    setDetailData(null);
    setDetailLoading(true);
    setIsReadOnly(readOnly);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(endpoint, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body.success)
        throw new Error(body.message || "Failed to load detail");
      const data = body.data[type.toLowerCase()] || body.data;
      setDetailData(data);
      setEditForm(seedForm(type, data));
      setIsEditing(false);
    } catch (err) {
      setDetailData({ error: err.message });
      toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };
  const openTeacherDetail = (i) => openDetail("Teacher", `/api/teachers/${i}`);
  const openStudentDetail = (i) => openDetail("Student", `/api/students/${i}`);
  const openParentDetail = (i) => openDetail("Parent", `/api/parents/${i}`);
  const openClassDetail = (i) => openDetail("Class", `/api/classes/${i}`);
  const openAdminDetail = (i) => openDetail("Admin", `/api/users/${i}`, true);

  // — delete entity —
  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${detailType}?`)) return;
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const key =
        detailType === "Admin" ? "users" : detailType.toLowerCase() + "s";
      const res = await fetch(`/api/${key}/${detailData._id}`, {
        method: "DELETE",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const body = await res.json();
      if (!res.ok || !body.success)
        throw new Error(body.message || "Delete failed");
      toast.success(`${detailType} deleted`);
      setDetailType("");
      fetchSchool();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // — submit edit —
  const submitEdit = async () => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const key =
        detailType === "Admin" ? "users" : detailType.toLowerCase() + "s";
      const res = await fetch(`/api/${key}/${detailData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(editForm),
      });
      const body = await res.json();
      if (!res.ok || !body.success)
        throw new Error(body.message || "Update failed");
      const updated = body.data[detailType.toLowerCase()] || body.data;
      setDetailData(updated);
      setSchool((s) => {
        const listKey = detailType.toLowerCase() + "s";
        return {
          ...s,
          [listKey]: s[listKey].map((item) =>
            item._id === updated._id ? updated : item
          ),
        };
      });
      toast.success(`${detailType} updated`);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <FaSpinner className="animate-spin text-gray-500 text-4xl" />
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen hide-scrollbar bg-gray-100 py-8 px-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{school.name}</h1>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800"
            disabled={loading}
          >
            <FaSignOutAlt className="mr-1" /> Logout
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              icon: FaUserShield,
              label: "Admins",
              count: school.admins.length,
            },
            {
              icon: FaChalkboardTeacher,
              label: "Teachers",
              count: school.teachers.length,
            },
            {
              icon: FaUserGraduate,
              label: "Students",
              count: school.students.length,
            },
            { icon: FaSchool, label: "Classes", count: school.classes.length },
            { icon: FaUsers, label: "Parents", count: school.parents.length },
          ].map(({ icon: Icon, label, count }) => (
            <div
              key={label}
              className="bg-white rounded-lg shadow p-5 flex flex-col items-center"
            >
              <Icon className="text-3xl text-indigo-600 mb-2" />
              <p className="text-2xl font-semibold text-gray-800">{count}</p>
              <p className="text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* General Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            General Information
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            {[
              ["Email", school.email],
              ["Address", school.address],
              ["Phone", school.phone],
              ["Created", new Date(school.createdAt).toLocaleDateString()],
              ["Updated", new Date(school.updatedAt).toLocaleDateString()],
            ].map(([dt, dd]) => (
              <div key={dt}>
                <dt className="font-medium">{dt}</dt>
                <dd>{renderValue(dd)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Lists & Panel */}
        <div className="flex space-x-8">
          <div className="flex-1 space-y-8">
            {[
              {
                icon: FaChalkboardTeacher,
                title: "Teachers",
                data: school.teachers,
                key: "teachers",
                onClick: openTeacherDetail,
              },
              {
                icon: FaUserGraduate,
                title: "Students",
                data: school.students,
                key: "students",
                onClick: openStudentDetail,
              },
              {
                icon: FaUsers,
                title: "Parents",
                data: school.parents,
                key: "parents",
                onClick: openParentDetail,
              },
              {
                icon: FaSchool,
                title: "Classes",
                data: school.classes,
                onClick: openClassDetail,
              },
              {
                icon: FaUserShield,
                title: "Admins",
                data: school.admins,
                onClick: openAdminDetail,
                readOnly: true,
              },
            ].map(({ icon: Icon, title, data, key, onClick, readOnly }) => (
              <div key={title} className="bg-white hide-scrollbar rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <Icon className="text-2xl text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">{title}</h3>
                  {key && (
                    <div className="relative ml-auto">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${title}`}
                        value={search[key]}
                        onChange={(e) =>
                          setSearch((s) => ({ ...s, [key]: e.target.value }))
                        }
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-indigo-400"
                        disabled={detailLoading}
                      />
                    </div>
                  )}
                </div>
                <ul className="max-h-48 hide-scrollbar overflow-y-auto divide-y text-gray-700">
                  {filtered(data, key ? search[key] : "").map((item) => (
                    <li
                      key={item._id}
                      className="py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                    >
                      <span onClick={() => !detailLoading && onClick(item._id)}>
                        {item.name}
                      </span>
                      <button
                        onClick={() => !detailLoading && onClick(item._id)}
                        disabled={detailLoading}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        {detailLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          "Details"
                        )}
                      </button>
                    </li>
                  ))}
                  {!filtered(data, key ? search[key] : "").length && (
                    <li className="py-2 text-gray-400 italic">No matches</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
          <AddEntityPanel
            schoolId={id}
            classes={school.classes}
            teachers={school.teachers}
            students={school.students}
            onAdded={fetchSchool}
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
                  <div className="flex items-center space-x-3">
                    {isEditing && (
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm(seedForm(detailType, detailData));
                        }}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={detailLoading}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={
                        isEditing ? submitEdit : () => setIsEditing(true)
                      }
                      disabled={detailLoading}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      {detailLoading && isEditing ? (
                        <FaSpinner className="animate-spin mr-1" />
                      ) : isEditing ? (
                        "Save"
                      ) : (
                        <FaEdit size={20} />
                      )}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={handleDelete}
                        disabled={detailLoading}
                        className="text-red-600 hover:text-red-800 flex items-center"
                      >
                        {detailLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTrashAlt size={20} />
                        )}
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
                    ? Object.entries(editForm).map(([f, v]) => (
                        <div key={f} className="flex flex-col">
                          <dt className="font-medium capitalize">{f}</dt>
                          <input
                            type={f === "dob" ? "date" : "text"}
                            value={v}
                            onChange={(e) =>
                              setEditForm((ef) => ({
                                ...ef,
                                [f]: e.target.value,
                              }))
                            }
                            className="mt-1 p-2 border rounded"
                          />
                        </div>
                      ))
                    : Object.entries(detailData).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                          <dt className="font-medium text-gray-800">{k}</dt>
                          <dd className="mt-1">{renderValue(v)}</dd>
                        </div>
                      ))}
                </dl>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};
