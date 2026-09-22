<x-mail::message>
# Welcome to ClassHub

Hi {{ $user->name }},

An account has been created for you.

- **Email:** {{ $user->email }}
- **Temporary password:** {{ $temporaryPassword }}

You'll be asked to set a new password the first time you sign in.

<x-mail::button :url="route('login')">
Sign in
</x-mail::button>

Thanks,<br>
ClassHub
</x-mail::message>