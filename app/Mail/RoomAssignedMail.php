<?php

namespace App\Mail;

use App\Models\Room;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RoomAssignedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $student, public Room $room)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your room assignment');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.room-assigned');
    }
}