-- Migration to add Base64 profile picture support
-- Run these commands in your Neon PostgreSQL database

-- Add profile_pic_base64 column to users_profile table
ALTER TABLE users_profile 
ADD COLUMN profile_pic_base64 TEXT;

-- Add profile_pic_base64 column to admin_profile table  
ALTER TABLE admin_profile 
ADD COLUMN profile_pic_base64 TEXT;

-- Add profile_pic_base64 column to master_profile table
ALTER TABLE master_profile 
ADD COLUMN profile_pic_base64 TEXT;

-- Remove old profile_pic_path columns if they exist (optional cleanup)
-- ALTER TABLE users_profile DROP COLUMN IF EXISTS profile_pic_path;
-- ALTER TABLE admin_profile DROP COLUMN IF EXISTS profile_pic_path;
-- ALTER TABLE master_profile DROP COLUMN IF EXISTS profile_pic_path;