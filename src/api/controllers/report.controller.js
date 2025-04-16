const Lead = require('../models/lead.model');
const Customer = require('../models/customer.model');
const Project = require('../models/project.model');
const Proposal = require('../models/proposal.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get sales pipeline report
exports.getSalesPipeline = catchAsync(async (req, res, next) => {
  // Get lead counts by status
  const leads = await Lead.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        leads: {
          $push: {
            _id: '$_id',
            firstName: '$firstName',
            lastName: '$lastName',
            email: '$email',
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get proposal counts by status
  const proposals = await Proposal.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$pricing.grossCost' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get conversion rates
  const totalLeads = await Lead.countDocuments({ active: true });
  const qualifiedLeads = await Lead.countDocuments({
    active: true,
    status: { $in: ['qualified', 'proposal', 'won', 'lost'] },
  });
  const proposalsSent = await Proposal.countDocuments({
    active: true,
    status: { $ne: 'draft' },
  });
  const proposalsAccepted = await Proposal.countDocuments({
    active: true,
    status: 'accepted',
  });

  // Calculate conversion rates
  const leadQualificationRate =
    totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
  const proposalConversionRate =
    proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0;

  res.status(200).json({
    status: 'success',
    data: {
      leads,
      proposals,
      conversionRates: {
        leadQualificationRate: parseFloat(leadQualificationRate.toFixed(2)),
        proposalConversionRate: parseFloat(proposalConversionRate.toFixed(2)),
      },
      totals: {
        totalLeads,
        qualifiedLeads,
        proposalsSent,
        proposalsAccepted,
      },
    },
  });
});

// Get project status report
exports.getProjectStatus = catchAsync(async (req, res, next) => {
  // Get projects by stage
  const projectsByStage = await Project.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalContractValue: { $sum: '$financials.totalContractValue' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get projects by status
  const projectsByStatus = await Project.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalContractValue: { $sum: '$financials.totalContractValue' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get recent projects
  const recentProjects = await Project.find()
    .sort('-createdAt')
    .limit(5)
    .select('name customer stage status financials.totalContractValue dates')
    .populate({
      path: 'customer',
      select: 'firstName lastName email',
    });

  // Get upcoming installations
  const upcomingInstallations = await Project.find({
    'dates.scheduledInstallation': { $gte: new Date() },
  })
    .sort('dates.scheduledInstallation')
    .limit(5)
    .select('name customer stage dates.scheduledInstallation')
    .populate({
      path: 'customer',
      select: 'firstName lastName email',
    });

  // Get delayed projects
  const today = new Date();
  const delayedProjects = await Project.find({
    status: 'active',
    stage: { $ne: 'completed' },
    'dates.scheduledInstallation': { $lt: today },
  })
    .sort('dates.scheduledInstallation')
    .limit(5)
    .select('name customer stage dates.scheduledInstallation')
    .populate({
      path: 'customer',
      select: 'firstName lastName email',
    });

  res.status(200).json({
    status: 'success',
    data: {
      projectsByStage,
      projectsByStatus,
      recentProjects,
      upcomingInstallations,
      delayedProjects,
    },
  });
});

// Get financial report
exports.getFinancialReport = catchAsync(async (req, res, next) => {
  // Parse time period from query
  const period = req.query.period || 'all';
  let startDate;
  let endDate;

  if (period !== 'all') {
    endDate = new Date();
    startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = null;
        endDate = null;
    }
  }

  // Build match condition based on time period
  const matchCondition =
    startDate && endDate
      ? {
          active: true,
          createdAt: { $gte: startDate, $lte: endDate },
        }
      : { active: true };

  // Calculate contract value by project stage
  const contractValueByStage = await Project.aggregate([
    {
      $match: matchCondition,
    },
    {
      $group: {
        _id: '$stage',
        totalContractValue: { $sum: '$financials.totalContractValue' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Calculate proposal value by status
  const proposalValueByStatus = await Proposal.aggregate([
    {
      $match: matchCondition,
    },
    {
      $group: {
        _id: '$status',
        totalValue: { $sum: '$pricing.grossCost' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Calculate monthly revenue
  const monthlyRevenue = await Project.aggregate([
    {
      $match: { active: true, status: 'completed' },
    },
    {
      $project: {
        year: { $year: '$dates.projectClosed' },
        month: { $month: '$dates.projectClosed' },
        totalContractValue: '$financials.totalContractValue',
      },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        totalRevenue: { $sum: '$totalContractValue' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 },
    },
    {
      $limit: 12,
    },
  ]);

  // Calculate total statistics
  const totalStats = await Project.aggregate([
    {
      $match: matchCondition,
    },
    {
      $group: {
        _id: null,
        totalContractValue: { $sum: '$financials.totalContractValue' },
        avgContractValue: { $avg: '$financials.totalContractValue' },
        totalProjects: { $sum: 1 },
        maxContractValue: { $max: '$financials.totalContractValue' },
        minContractValue: { $min: '$financials.totalContractValue' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      period,
      contractValueByStage,
      proposalValueByStatus,
      monthlyRevenue,
      totalStats: totalStats[0] || {
        totalContractValue: 0,
        avgContractValue: 0,
        totalProjects: 0,
        maxContractValue: 0,
        minContractValue: 0,
      },
    },
  });
});

// Get customer report
exports.getCustomerReport = catchAsync(async (req, res, next) => {
  // Get customer acquisition by month
  const customersByMonth = await Customer.aggregate([
    {
      $match: { active: true },
    },
    {
      $project: {
        year: { $year: '$customerSince' },
        month: { $month: '$customerSince' },
      },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 },
    },
    {
      $limit: 12,
    },
  ]);

  // Get customer distribution by location
  const customersByLocation = await Customer.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: {
          state: '$address.state',
          city: '$address.city',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Get top customers by revenue
  const topCustomers = await Customer.aggregate([
    {
      $match: { active: true },
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: 'customer',
        as: 'projects',
      },
    },
    {
      $addFields: {
        totalRevenue: { $sum: '$projects.financials.totalContractValue' },
        projectCount: { $size: '$projects' },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        totalRevenue: 1,
        projectCount: 1,
      },
    },
  ]);

  // Get customer retention rate
  const totalCustomers = await Customer.countDocuments({ active: true });
  const repeatCustomers = await Customer.aggregate([
    {
      $match: { active: true },
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: 'customer',
        as: 'projects',
      },
    },
    {
      $match: { 'projects.1': { $exists: true } }, // At least 2 projects
    },
    {
      $count: 'count',
    },
  ]);

  const repeatCustomerCount =
    repeatCustomers.length > 0 ? repeatCustomers[0].count : 0;
  const retentionRate =
    totalCustomers > 0 ? (repeatCustomerCount / totalCustomers) * 100 : 0;

  res.status(200).json({
    status: 'success',
    data: {
      customersByMonth,
      customersByLocation,
      topCustomers,
      retention: {
        totalCustomers,
        repeatCustomers: repeatCustomerCount,
        retentionRate: parseFloat(retentionRate.toFixed(2)),
      },
    },
  });
});

// Get performance report by user
exports.getUserPerformance = catchAsync(async (req, res, next) => {
  // Get sales performance by user
  const salesPerformance = await Proposal.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$createdBy',
        proposalsCreated: { $sum: 1 },
        proposalsAccepted: {
          $sum: {
            $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0],
          },
        },
        totalValue: { $sum: '$pricing.grossCost' },
        averageValue: { $avg: '$pricing.grossCost' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
        proposalsCreated: 1,
        proposalsAccepted: 1,
        totalValue: 1,
        averageValue: 1,
        conversionRate: {
          $cond: [
            { $eq: ['$proposalsCreated', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$proposalsAccepted', '$proposalsCreated'] },
                100,
              ],
            },
          ],
        },
      },
    },
    {
      $sort: { totalValue: -1 },
    },
  ]);

  // Get project management performance by user
  const projectPerformance = await Project.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$team.projectManager',
        projectsManaged: { $sum: 1 },
        projectsCompleted: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
          },
        },
        totalValue: { $sum: '$financials.totalContractValue' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'manager',
      },
    },
    {
      $unwind: {
        path: '$manager',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        firstName: '$manager.firstName',
        lastName: '$manager.lastName',
        email: '$manager.email',
        projectsManaged: 1,
        projectsCompleted: 1,
        totalValue: 1,
        averageValue: {
          $cond: [
            { $eq: ['$projectsManaged', 0] },
            0,
            { $divide: ['$totalValue', '$projectsManaged'] },
          ],
        },
        completionRate: {
          $cond: [
            { $eq: ['$projectsManaged', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$projectsCompleted', '$projectsManaged'] },
                100,
              ],
            },
          ],
        },
      },
    },
    {
      $sort: { projectsManaged: -1 },
    },
  ]);

  // Get lead conversion performance by user
  const leadPerformance = await Lead.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$assignedTo',
        leadsAssigned: { $sum: 1 },
        leadsQualified: {
          $sum: {
            $cond: [
              { $in: ['$status', ['qualified', 'proposal', 'won']] },
              1,
              0,
            ],
          },
        },
        leadsWon: {
          $sum: {
            $cond: [{ $eq: ['$status', 'won'] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
        leadsAssigned: 1,
        leadsQualified: 1,
        leadsWon: 1,
        qualificationRate: {
          $cond: [
            { $eq: ['$leadsAssigned', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$leadsQualified', '$leadsAssigned'] },
                100,
              ],
            },
          ],
        },
        winRate: {
          $cond: [
            { $eq: ['$leadsAssigned', 0] },
            0,
            { $multiply: [{ $divide: ['$leadsWon', '$leadsAssigned'] }, 100] },
          ],
        },
      },
    },
    {
      $sort: { leadsAssigned: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      salesPerformance,
      projectPerformance,
      leadPerformance,
    },
  });
});
