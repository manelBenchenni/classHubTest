<p>Hello {{ $teacher->name }},</p>

<p>Here is your schedule for this week:</p>

<table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse;">
    <thead>
        <tr>
            <th>Day</th>
            <th>Subject</th>
            <th>Room</th>
            <th>Time</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($schedules as $s)
            <tr>
                <td>{{ \Carbon\Carbon::create()->startOfWeek()->addDays($s->day_of_week - 1)->format('l') }}</td>
                <td>{{ $s->subject }}</td>
                <td>{{ $s->room->name }}</td>
                <td>{{ substr($s->start_time, 0, 5) }}–{{ substr($s->end_time, 0, 5) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>