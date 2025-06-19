const { Parent } = require("../models");

exports.getParentWithFullDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the parent by ID and populate student details
    const parent = await Parent.findById(id).populate({
      path: "students",
      select: "name studentId",
    });
    if (!parent) {
      return res
        .status(404)
        .json({ success: false, message: "Parent not found." });
    }
    console.log("Parent found:", parent.students);
    res.json({
      success: true,
      data: {
        parent: {
          _id: parent._id,
          Name: parent.name,
          Email: parent.email,
          Phone: parent.phone,
          Students: parent.students.map((student) => ({
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
          })),
        },
      },
    });
  } catch (err) {
    console.error("getParentWithFullDetails error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    // Find the parent by ID
    const parent = await Parent.findById(id);
    if (!parent) {
      return res
        .status(404)
        .json({ success: false, message: "Parent not found." });
    }
    // Update parent details
    parent.name = name || parent.name;
    parent.email = email || parent.email;
    parent.phone = phone || parent.phone;
    // Save the updated parent
    const updatedParent = await parent.save();
    res.json({
      success: true,
      data: {
        parent: {
          _id: updatedParent._id,
          Name: updatedParent.name,
          Email: updatedParent.email,
          Phone: updatedParent.phone,
        },
      },
    });
  } catch (err) {
    console.error("updateParent error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
