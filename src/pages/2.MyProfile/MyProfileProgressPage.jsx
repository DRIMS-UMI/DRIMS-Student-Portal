import React, { useState, useMemo, useCallback, Fragment } from "react";
import { HiX } from 'react-icons/hi'
import { Icon } from "@iconify/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import MyProfileProgressStatusTable from "./MyProfileProgressStatusTable";
import MyProfileProgressProposalTable from "./MyProfileProgressProposalTable";
import MyProfileProgressBookTable from "./MyProfileProgressBookTable";
import { useGetStudentStatuses, useGetStudentProposals, useGetStudentBooks } from "../../store/tanstackStore/services/queries";

const MyProfileProgressPage = ({ studentData }) => {
  const [activeView, setActiveView] = useState("tracker");
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
  const [isProposalDrawerOpen, setIsProposalDrawerOpen] = useState(false);
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false);
  const [isSupervisorDrawerOpen, setIsSupervisorDrawerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const navigate = useNavigate();

  const student = studentData?.student;



  if (!student) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">No student data available</div>
      </div>
    );
  }

  // Use the query hooks like in StudentProfileProgressPage
  const {
    data: studentStatuses,
    isLoading: isLoadingStudentStatuses,
  } = useGetStudentStatuses(student.id);

  const { data: proposals, isLoading: isLoadingProposals } = useGetStudentProposals(student.id);

  const { data: books, isLoading: isLoadingBooks } = useGetStudentBooks(student.id);

  const currentStatus = useMemo(
    () => {
      if (!studentStatuses?.statuses || studentStatuses.statuses.length === 0) {
        return null;
      }
      // In descending order, the first status is the latest/most recent
      return studentStatuses.statuses[0];
    },
    [studentStatuses?.statuses]
  );

  const currentSupervisor = useMemo(
    () => student?.supervisors,
    [student?.supervisors]
  );

  const { totalDays, enrollmentDate, expectedDays } = useMemo(() => {
    const enrollmentDate = student?.createdAt
      ? new Date(student?.createdAt)
      : new Date();
    const totalDays = Math.ceil(
      (new Date() - enrollmentDate) / (1000 * 60 * 60 * 24)
    );
    const expectedDays = student?.expectedCompletionDate
      ? Math.ceil(
        (new Date(student?.expectedCompletionDate) -
          enrollmentDate) /
        (1000 * 60 * 60 * 24)
      )
      : null;
    return { totalDays, enrollmentDate, expectedDays };
  }, [
    student?.createdAt,
    student?.expectedCompletionDate,
  ]);

  const handleViewChange = useCallback((view) => {
    setActiveView(view);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-UG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderTimelineBar = useCallback(
    (status, index) => {
      const startDate = new Date(status.startDate);
      // For timeline display (reversed array): first status is oldest, last status is latest
      const reversedStatuses = studentStatuses?.statuses?.slice().reverse() || [];
      const isLatest = index === (reversedStatuses.length || 0) - 1;
      const endDate = isLatest
        ? new Date() // Latest status ends at present
        : new Date(reversedStatuses[index + 1]?.startDate); // Next status start date
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const position = Math.ceil(
        (startDate - enrollmentDate) / (1000 * 60 * 60 * 24)
      );

      return (
        <TooltipProvider key={status.id} className="z-[50] h-full">
          <Tooltip className="z-50 h-full">
            <TooltipTrigger className="z-50 h-full relative">
              <div
                key={status.id}
                className="h-full group cursor-pointer hover:brightness-90 transition-all"
                style={{
                  width: `${duration * 2}px`,
                  left: `${position * 2}px`,
                  backgroundColor: status?.definition?.color || "#313132",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  borderRadius: "2px",
                }}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
              <div className="space-y-1">
                <div className="font-medium text-gray-900">
                  {status?.definition?.name}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(status?.startDate).toLocaleDateString()} -{" "}
                  {isLatest
                    ? "Present"
                    : new Date(reversedStatuses[index + 1]?.startDate).toLocaleDateString()}
                </div>
                <div className="text-xs font-[Inter-Regular] text-gray-900">
                  Actual Duration: {duration} days
                </div>
                {status?.definition?.expectedDays && (
                  <div className="text-sm font-[Inter-Regular] text-gray-900">
                    Expected Duration: {status.definition.expectedDays} days
                    {duration > status.definition.expectedDays && (
                      <span className="text-red-500 ml-1">
                        (Overdue by {duration - status.definition.expectedDays}{" "}
                        days)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    [enrollmentDate, studentStatuses?.statuses?.length]
  );

  const renderTimelineLegend = useCallback(
    (status) => {
      // Check if this status definition has already been rendered
      const reversedStatuses = studentStatuses?.statuses?.slice().reverse() || [];
      const isFirstOccurrence =
        reversedStatuses.findIndex(
          (s) => s.definition?.name === status.definition?.name
        ) === reversedStatuses.indexOf(status);

      if (!isFirstOccurrence) return null;

      return (
        <div
          key={status.id}
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md shadow-sm"
        >
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: status.definition?.color || "#313132",
            }}
          />
          <span className="text-xs font-[Inter-Medium] text-[#626263] capitalize whitespace-nowrap">
            {status.definition?.name || "Unknown"}
          </span>
        </div>
      );
    },
    [studentStatuses?.statuses]
  );

  const handleViewSupervisor = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setIsSupervisorDrawerOpen(true);
  };

  // TanStack Table for Supervisors
  const columnHelper = createColumnHelper();

  const supervisorColumns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <span className="text-sm font-[Inter-Regular] text-gray-900">
          {info.row.original.title} {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("workEmail", {
      header: "Email",
      cell: (info) => (
        <span className="text-sm font-[Inter-Regular] text-gray-900">
          {info.getValue() || "N/A"}
        </span>
      ),
    }),
    columnHelper.accessor("primaryPhone", {
      header: "Phone",
      cell: (info) => (
        <span className="text-sm font-[Inter-Regular] text-gray-900">
          {info.getValue() || "N/A"}
        </span>
      ),
    }),

    columnHelper.accessor("id", {
      header: "Actions",
      cell: (info) => {
        const supervisor = info.row.original;
        return (
          <div className="flex flex-col gap-2 max-w-[150px] ">
            <button
              className="px-2 py-1 text-xs font-[Inter-Medium]  text-white bg-accent2-600 rounded hover:bg-accent2-700 flex items-center"
              onClick={() => handleViewSupervisor(supervisor)}
            >
              <Icon icon="tabler:eye" className="h-3 w-3 mr-1" />
              View Supervisor
            </button>
          </div>
        );
      },
    }),
  ];

  const supervisorsData = student?.supervisors || [];

  const supervisorsTable = useReactTable({
    data: supervisorsData,
    columns: supervisorColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoadingStudentStatuses) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 ">
      {/* Section 1: Student Information Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-x-4 sm:gap-y-8">
        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Supervisor(s)
          </h3>
          <div className="flex gap-2">
            <div className="flex flex-col">
              {currentSupervisor && currentSupervisor.length > 0
                ? currentSupervisor.map((supervisor) => (
                  <span key={supervisor.id} className="text-sm font-[Inter-Regular] text-gray-900">
                    {supervisor.title} {supervisor.name}
                  </span>
                ))
                : <span className="text-sm font-[Inter-Regular] text-gray-900">No supervisor assigned</span>}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Current Status
          </h3>
          <span
            style={{
              color: currentStatus?.definition?.color || "#6B7280",
              backgroundColor:
                `${currentStatus?.definition?.color}18` || "#F3F4F6",
              border: `1px solid ${currentStatus?.definition?.color || "#6B7280"
                }`,
            }}
            className="inline-flex px-2 py-0.5 rounded-[4px] text-sm font-[Inter-Regular] capitalize"
          >
            {currentStatus?.definition?.name || "Unknown"}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Total Time
          </h3>
          <span className="text-sm font-[Inter-Regular] text-gray-900">
            {totalDays} {expectedDays && `of ${expectedDays} days`}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Results Approved
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-[Inter-Regular] text-gray-900">
              {formatDate(student.resultsApprovedDate)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Results Sent to School
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-[Inter-Regular] text-gray-900">
              {formatDate(student.resultsSentDate)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-[Inter-Regular] text-[#626263] mb-1">
            Senate Approval
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-[Inter-Regular] text-gray-900">
              {formatDate(student.senateApprovalDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Timeline */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-[Inter-Regular] text-gray-500 mb-4">
          Timeline (Days)
        </h3>

        <div className="flex flex-col ">
          {/* Expected Completion Date Indicator */}
          {student?.expectedCompletionDate && (
            <div className="relative h-6 mb-1">
              <div
                className="absolute h-6 border-l-2 border-red-500 border-dashed"
                style={{
                  left: "100%",
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="absolute -left-[6px] top-0 w-3 h-3 bg-red-500 rounded-full" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        Expected Completion Date:{" "}
                        {new Date(
                          student.expectedCompletionDate
                        ).toLocaleDateString()}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Timeline Progress Bar */}
          <div className="space-y-2 overflow-x-auto pb-2 scrollbar-thin">
            <div className="relative h-8 bg-white shadow-md flex gap-1 min-w-[700px]">
              {studentStatuses?.statuses?.slice().reverse().map((status, index) =>
                renderTimelineBar(status, index)
              )}
            </div>
          </div>
          {/* Timeline Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 p-3 bg-white rounded-lg shadow-sm">
            {studentStatuses?.statuses?.slice().reverse().map(renderTimelineLegend)}
          </div>
        </div>
      </div>

      {/* Supervisor Table */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="w-full flex items-center justify-between mb-4">
          <h3 className="text-sm font-[Inter-Bold] text-gray-700 ">
            Supervisors
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          {supervisorsData.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                {supervisorsTable.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50">
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="text-left py-3 px-3 text-sm font-[Inter-Medium] text-gray-500 border-b"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supervisorsTable.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="py-2 px-3 text-sm font-[Inter-Regular] text-gray-900"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-4 px-3 text-sm text-center text-gray-500">
              No supervisors assigned
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Status Action Tracker and Proposal Table and Book Table */}
      <div className="bg-white rounded-lg py-2 space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          <button
            onClick={() => handleViewChange("tracker")}
            className={`text-sm font-[Inter-Medium] border py-1.5 px-3 rounded-lg !cursor-pointer select-none
              ${activeView === "tracker"
                ? "border-secondary-800 bg-secondary-100 text-primary-800"
                : "border-secondary-700 bg-white text-secondary-800"}`}
          >
            Status Action Tracker
          </button>

          <button
            onClick={() => handleViewChange("proposal")}
            className={`text-sm font-[Inter-Medium] border py-1.5 px-3 rounded-lg !cursor-pointer select-none
              ${activeView === "proposal"
                ? "border-secondary-800 bg-secondary-100 text-primary-950"
                : "border-secondary-700 bg-white text-secondary-800"}`}
          >
            Proposal
          </button>

          <button
            onClick={() => handleViewChange("book")}
            className={`text-sm font-[Inter-Medium] border py-1.5 px-3 rounded-lg !cursor-pointer select-none
              ${activeView === "book"
                ? "border-secondary-800 bg-secondary-100 text-primary-950"
                : "border-secondary-700 bg-white text-secondary-800"}`}
          >
            Dissertation
          </button>
        </div>

        {/* Content */}
        {/* Status Tracker Table */}
        {activeView === "tracker" && (
          <div className="px-4">
            <MyProfileProgressStatusTable
              statuses={studentStatuses?.statuses || []}
              isLoading={isLoadingStudentStatuses}
            />
          </div>
        )}

        {/* Proposal Table */}
        {activeView === "proposal" && (
          <div className="px-4">
            <MyProfileProgressProposalTable
              proposals={proposals?.proposals || []}
              isLoading={isLoadingProposals}
            />
          </div>
        )}

        {/* Book Table */}
        {activeView === "book" && (
          <div className="px-4">
            <MyProfileProgressBookTable
              books={books?.books || []}
              isLoading={isLoadingBooks}
            />
          </div>
        )}
      </div>

      {/* Supervisor Drawer */}
      {isSupervisorDrawerOpen && selectedSupervisor && (
        <div className="fixed inset-0  z-50 overflow-hidden">
          <div className="fixed inset-0 top-0 h-screen bg-black/30" onClick={() => setIsSupervisorDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full">
            <div className="w-screen max-w-md">
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-[Inter-Bold] text-gray-900">Supervisor Details</h2>
                    <button
                      onClick={() => setIsSupervisorDrawerOpen(false)}
                      className="bg-primary-500 text-white rounded-lg hover:bg-primary-800 flex items-center justify-center whitespace-nowrap text-sm"
                      style={{ width: "148px", height: "36px", gap: "8px" }}
                    >
                      <HiX className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-shrink-0 text-sm">Close Window</span>
                    </button>

                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-[Inter-Medium]">
                            {selectedSupervisor.title} {selectedSupervisor.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm font-[Inter-Medium]">
                            {selectedSupervisor.isCurrent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Current
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Previous
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Contact Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.workEmail || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.primaryPhone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Alternative Phone</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.alternativePhone || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                      <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Academic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.department || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Specialization</p>
                          <p className="text-sm font-[Inter-Medium]">{selectedSupervisor.specialization || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedSupervisor.notes && (
                      <div>
                        <h3 className="text-sm font-[Inter-Bold] text-gray-700 mb-3">Notes</h3>
                        <p className="text-sm font-[Inter-Regular] bg-gray-50 p-3 rounded-md">
                          {selectedSupervisor.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-center space-x-3">
                    <p className="text-sm text-gray-500">View-only mode</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfileProgressPage; 