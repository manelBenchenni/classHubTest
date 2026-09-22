<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendence extends Model
{
    protected $fillable = ['schedule_id', 'student_id', 'date', 'status']; // no SoftDeletes needed here usually
protected $casts = ['date' => 'date'];

public function schedule(): BelongsTo { return $this->belongsTo(Schedule::class); }
public function student(): BelongsTo { return $this->belongsTo(User::class, 'student_id'); }
}
