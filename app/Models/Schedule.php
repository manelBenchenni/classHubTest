<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Schedule extends Model
{
    use SoftDeletes;
protected $fillable = ['day', 'start_time', 'end_time', 'room_id', 'teacher_id', 'subject'];
protected $casts = ['start_time' => 'datetime:H:i', 'end_time' => 'datetime:H:i'];

public function room(): BelongsTo { return $this->belongsTo(Room::class); }
public function teacher(): BelongsTo { return $this->belongsTo(User::class, 'teacher_id'); }
public function attendances(): HasMany { return $this->hasMany(Attendance::class); }
}
