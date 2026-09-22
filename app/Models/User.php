<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * role, status, room_id and must_change_password are deliberately NOT
     * here: they are always set explicitly in controllers (User::create([
     * 'role' => ..., 'status' => ... ]) or forceFill()), never through
     * mass assignment from a request payload. Keeping them fillable would
     * let a crafted request (e.g. on the public registration form) set its
     * own role or status.
     */
    protected $fillable = ['name', 'email', 'password','status', 'role', 'room_id', 'must_change_password'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'role' => Role::class,
        'status' => UserStatus::class,
        'must_change_password' => 'boolean',
        'email_verified_at' => 'datetime',
    ];

    // ---------------------------------------------------------------- Relations

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function permissions(): HasOne
    {
        return $this->hasOne(ManagerPermission::class);
    }

    public function teachingSchedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'teacher_id');
    }

    public function attendancesTaken(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    // ------------------------------------------------------------------ Helpers

    public function isPrincipalManager(): bool
    {
        return $this->role === Role::PrincipalManager;
    }

    public function isSecondaryManager(): bool
    {
        return $this->role === Role::SecondaryManager;
    }

    public function isManager(): bool
    {
        return in_array($this->role, [Role::PrincipalManager, Role::SecondaryManager], true);
    }

    public function isTeacher(): bool
    {
        return $this->role === Role::Teacher;
    }

    public function isStudent(): bool
    {
        return $this->role === Role::Student;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    public function hasManagerPermission(string $action): bool
    {
        if ($this->isPrincipalManager()) {
            return true;
        }

        if (! $this->isSecondaryManager()) {
            return false;
        }

        $perm = $this->permissions;

        return (bool) match ($action) {
            'view' => $perm?->can_view,
            'create' => $perm?->can_create,
            'update' => $perm?->can_update,
            'delete' => $perm?->can_delete,
            default => false,
        };
    }

    /**
     * Where a fresh login (or a stray visit to /dashboard) should land,
     * based on role. Add a branch here as teacher/student areas are built.
     */
    public function dashboardRouteName(): string
    {
        return match (true) {
            $this->isManager() => 'manager.dashboard',
            $this->isTeacher() => 'teacher.dashboard',
            $this->isStudent() => 'student.dashboard',
            default => 'manager.dashboard', // temporary fallback until those exist
        };
    }
}