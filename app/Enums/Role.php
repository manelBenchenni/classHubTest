<?php

namespace App\Enums;

enum Role: string
{
    case PrincipalManager = 'principal_manager';
    case SecondaryManager = 'secondary_manager';
    case Teacher = 'teacher';
    case Student = 'student';
}

