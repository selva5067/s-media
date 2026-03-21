export default function PostCard({ post }) {
  return (
    <div>
      <h4>{post.userId.username}</h4>
      <p>{post.content}</p>
      <p>Likes: {post.likes.length}</p>
    </div>
  );
}