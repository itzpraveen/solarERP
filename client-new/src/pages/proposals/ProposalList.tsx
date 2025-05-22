import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  UploadFile as UploadFileIcon, // Icon for upload button
} from '@mui/icons-material';
import * as proposalService from '../../api/proposalService'; // Use namespace import
import { Proposal } from '../../api/proposalService'; // Import type separately
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import PageHeader from '../../components/common/PageHeader'; // Assuming PageHeader component exists

const ProposalList = () => {
  const navigate = useNavigate();

  // State for proposals data
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination (client-side for now)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch proposals data
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const proposalsArray = await proposalService.default.getProposals();
      setProposals(proposalsArray);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch proposals');
      setLoading(false);
    }
  }, []); // Empty dependency array as it doesn't depend on external state/props

  // Initial data fetch
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate proposals for the current page (client-side pagination)
  const paginatedProposals = proposals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format date helper
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader title="Proposals" />
      {/* Buttons moved below header */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => navigate('/proposals/upload')} // Navigate to upload page
        >
          Upload Proposal
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchProposals}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Proposals Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Client Name</TableCell>
              <TableCell>Doc Ref No</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Capacity (kW)</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Proposal Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedProposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No proposals found. Upload a proposal to get started.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProposals.map((proposal) => (
                <TableRow key={proposal._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {`${proposal.lead?.firstName ?? ''} ${proposal.lead?.lastName ?? ''}`.trim() ||
                        'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{proposal.proposalId ?? 'N/A'}</TableCell>
                  <TableCell>{proposal.projectType ?? 'N/A'}</TableCell>{' '}
                  {/* Or consider proposal.lead.companyName if that exists and is relevant */}
                  <TableCell>{proposal.systemSize ?? 'N/A'} kW</TableCell>
                  <TableCell>
                    <CurrencyDisplay
                      amount={proposal.finalProjectCost ?? 0}
                      currencyCode={proposal.currency} // Use currency from proposal
                    />
                  </TableCell>
                  <TableCell>{formatDate(proposal.createdAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/proposals/${proposal._id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {/* Add other actions like Edit/Delete later if needed */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={proposals.length} // Total count based on fetched data
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ProposalList;
