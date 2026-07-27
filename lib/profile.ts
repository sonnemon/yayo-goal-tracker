import * as ImagePicker from "expo-image-picker";

import { supabase } from "@/lib/supabase";

const BUCKET = "avatars";
const FILE_NAME = "avatar.jpg";

function avatarPath(userId: string): string {
  return `${userId}/${FILE_NAME}`;
}

async function ensurePhotoPermission(): Promise<void> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error(
      "Photo library access was denied. Enable it in Settings to pick a profile picture."
    );
  }
}

async function uploadAsset(
  userId: string,
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(avatarPath(userId), arrayBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(avatarPath(userId));

  // Cache-bust because the path is constant; upserts otherwise return
  // the stale image from the CDN.
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function saveAvatarUrl(url: string | null): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: url },
  });
  if (error) throw error;
}

/**
 * Open the photo library picker, upload the chosen image, and persist the
 * URL to the user's metadata. Returns the new URL (with cache-bust param)
 * or null if the user cancelled.
 */
export async function pickAndSaveAvatar(
  userId: string
): Promise<string | null> {
  await ensurePhotoPermission();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const url = await uploadAsset(userId, result.assets[0]);
  await saveAvatarUrl(url);
  return url;
}

/**
 * Delete the user's stored avatar and clear avatar_url from metadata.
 * Safe to call even when nothing is uploaded.
 */
export async function removeSavedAvatar(userId: string): Promise<void> {
  const { error: rmErr } = await supabase.storage
    .from(BUCKET)
    .remove([avatarPath(userId)]);
  // Storage returns no error when the path doesn't exist, but guard anyway.
  if (rmErr && !/not.*found/i.test(rmErr.message)) throw rmErr;

  await saveAvatarUrl(null);
}
