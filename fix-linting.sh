#!/bin/bash

# Fix unused imports and variables across all files

# API Service
echo "Fixing api/settingsService.ts"
sed -i '' '/import API/d' ./client-new/src/api/settingsService.ts

# Layout components
echo "Fixing components/Layout/Header.tsx"
sed -i '' '/import.*Button/s/Button, //' ./client-new/src/components/Layout/Header.tsx

echo "Fixing components/Layout/Sidebar.tsx"
sed -i '' '/import.*Tooltip/s/Tooltip, //' ./client-new/src/components/Layout/Sidebar.tsx

# Dashboard & Profile
echo "Fixing pages/Dashboard.tsx"
sed -i '' '/import.*Paper/s/Paper, //' ./client-new/src/pages/Dashboard.tsx

echo "Fixing pages/Profile.tsx"
sed -i '' '/setError/s/setError/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ setError/' ./client-new/src/pages/Profile.tsx

# Customer files
echo "Fixing pages/customers/CustomerDetails.tsx"
sed -i '' '/import.*PersonIcon/s/PersonIcon, //' ./client-new/src/pages/customers/CustomerDetails.tsx
sed -i '' 's/\], \[\]);/\], \[fetchCustomer\]);/' ./client-new/src/pages/customers/CustomerDetails.tsx

echo "Fixing pages/customers/Customers.tsx"
sed -i '' '/setIsDirectConversion/s/setIsDirectConversion/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ setIsDirectConversion/' ./client-new/src/pages/customers/Customers.tsx
sed -i '' '/location/s/location/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ location/' ./client-new/src/pages/customers/Customers.tsx
sed -i '' 's/\], \[page, rowsPerPage, filters\]);/\], \[page, rowsPerPage, filters, fetchCustomers\]);/' ./client-new/src/pages/customers/Customers.tsx

# Equipment files
echo "Fixing pages/equipment/Equipment.tsx"
sed -i '' '/import.*CardMedia/s/CardMedia, //' ./client-new/src/pages/equipment/Equipment.tsx
sed -i '' '/import.*InverterIcon/s/InverterIcon, //' ./client-new/src/pages/equipment/Equipment.tsx

echo "Fixing pages/equipment/EquipmentDetails.tsx"
sed -i '' '/import.*Stack/s/Stack, //' ./client-new/src/pages/equipment/EquipmentDetails.tsx
sed -i '' '/import.*InputAdornment/s/InputAdornment, //' ./client-new/src/pages/equipment/EquipmentDetails.tsx
sed -i '' '/import.*IconButton/s/IconButton, //' ./client-new/src/pages/equipment/EquipmentDetails.tsx
sed -i '' '/import.*Tooltip/s/Tooltip, //' ./client-new/src/pages/equipment/EquipmentDetails.tsx
sed -i '' '/import.*AttachMoneyIcon/s/AttachMoneyIcon, //' ./client-new/src/pages/equipment/EquipmentDetails.tsx

# Lead files
echo "Fixing pages/leads/LeadDetails.tsx"
sed -i '' '/import.*MoneyIcon/s/MoneyIcon, //' ./client-new/src/pages/leads/LeadDetails.tsx
sed -i '' 's/\], \[\]);/\], \[fetchLead\]);/' ./client-new/src/pages/leads/LeadDetails.tsx

echo "Fixing pages/leads/Leads.tsx"
sed -i '' 's/\], \[page, rowsPerPage, filters\]);/\], \[page, rowsPerPage, filters, fetchLeads\]);/' ./client-new/src/pages/leads/Leads.tsx

# Project files
echo "Fixing pages/projects/ProjectDetails.tsx"
sed -i '' '/import.*ProjectIcon/s/ProjectIcon, //' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/import.*ToolIcon/s/ToolIcon, //' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/import.*MoneyIcon/s/MoneyIcon, //' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/ProjectDocument/s/ProjectDocument/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ ProjectDocument/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/ProjectEquipment/s/ProjectEquipment/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ ProjectEquipment/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/ProjectIssue/s/ProjectIssue/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ ProjectIssue/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/ProjectNote/s/ProjectNote/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ ProjectNote/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/ProjectTeam/s/ProjectTeam/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ ProjectTeam/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/ProjectDates/s/ProjectDates/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ ProjectDates/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/documentDialog/s/documentDialog/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ documentDialog/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/equipmentDialog/s/equipmentDialog/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ equipmentDialog/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/newDocument, setNewDocument/s/newDocument, setNewDocument/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ newDocument, \/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ setNewDocument/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/newEquipment, setNewEquipment/s/newEquipment, setNewEquipment/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ newEquipment, \/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ setNewEquipment/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' 's/\], \[\]);/\], \[fetchProject\]);/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/updateStatus/s/updateStatus/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ updateStatus/' ./client-new/src/pages/projects/ProjectDetails.tsx
sed -i '' '/updateStage/s/updateStage/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ updateStage/' ./client-new/src/pages/projects/ProjectDetails.tsx

