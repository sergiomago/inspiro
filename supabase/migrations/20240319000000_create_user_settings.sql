create table public.user_settings (
    user_id uuid references auth.users(id) on delete cascade primary key,
    notifications_enabled boolean default false,
    frequency text default 'daily',
    time1 text default '08:00',
    time2 text default '20:00',
    quote_source text default 'mixed'
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Create policy to allow users to read their own settings
create policy "Users can read their own settings"
    on public.user_settings
    for select
    using (auth.uid() = user_id);

-- Create policy to allow users to update their own settings
create policy "Users can update their own settings"
    on public.user_settings
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Create policy to allow users to insert their own settings
create policy "Users can insert their own settings"
    on public.user_settings
    for insert
    with check (auth.uid() = user_id);