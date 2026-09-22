<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PrincipalManagerSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Manager Principal',
            'email' => 'manelmbnchenni@gmail.com',
            'password' => Hash::make('password 123'), 
            'role' => Role::PrincipalManager,
            'status' => UserStatus::Active,
            'must_change_password' => false, // seeded account, not a temp-password flow
        ]);
    }
}