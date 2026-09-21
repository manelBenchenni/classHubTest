<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->restrictOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->restrictOnDelete();
            $table->string('subject');
            $table->unsignedTinyInteger('day_of_week'); // 1 = Monday ... 7 = Sunday (ISO)
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
            $table->softDeletes();

            // Used by the overlap checks (same teacher / same room on a given day)
            $table->index(['teacher_id', 'day_of_week']);
            $table->index(['room_id', 'day_of_week']);
        });

        // Last line of defence, the real validation stays in the Form Request
        // (requires MySQL 8.0.16+ or MariaDB 10.2+ to be enforced)
        DB::statement('ALTER TABLE schedules ADD CONSTRAINT schedules_day_check CHECK (day_of_week BETWEEN 1 AND 7)');
        DB::statement('ALTER TABLE schedules ADD CONSTRAINT schedules_time_check CHECK (end_time > start_time)');
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};