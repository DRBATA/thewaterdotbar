-- Add pin_code and claimed_at columns to order_items
alter table public.order_items
  add column if not exists pin_code text not null default (lpad((floor(random()*10000))::int::text, 4, '0')),
  add column if not exists claimed_at timestamptz;

create index if not exists order_items_pin_code_idx on public.order_items(pin_code);
