import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
  Checkbox,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

// Define column interface
export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRefresh?: () => void;
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sortable?: boolean;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  rowActions?: React.ReactNode;
  keyField?: string;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  dense?: boolean;
  showHeader?: boolean;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  onRowClick,
  onSelectionChange,
  onRefresh,
  pagination = true,
  rowsPerPageOptions = [5, 10, 25, 50],
  defaultRowsPerPage = 10,
  totalCount,
  page: externalPage,
  onPageChange,
  onRowsPerPageChange,
  sortable = true,
  defaultSortBy,
  defaultSortDirection = 'asc',
  onSortChange,
  rowActions,
  keyField = 'id',
  stickyHeader = false,
  maxHeight = 600,
  dense = false,
  showHeader = true,
  headerComponent,
  footerComponent,
}: DataTableProps<T>) {
  const theme = useTheme();

  // Internal state for controlled/uncontrolled modes
  const [page, setPage] = useState(externalPage || 0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortBy, setSortBy] = useState<string | undefined>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSortDirection
  );
  const [selected, setSelected] = useState<T[]>([]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
  };

  // Handle sorting
  const handleSort = (columnId: string) => {
    const isAsc = sortBy === columnId && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortDirection(newDirection);
    if (onSortChange) {
      onSortChange(columnId, newDirection);
    }
  };

  // Handle selection
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(data);
      if (onSelectionChange) {
        onSelectionChange(data);
      }
      return;
    }
    setSelected([]);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleSelectClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: T
  ) => {
    event.stopPropagation();

    const selectedIndex = selected.findIndex(
      (item) => item[keyField] === row[keyField]
    );
    let newSelected: T[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, row];
    } else {
      newSelected = selected.filter((_, index) => index !== selectedIndex);
    }

    setSelected(newSelected);
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    }
  };

  const isSelected = (row: T) =>
    selected.findIndex((item) => item[keyField] === row[keyField]) !== -1;

  // Render loading state
  const renderLoading = () => (
    <TableRow>
      <TableCell
        colSpan={selectable ? columns.length + 1 : columns.length}
        sx={{
          height: 300,
          textAlign: 'center',
          border: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Loading data...
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );

  // Render loading skeleton
  const renderSkeleton = () => {
    return Array.from(new Array(5)).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {selectable && (
          <TableCell padding="checkbox">
            <Skeleton variant="circular" width={24} height={24} />
          </TableCell>
        )}
        {columns
          .filter((col) => !col.hidden)
          .map((column, colIndex) => (
            <TableCell
              key={`skeleton-cell-${colIndex}`}
              align={column.align || 'left'}
            >
              <Skeleton variant="text" width={colIndex === 0 ? '60%' : '40%'} />
            </TableCell>
          ))}
        {rowActions && (
          <TableCell align="right" padding="none">
            <Skeleton variant="circular" width={32} height={32} />
          </TableCell>
        )}
      </TableRow>
    ));
  };

  // Render empty state
  const renderEmptyState = () => (
    <TableRow>
      <TableCell
        colSpan={selectable ? columns.length + 1 : columns.length}
        sx={{
          height: 300,
          textAlign: 'center',
          border: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 3,
          }}
        >
          <SearchIcon
            sx={{
              fontSize: 48,
              color: theme.palette.grey[300],
              mb: 1,
            }}
          />
          <Typography variant="h6" color="text.secondary">
            {emptyMessage}
          </Typography>
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton
                onClick={onRefresh}
                sx={{
                  mt: 1,
                  color: theme.palette.primary.main,
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );

  // Determine which rows to display based on pagination
  const displayedRows =
    pagination && !onPageChange
      ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : data;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius * 1.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      {/* Optional header component */}
      {headerComponent && (
        <>
          {headerComponent}
          <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />
        </>
      )}

      {/* Table */}
      <TableContainer
        sx={{
          maxHeight: stickyHeader ? maxHeight : undefined,
          overflow: 'auto',
        }}
      >
        <Table
          stickyHeader={stickyHeader}
          size={dense ? 'small' : 'medium'}
          aria-label="data table"
        >
          {showHeader && (
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selected.length > 0 && selected.length < data.length
                      }
                      checked={
                        data.length > 0 && selected.length === data.length
                      }
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all' }}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  </TableCell>
                )}
                {columns
                  .filter((col) => !col.hidden)
                  .map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      style={{
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                      sortDirection={
                        sortBy === column.id ? sortDirection : false
                      }
                    >
                      {sortable && column.sortable !== false ? (
                        <TableSortLabel
                          active={sortBy === column.id}
                          direction={
                            sortBy === column.id ? sortDirection : 'asc'
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
                {rowActions && (
                  <TableCell align="right" padding="none" style={{ width: 48 }}>
                    <Box sx={{ pr: 1 }}>
                      <FilterIcon sx={{ visibility: 'hidden' }} />
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {loading
              ? renderSkeleton()
              : displayedRows.length > 0
                ? displayedRows.map((row, index) => {
                    const isItemSelected = selectable ? isSelected(row) : false;
                    const labelId = `table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        role={onRowClick ? 'button' : undefined}
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row[keyField] || index}
                        selected={isItemSelected}
                        sx={{
                          cursor: onRowClick ? 'pointer' : 'default',
                          '&.Mui-selected': {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.08
                            ),
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.12
                            ),
                          },
                        }}
                      >
                        {selectable && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isItemSelected}
                              inputProps={{ 'aria-labelledby': labelId }}
                              onClick={(event) => handleSelectClick(event, row)}
                              sx={{
                                color: theme.palette.primary.main,
                                '&.Mui-checked': {
                                  color: theme.palette.primary.main,
                                },
                              }}
                            />
                          </TableCell>
                        )}
                        {columns
                          .filter((col) => !col.hidden)
                          .map((column) => {
                            const value = row[column.id];
                            return (
                              <TableCell
                                key={column.id}
                                align={column.align || 'left'}
                                sx={{
                                  maxWidth: column.maxWidth,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {column.format
                                  ? column.format(value, row)
                                  : value}
                              </TableCell>
                            );
                          })}
                        {rowActions && (
                          <TableCell align="right" padding="none">
                            {rowActions}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                : renderEmptyState()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount !== undefined ? totalCount : data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
              {
                fontSize: '0.875rem',
              },
          }}
        />
      )}

      {/* Optional footer component */}
      {footerComponent && (
        <>
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }} />
          {footerComponent}
        </>
      )}
    </Paper>
  );
}

export default DataTable;
