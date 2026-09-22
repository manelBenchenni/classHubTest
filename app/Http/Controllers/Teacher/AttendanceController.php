<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Show today's (or a chosen date's) sessions for this teacher, and,
     * if a schedule is selected, the room's students with any existing
     * attendance already marked for that date.
     */
    public function index(Request $request): Response
    {
        $teacher = $request->user();
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();

        // Only show sessions that actually recur on this date's weekday
        $todaysSchedules = $teacher->teachingSchedules()
            ->with('room:id,name')
            ->where('day_of_week', $date->isoWeekday())
            ->orderBy('start_time')
            ->get();

        $selectedSchedule = null;
        $students = [];

        if ($request->schedule_id) {
            $selectedSchedule = $teacher->teachingSchedules()
                ->with('room.students')
                ->findOrFail($request->schedule_id); // scoped to this teacher — 404s if it's not theirs

            $existing = Attendance::where('schedule_id', $selectedSchedule->id)
                ->where('date', $date->toDateString())
                ->pluck('status', 'student_id');

            $students = $selectedSchedule->room->students->map(fn ($student) => [
                'id' => $student->id,
                'name' => $student->name,
                'status' => $existing[$student->id] ?? null,
            ]);
        }

        return Inertia::render('Teacher/Attendance/Index', [
            'date' => $date->toDateString(),
            'todaysSchedules' => $todaysSchedules,
            'selectedSchedule' => $selectedSchedule,
            'students' => $students,
        ]);
    }

    /**
     * Bulk-mark attendance for one schedule/date. Uses updateOrCreate so
     * same-day corrections just overwrite the existing record instead of
     * violating the (schedule_id, student_id, date) unique constraint.
     */
    public function store(Request $request): RedirectResponse
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'schedule_id' => ['required', 'exists:schedules,id'],
            'date' => ['required', 'date'],
            'statuses' => ['required', 'array'],
            'statuses.*.student_id' => ['required', 'exists:users,id'],
            'statuses.*.status' => ['required', 'in:present,absent'],
        ]);

        $schedule = $teacher->teachingSchedules()->with('room')->findOrFail($validated['schedule_id']);
        $date = Carbon::parse($validated['date']);

        if ($date->isFuture()) {
            throw ValidationException::withMessages(['date' => 'You cannot mark attendance for a future date.']);
        }

        if (! $date->isToday()) {
            throw ValidationException::withMessages(['date' => 'Attendance can only be corrected on the same day it was taken.']);
        }

        if ($date->isoWeekday() !== $schedule->day_of_week) {
            throw ValidationException::withMessages(['date' => 'This session does not occur on the selected date.']);
        }

        $roomStudentIds = $schedule->room->students()->pluck('users.id')->all();

        foreach ($validated['statuses'] as $entry) {
            if (! in_array($entry['student_id'], $roomStudentIds)) {
                continue; // silently skip anyone not actually in this room — defence in depth
            }

            Attendance::updateOrCreate(
                [
                    'schedule_id' => $schedule->id,
                    'student_id' => $entry['student_id'],
                    'date' => $date->toDateString(),
                ],
                [
                    'status' => $entry['status'],
                    'marked_by' => $teacher->id,
                ]
            );
        }

        return back()->with('status', 'Attendance saved.');
    }
}