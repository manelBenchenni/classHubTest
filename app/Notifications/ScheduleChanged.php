<?php

namespace App\Notifications;

use App\Models\Schedule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ScheduleChanged extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param string $action 'created' or 'updated'
     */
    public function __construct(public Schedule $schedule, public string $action)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'schedule_changed',
            'message' => "Your schedule for {$this->schedule->subject} was {$this->action}.",
            'schedule_id' => $this->schedule->id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}