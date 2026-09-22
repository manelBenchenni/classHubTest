<?php

namespace App\Enums;

enum UserStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Disabled = 'disabled';
    case Rejected = 'rejected'; // optional, per your F2 decision
}

