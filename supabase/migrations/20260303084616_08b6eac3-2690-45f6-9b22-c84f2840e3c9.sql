
-- Enum for gender
CREATE TYPE public.gender_type AS ENUM ('male', 'female');

-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'user');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  member_id UUID, -- will reference family_members after it's created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Family members table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  birth_place TEXT,
  birth_date DATE,
  death_place TEXT,
  death_date DATE,
  photo_url TEXT,
  address TEXT,
  phone TEXT,
  bio TEXT,
  father_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  mother_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Everyone can view family members (public tree)
CREATE POLICY "Anyone can view family members" ON public.family_members FOR SELECT USING (true);

-- Superadmins can do everything
CREATE POLICY "Superadmins can insert family members" ON public.family_members FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'superadmin') OR auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can update family members" ON public.family_members FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin') OR auth.uid() = created_by);

CREATE POLICY "Superadmins can delete family members" ON public.family_members FOR DELETE
  USING (public.has_role(auth.uid(), 'superadmin') OR auth.uid() = created_by);

-- Add FK from profiles.member_id to family_members
ALTER TABLE public.profiles ADD CONSTRAINT profiles_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.family_members(id) ON DELETE SET NULL;

-- Marriages table (supports multi-spouse)
CREATE TABLE public.marriages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spouse1_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  spouse2_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE NOT NULL,
  marriage_date DATE,
  divorce_date DATE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(spouse1_id, spouse2_id)
);

ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marriages" ON public.marriages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert marriages" ON public.marriages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can update marriages" ON public.marriages FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin') OR auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can delete marriages" ON public.marriages FOR DELETE
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- Default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);
