import { supabase } from "./supabase";

export async function submitReview({
  rideId,
  reviewerId,
  reviewedUserId,
  rating,
  comment,
}: {
  rideId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment: string;
}) {
  return await supabase.rpc("submit_review", {
    p_ride_id: rideId,
    p_reviewer_id: reviewerId,
    p_reviewed_user_id: reviewedUserId,
    p_rating: rating,
    p_comment: comment,
  });
}

export async function getUserReviews(userId: string) {
  return await supabase
    .from("reviews")
    .select(`
      *,
      profiles!reviews_reviewer_id_fkey(
        full_name,
        profile_image
      )
    `)
    .eq("reviewed_user_id", userId)
    .order("created_at", {
      ascending: false,
    });
}

export async function hasReviewed(
  rideId: string,
  reviewerId: string
) {
  return await supabase
    .from("reviews")
    .select("id")
    .eq("ride_id", rideId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();
}