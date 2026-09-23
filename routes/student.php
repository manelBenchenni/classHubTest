<?php

use App\Http\Controllers\Student\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Student\AttendanceHistoryController;

Route::middleware(['auth', 'active', 'role:student', 'password.changed'])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        
Route::get('/absences', AttendanceHistoryController::class)->name('absences.index');

    });