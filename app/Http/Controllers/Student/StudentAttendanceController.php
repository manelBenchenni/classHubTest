<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * A student's own attendance history. Point 3.4: "Consulter son
     * historique d'absences." Shown as full history (present + absent) so
     * the student has context, not just a bare absence count.
     */
    public function index(Request $request): Response
    {
        $student = $request->user();

        $attendances = $student->attendancesTaken()
            ->with(['schedule:id,subject,room_id', 'schedule.room:id,name'])
            ->orderByDesc('date')
            ->paginate(20);

        $absenceCount = $student->attendancesTaken()->where('status', 'absent')->count();

        return Inertia::render('Student/Attendance/Index', [
            'attendances' => $attendances,
            'absenceCount' => $absenceCount,
        ]);
    }
}