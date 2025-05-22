import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Typography,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
} from '@mui/icons-material';

// Define types for column and row data
export type Column = {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => React.ReactNode;
  sortable?: boolean;
  hideOnMobile?: boolean;
};

type SortDirection = 'asc' | 'desc';

interface TouchFriendlyDataTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: SortDirection;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
  hideColumnsMobile?: string[];
  renderMobileCard?: (row: any, expanded: boolean) => React.ReactNode;
}

const TouchFriendlyDataTable: React.FC<TouchFriendlyDataTableProps> = ({
  columns,
  rows,
  loading = false,
  defaultSortColumn,
  defaultSortDirection = 'desc',
  onRowClick,
  emptyMessage = 'No data available',
  rowsPerPageOptions = [5, 10, 25],
  hideColumnsMobile,
  renderMobileCard,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | undefined>(
    defaultSortColumn
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Determine if a column should be hidden on mobile
  const isColumnVisible = (column: Column) => {
    if (!isMobile) return true;
    if (column.hideOnMobile) return false;
    if (hideColumnsMobile && hideColumnsMobile.includes(column.id))
      return false;
    return true;
  };

  // Handle sort requests
  const handleSort = (columnId: string) => {
    const isAsc = sortColumn === columnId && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortColumn(columnId);
  };

  // Handle pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle row expansion
  const toggleRowExpansion = (rowId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  // Sort and paginate data
  const sortedRows = React.useMemo(() => {
    if (!sortColumn) return rows;

    return [...rows].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];

      // Handle different data types
      if (valueA === null || valueA === undefined)
        return sortDirection === 'asc' ? -1 : 1;
      if (valueB === null || valueB === undefined)
        return sortDirection === 'asc' ? 1 : -1;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }, [rows, sortColumn, sortDirection]);

  const paginatedRows = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedRows.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render empty state
  if (rows.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  // Render mobile card view
  if (isMobile && renderMobileCard) {
    return (
      <Box>
        {paginatedRows.map((row, index) => {
          const rowId = row.id || `row-${index}`;
          const isExpanded = expandedRows[rowId] || false;

          return (
            <Card
              key={rowId}
              sx={{
                mb: 2,
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': onRowClick
                  ? {
                      boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  : {},
              }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {renderMobileCard(row, isExpanded)}
              {!renderMobileCard && (
                <CardContent>
                  {columns.filter(isColumnVisible).map((column) => (
                    <Box key={column.id} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        {column.label}
                      </Typography>
                      <Typography variant="body2">
                        {column.format
                          ? column.format(row[column.id])
                          : row[column.id]}
                      </Typography>
                    </Box>
                  ))}
                  <IconButton
                    size="small"
                    onClick={(e) => toggleRowExpansion(rowId, e)}
                    sx={{ mt: 1 }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2 }}>
                      {columns
                        .filter((col) => !isColumnVisible(col))
                        .map((column) => (
                          <Box key={column.id} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              {column.label}
                            </Typography>
                            <Typography variant="body2">
                              {column.format
                                ? column.format(row[column.id])
                                : row[column.id]}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  </Collapse>
                </CardContent>
              )}
            </Card>
          );
        })}
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  }

  // Render regular table view
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.filter(isColumnVisible).map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={
                    sortColumn === column.id ? sortDirection : false
                  }
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={
                        sortColumn === column.id ? sortDirection : 'asc'
                      }
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row, index) => {
              return (
                <TableRow
                  hover
                  tabIndex={-1}
                  key={`row-${index}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: onRowClick
                        ? alpha(theme.palette.primary.main, 0.08)
                        : undefined,
                    },
                  }}
                >
                  {columns.filter(isColumnVisible).map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TouchFriendlyDataTable;
