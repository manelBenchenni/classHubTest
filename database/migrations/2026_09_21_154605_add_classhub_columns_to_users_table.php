<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Least privilege by default: a user without an explicit role is a student
            $table->enum('role', ['principal_manager', 'secondary_manager', 'teacher', 'student'])
                ->default('student')
                ->after('password');

            // Safe by default: nobody is active unless a manager (or the seeder) says so
            $table->enum('status', ['pending', 'active', 'rejected', 'disabled'])
                ->default('pending')
                ->after('role');

            $table->boolean('must_change_password')->default(false)->after('status');

            // A student belongs to one room at a time (teachers/managers keep it null)
            $table->foreignId('room_id')
                ->nullable()
                ->after('must_change_password')
                ->constrained('rooms')
                ->restrictOnDelete();

            $table->softDeletes();

            $table->index(['role', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'status']);
            $table->dropConstrainedForeignId('room_id');
            $table->dropSoftDeletes();
            $table->dropColumn(['role', 'status', 'must_change_password']);
        });
    }
};