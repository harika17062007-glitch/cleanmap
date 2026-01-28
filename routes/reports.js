const express = require('express');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { wasteType, quantity, location, latitude, longitude, description, imageUrl } = req.body;

    const report = await Report.create({
      user: req.user._id,
      wasteType,
      quantity,
      location,
      latitude,
      longitude,
      description,
      imageUrl
    });

    const populatedReport = await Report.findById(report._id).populate('user', 'name email');

    res.status(201).json({
      success: true,
      report: populatedReport
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const reports = await Report.find(query)
      .populate('user', 'name email phone')
      .sort({ reportedAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('user', 'name email phone');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (req.user.role !== 'admin' && report.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (status === 'resolved') {
      report.resolvedAt = new Date();
    }

    await report.save();

    const updatedReport = await Report.findById(report._id).populate('user', 'name email phone');

    res.json({
      success: true,
      report: updatedReport
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (req.user.role !== 'admin' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const wasteTypeStats = await Report.aggregate([
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    res.json({
      success: true,
      stats: {
        total: totalReports,
        resolved: resolvedReports,
        pending: stats.find(s => s._id === 'pending')?.count || 0,
        inProgress: stats.find(s => s._id === 'in-progress')?.count || 0,
        wasteTypes: wasteTypeStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
