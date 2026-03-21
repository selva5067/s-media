import { useEffect, useState } from "react";
import API from "../api/axios";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    API.get("/posts").then(res => setPosts(res.data));
  }, []);

  return (
    <div>
      <CreatePost setPosts={setPosts} />
      {posts.map(post => <PostCard key={post._id} post={post} />)}
    </div>
  );
}