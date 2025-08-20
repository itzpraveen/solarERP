'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const catchAsync = require('../utils/catchAsync');

// GET /api/reports/sales-pipeline
exports.getSalesPipeline = catchAsync(async (req, res) => {
  const [leadsByStatus, proposalsByStatus, totals] = await Promise.all([
    db.Lead.findAll({ attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['status'] }),
    db.Proposal.findAll({ attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['status'] }),
    (async () => {
      const totalLeads = await db.Lead.count();
      const totalProposals = await db.Proposal.count();
      const acceptedProposals = await db.Proposal.count({ where: { status: 'accepted' } });
      const conversionRate = totalProposals > 0 ? (acceptedProposals / totalProposals * 100).toFixed(2) : '0.00';
      return { totalLeads, totalProposals, acceptedProposals, conversionRate };
    })()
  ]);

  res.status(200).json({ status: 'success', data: { leadsByStatus, proposalsByStatus, totals } });
});

// GET /api/reports/project-status
exports.getProjectStatus = catchAsync(async (req, res) => {
  const [byStatus, byStage, upcoming] = await Promise.all([
    db.Project.findAll({ attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['status'] }),
    db.Project.findAll({ attributes: ['stage', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['stage'] }),
    db.Project.findAll({
      attributes: ['id', 'name', 'scheduledInstallationDate'],
      where: { scheduledInstallationDate: { [Op.gte]: new Date() } },
      order: [['scheduled_installation_date', 'ASC']],
      limit: 10
    })
  ]);

  res.status(200).json({ status: 'success', data: { byStatus, byStage, upcoming } });
});

// GET /api/reports/financial
exports.getFinancialReport = catchAsync(async (req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalContract, totalPaid, totalExpenses, monthlyRevenue] = await Promise.all([
    db.Project.sum('totalContractValue').then(v => v || 0),
    db.ProjectPayment.sum('amount').then(v => v || 0),
    db.ProjectExpense.sum('amount').then(v => v || 0),
    db.ProjectPayment.findAll({
      attributes: [
        [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('payment_date')), 'month'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
      ],
      where: { paymentDate: { [Op.gte]: sixMonthsAgo } },
      group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('payment_date'))],
      order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('payment_date')), 'ASC']]
    })
  ]);

  const outstanding = totalContract - totalPaid;
  const profitEstimate = totalPaid - totalExpenses;

  res.status(200).json({ status: 'success', data: { totals: { totalContract, totalPaid, totalExpenses, outstanding, profitEstimate }, monthlyRevenue } });
});

// GET /api/reports/customer
exports.getCustomerReport = catchAsync(async (req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalCustomers, customersByMonth] = await Promise.all([
    db.Customer.count(),
    db.Customer.findAll({
      attributes: [
        [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'month'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: { createdAt: { [Op.gte]: sixMonthsAgo } },
      group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at'))],
      order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'ASC']]
    })
  ]);

  res.status(200).json({ status: 'success', data: { totalCustomers, customersByMonth } });
});

// GET /api/reports/user-performance
exports.getUserPerformance = catchAsync(async (req, res) => {
  const leadsByAssignee = await db.Lead.findAll({
    attributes: [
      'assigned_to_id',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
    ],
    group: ['assigned_to_id']
  });

  res.status(200).json({ status: 'success', data: { leadsByAssignee } });
});
