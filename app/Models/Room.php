<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'capacity'];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
        ];
    }

    public function students(): HasMany
    {
        return $this->hasMany(User::class)->where('role', Role::Student);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /** Attendance records for sessions held in this room (via schedules). */
    public function attendances(): HasManyThrough
    {
        return $this->hasManyThrough(Attendance::class, Schedule::class);
    }

    public function isFull(): bool
    {
        return $this->students()->count() >= $this->capacity;
    }
}