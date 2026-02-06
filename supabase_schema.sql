-- Profiles Table
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  avatar_url text null,
  is_verified boolean null default false,
  provider text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone_number text null,
  profile_image text null,
  is_admin boolean default false, -- Added for admin check logic
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Categories Table
create table public.categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  image_url text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  "order" integer null,
  constraint categories_pkey primary key (id),
  constraint categories_name_key unique (name),
  constraint categories_order_key unique ("order"),
  constraint categories_slug_key unique (slug)
) TABLESPACE pg_default;

-- Products Table
create table public.products (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  price numeric(10, 2) not null,
  sale_price numeric(10, 2) null,
  currency text null default 'INR'::text,
  category_id uuid not null,
  stock integer null default 0,
  sku text null,
  thumbnail_url text null,
  is_active boolean null default true,
  is_featured boolean null default false,
  meta_title text null,
  meta_description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_wishlisted boolean null,
  images text[] null,
  sizes text[] null,
  constraint products_pkey primary key (id),
  constraint products_sku_key unique (sku),
  constraint products_slug_key unique (slug),
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists idx_products_category_id on public.products using btree (category_id);
create index IF not exists idx_products_is_active on public.products using btree (is_active);
create index IF not exists idx_products_price on public.products using btree (price);

-- Orders Table
create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text not null,
  phone text not null,
  address text not null,
  amount numeric not null,
  payment_method text not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  order_code text null,
  constraint orders_pkey primary key (id),
  constraint orders_order_code_key unique (order_code),
  constraint orders_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Order Items Table
create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  product_id uuid not null,
  qty integer not null,
  price numeric not null,
  created_at timestamp with time zone null default now(),
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_items_product_id_fkey foreign KEY (product_id) references products (id)
) TABLESPACE pg_default;

-- Hero Banners Table
create table public.hero_banners (
  id uuid not null default gen_random_uuid (),
  title text not null,
  subtitle text null,
  image_url text not null,
  mobile_image_url text null,
  cta_text text null,
  cta_link text null,
  position integer null default 1,
  is_active boolean null default true,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint hero_banners_pkey primary key (id)
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- Simple Admin Policy (for demo/minimalist admin panel)
-- In a real app, users would have 'select' access to their own orders.
CREATE POLICY "Admins have full access on profiles" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins have full access on categories" ON categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins have full access on products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins have full access on orders" ON orders FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins have full access on order_items" ON order_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins have full access on hero_banners" ON hero_banners FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Public select access on hero_banners" ON hero_banners FOR SELECT USING (true);

-- Storage Configuration
-- Create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for categories bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
CREATE POLICY "Admin Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'categories' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'categories' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'categories' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));

-- Policies for products bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));

-- Policies for banner-images bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'banner-images');
CREATE POLICY "Admin Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banner-images' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'banner-images' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'banner-images' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    NOT EXISTS (SELECT 1 FROM public.profiles) -- First user is admin
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
