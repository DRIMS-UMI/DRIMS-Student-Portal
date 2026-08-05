import React from 'react';
import { GraduationCap, BookOpen, MapPin, BadgeCheck, UserCheck } from 'lucide-react';
import { useGetLoggedInUser, useGetStudentProfile } from '../../store/tanstackStore/services/queries';

const DashboardIdentityStrip = () => {
  const { data: userData } = useGetLoggedInUser();
  const { data: profileData } = useGetStudentProfile();

  const user = userData?.user;
  const student = profileData?.student;
  const currentStatus = student?.statuses?.[0];
  const statusColor = currentStatus?.definition?.color || '#25369B';
  const supervisors = student?.supervisors || [];

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#25369B] text-white font-semibold text-lg flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{user?.name || 'Student'}</div>
            <div className="text-sm text-gray-500">
              {user?.registrationNumber ? `Reg No: ${user.registrationNumber}` : 'Registration number'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {student?.programLevel && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
              <GraduationCap className="w-3.5 h-3.5" />
              {student.programLevel}
            </span>
          )}
          {student?.course?.name && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
              <BookOpen className="w-3.5 h-3.5" />
              {student.course.name}
            </span>
          )}
          {student?.campus?.name && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
              <MapPin className="w-3.5 h-3.5" />
              {student.campus.name}
            </span>
          )}
          {currentStatus?.definition?.name && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ color: statusColor, backgroundColor: `${statusColor}1A`, border: `1px solid ${statusColor}40` }}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              {currentStatus.definition.name}
            </span>
          )}
        </div>

        {supervisors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {supervisors.map((sup, idx) => (
              <span
                key={sup.id || idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#25369B] bg-blue-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {sup.title ? `${sup.title} ${sup.name}` : sup.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardIdentityStrip;
