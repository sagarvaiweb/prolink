import { toast } from "sonner";
import {
  useDeletePostMutation,
  useUpdatePostMutation,
} from "@/redux/features/posts/postsApi";
import { getPostErrorMessage } from "@/components/posts/postErrors";

export default function usePostManagement() {
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  const handleUpdatePost = async (postId: string, formData: FormData) => {
    try {
      await updatePost({ postId, formData }).unwrap();
      toast.success("Post updated.");
      return true;
    } catch (error) {
      toast.error(getPostErrorMessage(error));
      return false;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId).unwrap();
      toast.success("Post deleted.");
      return true;
    } catch (error) {
      toast.error(getPostErrorMessage(error));
      return false;
    }
  };

  return {
    handleUpdatePost,
    handleDeletePost,
    isUpdating,
    isDeleting,
  };
}
