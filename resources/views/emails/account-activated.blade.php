<x-mail::message>
# Your account is active

Hi {{ $user->name }},

Your ClassHub account has been approved and is now active.

<x-mail::button :url="route('login')">
Sign in
</x-mail::button>
</x-mail::message>