<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\User;
use App\Enums\UserStatus;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
   public function __invoke(): Response
{
    return Inertia::render('Manager/Dashboard', [
        'stats' => [
            'totalUsers' => User::count(),
            'pendingUsers' => User::where('status', UserStatus::Pending)->count(),
            'totalRooms' => Room::count(),
            'totalSchedules' => Schedule::count(),
        ],
    ]);
}
}