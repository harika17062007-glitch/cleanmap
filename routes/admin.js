const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in-progress' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    const recentReports = await Report.find()
      .populate('user', 'name email')
      .sort({ reportedAt: -1 })
      .limit(10);

    const reportsByWasteType = await Report.aggregate([
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers,
          totalReports,
          pendingReports,
          inProgressReports,
          resolvedReports
        },
        recentReports,
        reportsByWasteType
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let query = { role: 'user' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, wasteType } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (wasteType) query.wasteType = wasteType;

    const reports = await Report.find(query)
      .populate('user', 'name email phone')
      .sort({ reportedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const reportsLast30Days = await Report.aggregate([
      { $match: { reportedAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$reportedAt" } },
          count: { $sum: 1 }
        },
        sort: { _id: 1 }
      }
    ]);

    const wasteTypeDistribution = await Report.aggregate([
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 },
          percentage: { $multiply: [{ $divide: [{ $sum: 1 }, { $sum: "$count" }] }, 100] }
        }
      }
    ]);

    const statusDistribution = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const resolutionRate = await Report.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        reportsTrend: reportsLast30Days,
        wasteTypeDistribution,
        statusDistribution,
        resolutionRate: resolutionRate[0] ? {
          rate: (resolutionRate[0].resolved / resolutionRate[0].total * 100).toFixed(2),
          total: resolutionRate[0].total,
          resolved: resolutionRate[0].resolved
        } : { rate: 0, total: 0, resolved: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
