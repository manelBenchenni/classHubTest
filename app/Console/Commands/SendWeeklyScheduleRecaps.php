<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Mail\WeeklyScheduleRecap;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendWeeklyScheduleRecaps extends Command
{
    protected $signature = 'classhub:send-weekly-recaps';
    protected $description = 'Send each teacher a single weekly recap of their schedule.';

    public function handle(): void
    {
        User::where('role', Role::Teacher)
            ->whereHas('teachingSchedules')
            ->with(['teachingSchedules' => fn ($q) => $q->with('room:id,name')->orderBy('day_of_week')->orderBy('start_time')])
            ->chunk(50, function ($teachers) {
                foreach ($teachers as $teacher) {
                    Mail::to($teacher)->queue(new WeeklyScheduleRecap($teacher, $teacher->teachingSchedules));
                }
            });

        $this->info('Weekly recap emails queued.');
    }
}