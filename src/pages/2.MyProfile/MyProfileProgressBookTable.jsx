import React, { useCallback, useState } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, getPaginationRowModel,
  getFilteredRowModel, createColumnHelper
} from "@tanstack/react-table";
import { useNavigate } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify/react";
import { format } from "date-fns";

const getCategoryStyle = (status) => {
  switch (status) {
    case 'PASSED':
      return 'text-[#15803D] bg-[#DCFCE7] border border-[#15803D] rounded-md px-2 py-1 text-xs font-medium';
    case 'FAILED':
      return 'text-[#DC2626] bg-[#FEE2E2] border border-[#DC2626] rounded-md px-2 py-1 text-xs font-medium';
    case 'NOT GRADED':
      return 'text-[#6B7280] bg-[#F3F4F6] border border-[#6B7280] rounded-md px-2 py-1 text-xs font-medium';
    default:
      return 'px-2 py-1';
  }
};

const MyProfileProgressBookTable = ({ books, isLoadingBooks }) => {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = React.useState("");



  const columnHelper = createColumnHelper();
  const columns = [
    columnHelper.accessor("bookCode", {
      header: "ID",
      cell: (info) => (
        <span className="whitespace-nowrap text-primary-500 font-[Inter-Medium]">
          {info.getValue() || "Untitled"}
        </span>
      ),
    }),
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => (
        <span className="whitespace-normal break-words max-w-[200px] line-clamp-4">
          {info.getValue() || "Untitled"}
        </span>
      ),
    }),
    columnHelper.accessor("statuses", {
      header: "Status",
      cell: (info) => {
        const statuses = info.getValue();
        const currentStatus = statuses?.find(s => s.isCurrent) ||
          (statuses?.length > 0 ? statuses[statuses.length - 1] : null);
        const statusName = currentStatus?.definition?.name || 'PENDING';

        return (
          <span
            style={{
              color: currentStatus?.definition?.color || '#000',
              backgroundColor: `${currentStatus?.definition?.color}18` || '#00000018',
              border: `1px solid ${currentStatus?.definition?.color || '#000'}`,
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              display: 'inline-block'
            }}
            className="capitalize break-words whitespace-normal"
          >
            {statusName}
          </span>
        );
      },
    }),
    columnHelper.accessor("submissionDate", {
      header: "Submitted",
      cell: (info) =>
        info.getValue() ? format(new Date(info.getValue()), 'MMM d, yyyy') : "-",
    }),
    columnHelper.accessor("vivaHistory", {
      header: "Viva",
      cell: (info) => {
        const vivaHistory = info.getValue();
        const currentViva = vivaHistory?.find(v => v.isCurrent);
        return currentViva?.scheduledDate
          ? format(new Date(currentViva.scheduledDate), 'MMM d, yyyy')
          : "-";
      },
    }),
    columnHelper.accessor("gradedAt", {
      header: "Graded",
      cell: (info) => {
        const averageMark = info.row.original.averageExamMark;
        let status = 'NOT GRADED';

        if (averageMark !== null && averageMark !== undefined) {
          status = averageMark >= 60 ? 'PASSED' : 'FAILED';
        }

        return (
          <span className={getCategoryStyle(status)}>
            {status}
          </span>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: books || [],
    columns,
    state: {
      globalFilter,
    },
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoadingBooks) {
    return (
      <div className="overflow-x-auto bg-white shadow-md rounded-lg p-8 text-center">
        <p className="text-gray-500 text-base font-[Inter-Regular]">Loading...</p>
      </div>
    );
  }

  if (!books || books?.length === 0) {
    return (
      <div className="overflow-x-auto bg-white shadow-md rounded-lg p-8 text-center">
        <p className="text-gray-500 text-base font-[Inter-Regular] mb-4">No Book Grades Available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full bg-white shadow-md rounded-lg">
      <table className="w-full">
        <thead className="bg-[#f9fafd]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-[#111827] text-opacity-90 font-[Inter-SemiBold] text-sm"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-2 whitespace-nowrap text-[#111827] font-[Inter-Regular] text-xs"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
        <div className="flex font-[Roboto-Regular] items-center text-sm text-gray-500">
          Showing{" "}
          <span className="font-[Roboto-Medium] mx-1">
            {table.getState().pagination.pageSize *
              table.getState().pagination.pageIndex +
              1}
          </span>
          to{" "}
          <span className="font-[Roboto-Medium] mx-1">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
              table.getPrePaginationRowModel().rows.length
            )}
          </span>
          of{" "}
          <span className="font-[Roboto-Medium] mx-1">
            {table.getPrePaginationRowModel().rows.length}
          </span>{" "}
          results
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border border-gray-300 rounded p-1 font-[Roboto-Regular] text-sm disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              className={`w-8 h-8 rounded text-sm ${pageNumber === table.getState().pagination.pageIndex + 1
                  ? 'bg-blue-50 text-blue-600 font-[Roboto-Medium]'
                  : 'text-gray-500'
                }`}
              onClick={() => table.setPageIndex(pageNumber - 1)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="border border-gray-300 rounded p-1 font-[Roboto-Regular] text-sm disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfileProgressBookTable; 