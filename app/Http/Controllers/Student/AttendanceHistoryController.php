<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceHistoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $attendances = Attendance::with('schedule:id,subject')
            ->where('student_id', $request->user()->id)
            ->where('status', 'absent')
            ->orderByDesc('date')
            ->paginate(20);

        return Inertia::render('Student/Absences', [
            'absences' => $attendances,
        ]);
    }
}