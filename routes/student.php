<?php

use App\Http\Controllers\Student\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'active', 'role:student', 'password.changed'])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');
    });