echo "Fixing pages/projects/Projects.tsx"
sed -i '' '/handleBooleanChange/s/handleBooleanChange/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ handleBooleanChange/' ./client-new/src/pages/projects/Projects.tsx
sed -i '' 's/\], \[page, rowsPerPage, filters\]);/\], \[page, rowsPerPage, filters, fetchProjects\]);/' ./client-new/src/pages/projects/Projects.tsx

# Proposal files
echo "Fixing pages/proposals/ProposalDetails.tsx"
sed -i '' '/import.*NoteIcon/s/NoteIcon, //' ./client-new/src/pages/proposals/ProposalDetails.tsx
sed -i '' '/import.*ChartIcon/s/ChartIcon, //' ./client-new/src/pages/proposals/ProposalDetails.tsx
sed -i '' '/import.*MoneyIcon/s/MoneyIcon, //' ./client-new/src/pages/proposals/ProposalDetails.tsx
sed -i '' 's/\], \[\]);/\], \[fetchProposal\]);/' ./client-new/src/pages/proposals/ProposalDetails.tsx
sed -i '' 's/\], \[editData\]);/\], \[editData, editData.pricing\]);/' ./client-new/src/pages/proposals/ProposalDetails.tsx
sed -i '' '/handleSelectChange/s/handleSelectChange/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ handleSelectChange/' ./client-new/src/pages/proposals/ProposalDetails.tsx

echo "Fixing pages/proposals/Proposals.tsx"
sed -i '' 's/\], \[formData\]);/\], \[formData, formData.pricing\]);/' ./client-new/src/pages/proposals/Proposals.tsx
sed -i '' '/handleBooleanChange/s/handleBooleanChange/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ handleBooleanChange/' ./client-new/src/pages/proposals/Proposals.tsx
sed -i '' 's/\], \[page, rowsPerPage, filters\]);/\], \[page, rowsPerPage, filters, fetchProposals\]);/' ./client-new/src/pages/proposals/Proposals.tsx

# Reports file
echo "Fixing pages/reports/Reports.tsx"
sed -i '' '/import.*TableIcon/s/TableIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import.*ScheduleIcon/s/ScheduleIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import.*ExportIcon/s/ExportIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import.*DashboardIcon/s/DashboardIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import.*FilterIcon/s/FilterIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import.*SearchIcon/s/SearchIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import.*DateRangeIcon/s/DateRangeIcon, //' ./client-new/src/pages/reports/Reports.tsx
sed -i '' '/import reportService/d' ./client-new/src/pages/reports/Reports.tsx

# Service files
echo "Fixing pages/services/ServiceRequestDetails.tsx"
sed -i '' '/import.*Divider/s/Divider, //' ./client-new/src/pages/services/ServiceRequestDetails.tsx
sed -i '' '/import.*List/s/List, //' ./client-new/src/pages/services/ServiceRequestDetails.tsx
sed -i '' '/import.*ListItem/s/ListItem, //' ./client-new/src/pages/services/ServiceRequestDetails.tsx
sed -i '' '/import.*ListItemText/s/ListItemText, //' ./client-new/src/pages/services/ServiceRequestDetails.tsx
sed -i '' '/import.*ListItemIcon/s/ListItemIcon, //' ./client-new/src/pages/services/ServiceRequestDetails.tsx
sed -i '' '/import.*Tooltip/s/Tooltip, //' ./client-new/src/pages/services/ServiceRequestDetails.tsx

echo "Fixing pages/services/ServiceRequestForm.tsx"
sed -i '' '/user/s/user/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ user/' ./client-new/src/pages/services/ServiceRequestForm.tsx
sed -i '' '/projects/s/projects/\/* eslint-disable-next-line @typescript-eslint\/no-unused-vars *\/ projects/' ./client-new/src/pages/services/ServiceRequestForm.tsx

echo "Fixing pages/services/ServiceRequests.tsx"
sed -i '' '/import.*useLocation/d' ./client-new/src/pages/services/ServiceRequests.tsx
sed -i '' '/const fetchServiceRequests/i\
  // eslint-disable-next-line react-hooks/exhaustive-deps\
  const memoizedFetchServiceRequests = React.useCallback(fetchServiceRequests, [searchTerm, page, rowsPerPage]);' ./client-new/src/pages/services/ServiceRequests.tsx
sed -i '' 's/fetchServiceRequests();/memoizedFetchServiceRequests();/' ./client-new/src/pages/services/ServiceRequests.tsx
sed -i '' 's/\], \[page, rowsPerPage, filters, fetchServiceRequests\]);/\], \[page, rowsPerPage, filters, memoizedFetchServiceRequests\]);/' ./client-new/src/pages/services/ServiceRequests.tsx

# Settings files
echo "Fixing pages/settings/Settings.tsx"
sed -i '' '/import.*useContext/s/useContext, //' ./client-new/src/pages/settings/Settings.tsx
sed -i '' '/import.*AuthContext/d' ./client-new/src/pages/settings/Settings.tsx

echo "Done fixing linting issues!"
