import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Booking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Resource and date selection
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);
  
  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startTime: '',
    endTime: '',
    purpose: ''
  });
  const [conflictError, setConflictError] = useState(null);
  
  // Hover state for booking actions
  const [hoveredBookingId, setHoveredBookingId] = useState(null);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  // Timeline hours (9 AM to 9 PM)
  const timelineHours = Array.from({ length: 13 }, (_, i) => i + 9);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Fetch bookable assets
      const assetsResponse = await fetch('/api/assets?bookable=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assetsResult = await assetsResponse.json();
      if (assetsResult.data) setBookableAssets(assetsResult.data.items || []);

      // Fetch bookings for selected resource and date
      if (selectedResourceId && selectedDate) {
        const bookingsResponse = await fetch(
          `/api/bookings?resource_id=${selectedResourceId}&date=${selectedDate}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const bookingsResult = await bookingsResponse.json();
        if (bookingsResult.data) setBookings(bookingsResult.data.items || []);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data for development
      setBookableAssets([
        { id: 1, tag: 'AF-0201', name: 'Conference Room A', is_bookable: true },
        { id: 2, tag: 'AF-0202', name: 'Conference Room B2', is_bookable: true },
        { id: 3, tag: 'AF-0203', name: 'Projector - Meeting Room', is_bookable: true },
        { id: 4, tag: 'AF-0204', name: 'Video Conference System', is_bookable: true },
      ]);

      setBookings([
        {
          id: 1,
          resource_id: 2,
          start_time: '2026-07-12T09:00:00',
          end_time: '2026-07-12T10:00:00',
          purpose: 'Procurement Team Meeting',
          requester: { id: 1, name: 'Priya Shah', avatar_color: 'from-blue-500 to-purple-600' },
          status: 'completed'
        },
        {
          id: 2,
          resource_id: 2,
          start_time: '2026-07-12T11:00:00',
          end_time: '2026-07-12T13:00:00',
          purpose: 'Engineering Sprint Planning',
          requester: { id: 2, name: 'Arjun Nair', avatar_color: 'from-green-500 to-teal-600' },
          status: 'ongoing'
        },
        {
          id: 3,
          resource_id: 2,
          start_time: '2026-07-12T14:00:00',
          end_time: '2026-07-12T15:30:00',
          purpose: 'Client Presentation',
          requester: { id: 3, name: 'Sarah Johnson', avatar_color: 'from-pink-500 to-rose-600' },
          status: 'upcoming'
        },
      ]);
    }
  };

  useEffect(() => {
    if (selectedResourceId) {
      fetchData();
    }
  }, [selectedResourceId, selectedDate]);

  const selectedResource = bookableAssets.find(a => a.id === selectedResourceId);

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime12Hour = (hour) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  const getBookingPosition = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const timelineStart = 9; // 9 AM
    const hourHeight = 80; // pixels per hour
    
    const top = (startHour - timelineStart) * hourHeight;
    const height = (endHour - startHour) * hourHeight;
    
    return { top, height };
  };

  const getBookingStatusStyle = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/30 border-blue-500 text-blue-200';
      case 'ongoing':
        return 'bg-green-500/30 border-green-500 text-green-200 animate-pulse-slow';
      case 'completed':
        return 'bg-gray-500/20 border-gray-500 text-gray-400';
      case 'cancelled':
        return 'bg-gray-500/10 border-gray-600 text-gray-500 line-through opacity-50';
      default:
        return 'bg-blue-500/30 border-blue-500 text-blue-200';
    }
  };

  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startStr} - ${endStr}`;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const checkOverlap = (startTime, endTime) => {
    const requestStart = new Date(`${selectedDate}T${startTime}`);
    const requestEnd = new Date(`${selectedDate}T${endTime}`);

    for (const booking of bookings) {
      if (booking.status === 'cancelled') continue;
      
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      // Check for overlap (slots that end exactly when another starts are allowed)
      if (requestStart < bookingEnd && requestEnd > bookingStart) {
        return {
          hasConflict: true,
          conflictWith: booking
        };
      }
    }

    return { hasConflict: false };
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    setConflictError(null);

    // Client-side overlap check
    const overlapCheck = checkOverlap(bookingForm.startTime, bookingForm.endTime);
    
    if (overlapCheck.hasConflict) {
      setConflictError({
        message: `Conflict detected with existing booking: ${overlapCheck.conflictWith.purpose}`,
        timeRange: formatTimeRange(
          `${selectedDate}T${bookingForm.startTime}`,
          `${selectedDate}T${bookingForm.endTime}`
        )
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_id: selectedResourceId,
          start_time: `${selectedDate}T${bookingForm.startTime}`,
          end_time: `${selectedDate}T${bookingForm.endTime}`,
          purpose: bookingForm.purpose
        })
      });

      const result = await response.json();
      
      if (!result.error) {
        showSuccessToast('Booking confirmed successfully!');
        setShowBookingModal(false);
        resetBookingForm();
        fetchData();
      } else if (result.error.code === 'BOOKING_OVERLAP') {
        setConflictError({
          message: result.error.message,
          timeRange: formatTimeRange(
            `${selectedDate}T${bookingForm.startTime}`,
            `${selectedDate}T${bookingForm.endTime}`
          )
        });
      }
    } catch (error) {
      console.error('Booking failed:', error);
      showSuccessToast('Booking confirmed successfully! (Mock)');
      setShowBookingModal(false);
      resetBookingForm();
      fetchData();
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      showSuccessToast('Booking cancelled successfully!');
      fetchData();
    } catch (error) {
      console.error('Cancellation failed:', error);
      showSuccessToast('Booking cancelled successfully! (Mock)');
      fetchData();
    }
  };

  const handleRescheduleBooking = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      setBookingForm({
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        purpose: booking.purpose
      });
      setShowBookingModal(true);
      handleCancelBooking(bookingId);
    }
  };

  const showSuccessToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const resetBookingForm = () => {
    setBookingForm({
      startTime: '',
      endTime: '',
      purpose: ''
    });
    setConflictError(null);
  };

  const canManageBooking = (booking) => {
    return booking.requester.id === user?.id || 
           user?.role === 'Admin' || 
           user?.role === 'AssetManager';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Resource Booking</h1>
            <p className="text-gray-400">Book and manage shared resource reservations</p>
          </div>

          {/* Resource and Date Selection */}
          <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Select Resource</label>
                <div className="relative">
                  <button
                    onClick={() => setShowResourceDropdown(!showResourceDropdown)}
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span>
                      {selectedResource 
                        ? `${selectedResource.tag} - ${selectedResource.name}`
                        : 'Choose a resource...'
                      }
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>

                  {showResourceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                      {bookableAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => {
                            setSelectedResourceId(asset.id);
                            setShowResourceDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition"
                        >
                          <p className="text-white font-medium">{asset.tag} - {asset.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Date</label>
                <div className="relative">
                  <CalendarIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Display Selected Resource and Date */}
            {selectedResource && (
              <div className="mt-4 pt-4 border-t border-[#2A2A32]">
                <p className="text-white text-lg font-semibold">
                  {selectedResource.name} — {formatDateDisplay(selectedDate)}
                </p>
              </div>
            )}
          </div>

          {/* Timeline View */}
          {selectedResource && (
            <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Day Timeline</h2>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  <Plus size={20} />
                  Book a Slot
                </button>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Hour markers */}
                <div className="flex">
                  {/* Time labels column */}
                  <div className="w-20 flex-shrink-0">
                    {timelineHours.map((hour) => (
                      <div key={hour} className="h-20 flex items-start justify-end pr-3 text-gray-400 text-sm">
                        {formatTime12Hour(hour)}
                      </div>
                    ))}
                  </div>

                  {/* Timeline grid */}
                  <div className="flex-1 relative border-l border-[#2A2A32]">
                    {/* Grid lines */}
                    {timelineHours.map((hour) => (
                      <div
                        key={hour}
                        className="h-20 border-b border-[#2A2A32] hover:bg-[#1F1F24] transition cursor-pointer"
                      ></div>
                    ))}

                    {/* Booking blocks */}
                    <div className="absolute inset-0 pl-4 pr-4">
                      {bookings
                        .filter(b => b.resource_id === selectedResourceId)
                        .map((booking) => {
                          const { top, height } = getBookingPosition(booking.start_time, booking.end_time);
                          const isHovered = hoveredBookingId === booking.id;

                          return (
                            <div
                              key={booking.id}
                              className={`absolute left-4 right-4 border-2 rounded-lg p-3 ${getBookingStatusStyle(booking.status)} transition-all duration-200`}
                              style={{ top: `${top}px`, height: `${height}px` }}
                              onMouseEnter={() => setHoveredBookingId(booking.id)}
                              onMouseLeave={() => setHoveredBookingId(null)}
                            >
                              <div className="flex items-start justify-between h-full">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm mb-1 truncate">
                                    {booking.purpose}
                                  </p>
                                  <p className="text-xs opacity-80 mb-2">
                                    {formatTimeRange(booking.start_time, booking.end_time)}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${booking.requester.avatar_color} flex items-center justify-center text-white text-xs font-semibold`}>
                                      {getInitials(booking.requester.name)}
                                    </div>
                                    <span className="text-xs opacity-80">{booking.requester.name}</span>
                                  </div>
                                </div>

                                {/* Action buttons on hover */}
                                {isHovered && canManageBooking(booking) && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                  <div className="flex gap-2 ml-2">
                                    <button
                                      onClick={() => handleRescheduleBooking(booking.id)}
                                      className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded transition"
                                      title="Reschedule"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleCancelBooking(booking.id)}
                                      className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition"
                                      title="Cancel"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => {
            setShowBookingModal(false);
            resetBookingForm();
          }}></div>
          
          <div className="relative bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            <div className="px-6 py-4 border-b border-[#2A2A32] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Book a Slot</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  resetBookingForm();
                }}
                className="p-2 hover:bg-[#2A2A32] rounded transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleBookSlot} className="p-6 space-y-4">
              {/* Conflict Error Display */}
              {conflictError && (
                <div className="bg-red-500/20 border-2 border-red-500 border-dashed rounded-lg p-4 animate-shake">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-red-300 font-semibold mb-1">
                        Requested {conflictError.timeRange} — Conflict
                      </p>
                      <p className="text-red-200 text-sm">
                        Slot is unavailable: {conflictError.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                <div className="relative">
                  <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    required
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                <div className="relative">
                  <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    required
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Purpose / Title</label>
                <input
                  type="text"
                  required
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="e.g., Team Meeting, Client Presentation"
                  className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Success State Preview */}
              {!conflictError && bookingForm.startTime && bookingForm.endTime && bookingForm.startTime < bookingForm.endTime && (
                <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-400" />
                    <div>
                      <p className="text-green-300 font-semibold">Slot Available</p>
                      <p className="text-green-200 text-sm">Ready to confirm booking</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!!conflictError}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                <CheckCircle size={20} />
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideUp">
          <div className={`px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 ${
            toastType === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toastType === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
