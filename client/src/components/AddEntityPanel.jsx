// AddEntityPanel.jsx
import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserTie,
  FaTimes,
  FaFileExcel,
} from "react-icons/fa";
import * as XLSX from "xlsx";

const TABS = [
  { key: "teacher", label: "Teacher", icon: <FaChalkboardTeacher /> },
  { key: "student", label: "Student", icon: <FaUserGraduate /> },
  { key: "class", label: "Class", icon: <FaUserTie /> },
  { key: "bulk", label: "Bulk Upload", icon: <FaFileExcel /> },
];

const TEMPLATE_HEADERS = [
  "name",
  "email",
  "password",
  "role",
  "studentId",
  "classId",
  "dob",
  "gender",
  "parents",
];

export function AddEntityPanel({ schoolId, classes, teachers, students, onAdded }) {
  const initialForm = {
    name: "",
    email: "",
    password: "",
    role: "",
    studentId: "",
    classId: "",
    dob: "",
    gender: "",
    parents: [],
    grade: "",
    section: "",
    year: "",
    teachers: [],
    students: [],
  };

  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState({ bulk: false, submit: false });

  const reset = () => {
    setMode(null);
    setForm(initialForm);
    setPreview([]);
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(l => ({ ...l, bulk: true }));
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      setPreview(rows);
    } catch (err) {
      toast.error("Failed to parse file");
    } finally {
      setLoading(l => ({ ...l, bulk: false }));
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "bulk-upload-template.xlsx"
    );
  };

  const submitBulk = async () => {
    if (!preview.length) {
      toast.error("No data to upload");
      return;
    }
    setLoading(l => ({ ...l, bulk: true }));
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch("/api/auth/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ schoolId, rows: preview }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Bulk upload failed");
      toast.success(
        `Upload complete: ${body.successCount} succeeded, ${body.failures.length} failed`
      );
      console.table(body.failures);
      reset();
      onAdded?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(l => ({ ...l, bulk: false }));
    }
  };

  const addParent = () =>
    setForm(f => ({
      ...f,
      parents: [...f.parents, { name: "", email: "", password: "", phone: "" }],
    }));

  const removeParent = idx =>
    setForm(f => ({
      ...f,
      parents: f.parents.filter((_, i) => i !== idx),
    }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(l => ({ ...l, submit: true }));
    try {
      const token = localStorage.getItem("accessToken") || "";
      let res, body;
      if (mode === "class") {
        res = await fetch("/api/classes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify({
            grade: form.grade,
            section: form.section,
            year: form.year,
            teachers: form.teachers,
            students: form.students,
            schoolId,
          }),
        });
        body = await res.json();
        if (!res.ok) throw new Error(body.message || "Error adding class");
        toast.success("Class created!");
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: mode,
          schoolId,
          ...(mode === "student" && {
            studentId: form.studentId,
            classId: form.classId,
            dob: form.dob,
            gender: form.gender,
            parents: form.parents,
          }),
        };
        res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        body = await res.json();
        if (!res.ok) throw new Error(body.message || "Error signing up");
        toast.success(
          `${mode.charAt(0).toUpperCase() + mode.slice(1)} added!`
        );
      }
      reset();
      onAdded?.();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(l => ({ ...l, submit: false }));
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <aside className="w-80 md:w-96 bg-white rounded-xl shadow-xl p-6 sticky top-8 h-[calc(90vh-4rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {mode
              ? `New ${mode.charAt(0).toUpperCase() + mode.slice(1)}`
              : "Add New"}
          </h2>
          {mode && (
            <button onClick={reset} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={18} />
            </button>
          )}
        </div>

        <nav className="flex space-x-2 border-b border-gray-200 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setMode(tab.key);
                setForm(initialForm);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 font-medium text-sm rounded-t-lg ${
                mode === tab.key
                  ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {mode === "bulk" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={downloadTemplate}
              disabled={loading.bulk}
              className="text-indigo-600 hover:underline mb-2"
            >
              ↓ Download Template
            </button>
            <label className="block text-gray-700">Select Excel file</label>
            <input
              accept=".xlsx,.xls"
              type="file"
              disabled={loading.bulk}
              onChange={handleFile}
              className="border rounded p-2 w-full"
            />
            {preview.length > 0 && (
              <>
                <p className="font-medium">Preview:</p>
                <div className="max-h-40 overflow-auto border p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {Object.keys(preview[0]).map(h => (
                          <th key={h} className="px-1">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-1">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={submitBulk}
                  disabled={loading.bulk}
                  className="mt-2 w-full bg-indigo-600 text-white py-2 rounded"
                >
                  {loading.bulk ? "Uploading..." : "Upload All"}
                </button>
              </>
            )}
          </div>
        ) : mode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                placeholder={`Enter ${mode} name`}
              />
            </div>
            {(mode === "teacher" || mode === "student") && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e =>
                      setForm(f => ({ ...f, email: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                    placeholder="you@school.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Password</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={e =>
                      setForm(f => ({ ...f, password: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
            {mode === "student" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Student ID</label>
                    <input
                      required
                      value={form.studentId}
                      onChange={e =>
                        setForm(f => ({ ...f, studentId: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Class</label>
                    <select
                      required
                      value={form.classId}
                      onChange={e =>
                        setForm(f => ({ ...f, classId: e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a class…</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1">DOB</label>
                      <input
                        required
                        type="date"
                        value={form.dob}
                        onChange={e =>
                          setForm(f => ({ ...f, dob: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">Gender</label>
                      <select
                        required
                        value={form.gender}
                        onChange={e =>
                          setForm(f => ({ ...f, gender: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                      >
                        <option value="">Select…</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-800">Parents</h3>
                  {form.parents.map((p, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => removeParent(i)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes />
                      </button>
                      {["name", "email", "password", "phone"].map(field => (
                        <div key={field}>
                          <label
                            className="block text-gray-700 mb-1 capitalize"
                          >
                            Parent {field}
                          </label>
                          <input
                            required
                            type={
                              field === "email"
                                ? "email"
                                : field === "password"
                                ? "password"
                                : "text"
                            }
                            value={p[field]}
                            onChange={e => {
                              const updated = [...form.parents];
                              updated[i] = {
                                ...updated[i],
                                [field]: e.target.value,
                              };
                              setForm(f => ({ ...f, parents: updated }));
                            }}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addParent}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Another Parent
                  </button>
                </div>
              </div>
            )}
            {mode === "class" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {["grade", "section"].map(f => (
                    <div key={f}>
                      <label className="block text-gray-700 mb-1">
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </label>
                      <input
                        required
                        value={form[f]}
                        onChange={e =>
                          setForm(p => ({ ...p, [f]: e.target.value }))
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-gray-700 mb-1">Year</label>
                    <input
                      required
                      type="number"
                      value={form.year}
                      onChange={e =>
                        setForm(p => ({ ...p, year: +e.target.value }))
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:ring-indigo-500"
                      placeholder="2025"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">
                    Assign Teachers
                  </label>
                  <div className="space-y-2 max-h-32 overflow-auto border rounded-lg p-2">
                    {teachers.map(t => (
                      <label key={t._id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={t._id}
                          checked={form.teachers.includes(t._id)}
                          onChange={e => {
                            const { checked, value } = e.target;
                            setForm(f => ({
                              ...f,
                              teachers: checked
                                ? [...f.teachers, value]
                                : f.teachers.filter(id => id !== value),
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-800">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">
                    Assign Students
                  </label>
                  <div className="space-y-2 max-h-32 overflow-auto border rounded-lg p-2">
                    {students.map(s => (
                      <label key={s._id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={s._id}
                          checked={form.students.includes(s._id)}
                          onChange={e => {
                            const { checked, value } = e.target;
                            setForm(f => ({
                              ...f,
                              students: checked
                                ? [...f.students, value]
                                : f.students.filter(id => id !== value),
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-800">{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading.submit}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition"
            >
              {loading.submit
                ? "Processing..."
                : mode === "class"
                ? "Create Class"
                : `Add ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
            </button>
          </form>
        ) : (
          <p className="text-gray-400 italic">
            Select a tab above to start creating a new entity.
          </p>
        )}
      </aside>
    </>
  );
}
