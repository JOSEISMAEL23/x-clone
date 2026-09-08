-- ============================================================
-- ESQUEMA COMPLETO DE LA BASE DE DATOS — Clon de X
-- Este archivo junta TODO el SQL que ejecutamos durante el proyecto,
-- ya en su versión final y corregida (incluye el arreglo del bug de
-- Storage que encontramos en la Fase 6). Pensado para correrlo de
-- una sola vez en un proyecto de Supabase nuevo.
-- ============================================================


-- ------------------------------------------------------------
-- 1) TABLAS
-- ------------------------------------------------------------

-- profiles: extiende a auth.users (que maneja Supabase) con los datos
-- "públicos" de cada usuario. El id es el MISMO id que en auth.users
-- (por eso "references auth.users(id)"), así que no hace falta generar
-- un id nuevo aquí.
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

-- tweets: cada fila es una publicación. user_id apunta a quién la escribió.
-- on delete cascade significa: si se borra el perfil, se borran sus tweets
-- automáticamente (no quedan tweets "huérfanos" sin autor).
create table tweets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 280),
  created_at timestamp with time zone default now()
);

-- likes: tabla "puente" entre usuarios y tweets (relación muchos-a-muchos).
-- El unique(user_id, tweet_id) evita que la misma persona pueda dar like
-- dos veces al mismo tweet.
create table likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  tweet_id uuid references tweets(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique (user_id, tweet_id)
);

-- follows: tabla "puente" entre usuarios y usuarios (relación muchos-a-
-- muchos, pero de la MISMA tabla con ella misma — por eso tiene dos
-- columnas que apuntan a profiles). El check evita que alguien se siga
-- a sí mismo.
create table follows (
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);


-- ------------------------------------------------------------
-- 2) ROW LEVEL SECURITY (RLS) de las tablas
-- ------------------------------------------------------------
-- RLS es el sistema de Postgres/Supabase que decide, fila por fila, quién
-- puede leer/insertar/actualizar/borrar qué. Sin políticas explícitas,
-- una vez activado RLS, la respuesta por defecto es "nadie puede hacer nada".

alter table profiles enable row level security;
alter table tweets enable row level security;
alter table likes enable row level security;
alter table follows enable row level security;

-- LECTURA: pública para todos (como una red social real, cualquiera puede
-- ver perfiles, tweets, likes y follows sin necesitar sesión).
create policy "Perfiles visibles" on profiles for select using (true);
create policy "Tweets visibles" on tweets for select using (true);
create policy "Likes visibles" on likes for select using (true);
create policy "Follows visibles" on follows for select using (true);

-- ESCRITURA: cada quien solo puede crear/editar/borrar SUS PROPIOS datos.
-- auth.uid() devuelve el id del usuario autenticado que está haciendo la
-- petición en ese momento (viene del token JWT de la sesión).
create policy "Crear mi perfil" on profiles for insert with check (auth.uid() = id);
create policy "Editar mi perfil" on profiles for update using (auth.uid() = id);

create policy "Crear mis tweets" on tweets for insert with check (auth.uid() = user_id);
create policy "Borrar mis tweets" on tweets for delete using (auth.uid() = user_id);

create policy "Dar like" on likes for insert with check (auth.uid() = user_id);
create policy "Quitar mi like" on likes for delete using (auth.uid() = user_id);

create policy "Seguir a alguien" on follows for insert with check (auth.uid() = follower_id);
create policy "Dejar de seguir" on follows for delete using (auth.uid() = follower_id);


-- ------------------------------------------------------------
-- 3) TRIGGER: crear automáticamente el perfil al registrarse
-- ------------------------------------------------------------
-- Cuando Supabase Auth crea una fila nueva en auth.users (alguien se
-- registra), este trigger se dispara automáticamente y crea la fila
-- correspondiente en profiles, leyendo username/full_name desde los
-- "metadatos" que mandamos en signUp() (ver AuthContext.jsx).

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ------------------------------------------------------------
-- 4) STORAGE: bucket de avatares y sus políticas
-- ------------------------------------------------------------
-- El bucket "avatars" se crea desde el Dashboard (Storage → New bucket →
-- marcar "Public bucket"), no por SQL — por eso no aparece un "create
-- bucket" aquí. Lo que sí va por SQL son las políticas de seguridad.
--
-- NOTA IMPORTANTE (el bug que depuramos en la Fase 6):
-- Aunque el bucket sea "público", eso solo afecta la URL pública de
-- DESCARGA de archivos. Subir (insert) y actualizar (update) un archivo
-- SIEMPRE necesita su política explícita. Y además: Supabase intenta
-- "leer de vuelta" la fila que acabas de insertar para devolverla en la
-- respuesta — esa lectura interna TAMBIÉN pasa por RLS. Por eso, sin una
-- política de SELECT, el insert fallaba con "row-level security policy"
-- aunque la política de insert estuviera perfecta.

-- Lectura: cualquiera puede ver los avatares (la pieza que nos faltaba).
create policy "Avatares visibles para todos"
on storage.objects for select
using (bucket_id = 'avatars');

-- Inserción: solo subes archivos dentro de tu propia carpeta. El path se
-- construye en EditProfile.jsx como `${user.id}/avatar.ext`, y
-- storage.foldername(name)[1] extrae justo esa primera carpeta del path
-- para compararla con tu auth.uid().
create policy "Subir mi propio avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Actualización: mismo criterio, para cuando reemplazas tu foto (upsert: true).
create policy "Actualizar mi propio avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
