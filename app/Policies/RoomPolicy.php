<?php

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

class RoomPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasManagerPermission('view');
    }

    public function create(User $user): bool
    {
        return $user->hasManagerPermission('create');
    }

    public function update(User $user, Room $room): bool
    {
        return $user->hasManagerPermission('update');
    }

    public function delete(User $user, Room $room): bool
    {
        return $user->hasManagerPermission('delete');
    }
}