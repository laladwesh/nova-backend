const School = require('../models/School');

const createSchool = async (req, res) => {
  try {
    // Add your school creation logic here
    // This is a placeholder implementation
    const schoolData = req.body;
    
    // Validate required fields
    if (!schoolData.name) {
      return res.status(400).json({ message: 'School name is required' });
    }
    
    // Add school creation logic here
    // const newSchool = await School.create(schoolData);
    
    res.status(201).json({ 
      message: 'School created successfully',
      // school: newSchool 
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const listSchools = async (req, res) => {
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

const getSchoolWithFullDetails = async (req, res) => {
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

module.exports = {
  createSchool,
  listSchools,
  getSchoolWithFullDetails
};
