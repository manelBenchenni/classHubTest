<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WeeklyScheduleRecap extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $teacher,
        public Collection $schedules,
    ) {}

    public function build()
    {
        return $this->subject('Your schedule for this week')
            ->view('emails.weekly-schedule-recap');
    }
}