exports.listSchools = async (req, res) => {
  // Get schoolId from query params only (since route has no :schoolId param)
  const schoolId = req.query.schoolId;

  // If no schoolId is provided, proceed with listing all schools
  if (!schoolId) {
    try {
      const schools = await School.find().sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        data: { schools },
      });
    } catch (err) {
      console.error("schoolController.listSchools error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  } else {
    // If schoolId is provided, fetch that specific school
    try {
      const school = await School.findById(schoolId);
      
      if (!school) {
        return res.status(404).json({
          success: false,
          message: "School not found.",
        });
      }
      
      return res.status(200).json({
        success: true,
        data: { school },
      });
    } catch (err) {
      console.error("schoolController.listSchools error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
};

exports.getSchoolWithFullDetails = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      // Admins (User model)
      .populate({
        path: 'admins',
        select: 'name email role'
      })
      // Teachers
      .populate({
        path: 'teachers',
        select: 'teacherId name email phone roles teachingSubs'
      })
      // Students
      .populate({
        path: 'students',
        select: 'studentId name email phone gender dob address feePaid'
      })
      // Classes
      .populate({
        path: 'classes',
        select: 'name grade section year subjects analytics'
      })
      // Parents
      .populate({
        path: 'parents',
        select: 'name email phone students'
      })
      .lean();

    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: 'School not found.' });
    }

    return res.json({
      success: true,
      data: { school }
    });
  } catch (err) {
    console.error('getSchoolWithFullDetails error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error.' });
  }
};
