<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $teacher = $request->user();

        $schedules = $teacher->teachingSchedules()
            ->with('room:id,name')
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Teacher/Dashboard', [
            'schedules' => $schedules,
        ]);
    }
}