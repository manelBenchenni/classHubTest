<?php

use App\Http\Controllers\Teacher\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Teacher\AttendanceController;


Route::middleware(['auth', 'active', 'role:teacher', 'password.changed'])
    ->prefix('teacher')
    ->name('teacher.')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
Route::post('/attendance', [AttendanceController::class, 'store'])->name('attendance.store');

    });