<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained()->restrictOnDelete();
            $table->foreignId('student_id')->constrained('users')->restrictOnDelete();
            $table->date('date');
            $table->enum('status', ['present', 'absent']);
            $table->foreignId('marked_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            // One record per student, per session, per date (safe even with concurrent requests)
            $table->unique(['schedule_id', 'student_id', 'date']);

            // Student absence history
            $table->index(['student_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};