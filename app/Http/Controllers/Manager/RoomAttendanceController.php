<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RoomAttendanceController extends Controller
{
    /**
     * Attendance records for one room, most recent first, optionally
     * filtered to a single date. Point 8: "Le Manager consulte les
     * présences et absences par salle."
     */
    public function index(Request $request, Room $room): Response
    {
        Gate::authorize('view');

        $attendances = Attendance::query()
            ->whereHas('schedule', fn ($q) => $q->where('room_id', $room->id))
            ->with(['student:id,name', 'schedule:id,subject,start_time,end_time'])
            ->when($request->date, fn ($q, $date) => $q->where('date', $date))
            ->orderByDesc('date')
            ->orderBy('student_id')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Manager/Rooms/Attendance', [
            'room' => $room->only(['id', 'name', 'capacity']),
            'attendances' => $attendances,
            'filters' => $request->only('date'),
        ]);
    }
}