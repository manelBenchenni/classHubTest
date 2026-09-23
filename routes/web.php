<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

/**
 * Role-based redirector. Anything that lands here (a bookmark, a stale
 * "intended" URL saved by the auth middleware before login, a stray link)
 * is sent to the dashboard that matches the logged-in user's role, instead
 * of rendering a generic page that doesn't exist for every role.
 */
Route::get('/dashboard', function () {
    return redirect()->route(Auth::user()->dashboardRouteName());
})->middleware(['auth', 'password.changed'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
});

require __DIR__.'/auth.php';
require __DIR__.'/manager.php';
require __DIR__.'/teacher.php';
require __DIR__.'/student.php';