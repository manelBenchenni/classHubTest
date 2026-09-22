<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManagerPermission extends Model
{
    protected $fillable = ['user_id', 'can_view', 'can_create', 'can_update', 'can_delete'];

    protected $casts = [
        'can_view' => 'boolean',
        'can_create' => 'boolean',
        'can_update' => 'boolean',
        'can_delete' => 'boolean',
    ];

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}