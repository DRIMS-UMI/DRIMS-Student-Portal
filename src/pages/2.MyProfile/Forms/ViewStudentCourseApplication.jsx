import React from 'react'
import { format, parseISO } from "date-fns";

const ViewStudentCourseApplication = ({studentData}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-[Inter-SemiBold] text-gray-900">
        Course Application
      </h2>
    </div>
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Course</label>
          <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200">
            {studentData?.student?.course?.title || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Academic Year</label>
          <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200">
            {studentData?.student?.academicYear || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Study Mode</label>
          <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200 capitalize">
            {studentData?.student?.studyMode || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Intake Period</label>
          <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200 capitalize">
            {studentData?.student?.intakePeriod || 'N/A'}
          </div>
        </div>
        <div>
            <label className="block text-sm font-[Inter-Medium] text-gray-700">Program Level</label>
          <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200 capitalize">
            {studentData?.student?.programLevel || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Specialization</label>
            <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200">
            {studentData?.student?.specialization?.name || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Completion Time (Years)</label>
            <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200">
            {studentData?.student?.completionTime || 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-[Inter-Medium] text-gray-700">Expected Completion Date</label>
          <div className="mt-2 p-2 bg-gray-50 rounded-[6px] text-base text-[Inter-Regular] border border-gray-200">
            {studentData?.student?.expectedCompletionDate ? format(parseISO(studentData.student.expectedCompletionDate), "yyyy-MM-dd") : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default ViewStudentCourseApplication 