<?php

namespace App\Policies;

use App\Models\Schedule;
use App\Models\User;

class SchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasManagerPermission('view');
    }

    public function create(User $user): bool
    {
        return $user->hasManagerPermission('create');
    }

    public function update(User $user, Schedule $schedule): bool
    {
        return $user->hasManagerPermission('update');
    }

    public function delete(User $user, Schedule $schedule): bool
    {
        return $user->hasManagerPermission('delete');
    }
}