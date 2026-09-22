<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $student = $request->user()->load('room');

        $schedules = $student->room
            ? $student->room->schedules()->with('teacher:id,name')->orderBy('day_of_week')->orderBy('start_time')->get()
            : collect();

        return Inertia::render('Student/Dashboard', [
            'room' => $student->room,
            'schedules' => $schedules,
        ]);
    }
}