<?php

use App\Http\Controllers\Manager\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Manager\UserController;
use App\Http\Controllers\Manager\RoomController;
use App\Http\Controllers\Manager\ScheduleController;
use App\Http\Controllers\Manager\RoomAttendanceController;



    Route::middleware(['auth', 'active', 'role:principal_manager,secondary_manager', 'password.changed'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        Route::resource('users', UserController::class)->except(['create', 'edit', 'show']);

        Route::patch('users/{user}/accept', [UserController::class, 'accept'])->name('users.accept');
        Route::patch('users/{user}/reject', [UserController::class, 'reject'])->name('users.reject');
        Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
        Route::get('rooms/{room}/attendance', [RoomAttendanceController::class, 'index'])->name('rooms.attendance');


        Route::resource('rooms', RoomController::class)->except(['create', 'edit', 'show']);
        Route::patch('rooms/{room}/assign-student', [RoomController::class, 'assignStudent'])->name('rooms.assign-student');
        Route::delete('rooms/{room}/students/{student}', [RoomController::class, 'removeStudent'])->name('rooms.remove-student');


     

Route::resource('schedules', ScheduleController::class)->except(['create', 'edit', 'show']);
    });